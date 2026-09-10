-- UPESphere — recommendation dismissals
--
-- Run after placement-tracker and practice-together migrations. Safe to re-run.
--
-- Recommendations themselves are never stored: they're derived from the
-- student's applications and practice sessions on every read, which is what
-- keeps them from duplicating or going stale (see lib/recommendations/types.ts).
-- The one thing a derivation can't know is that the student chose to dismiss
-- one, so that — and only that — is persisted here.
--
-- The signature, not an id, is what's stored: it encodes practice type plus
-- priority, so dismissing a MEDIUM "practise group discussions" doesn't
-- silence the HIGH one if that weakness later hardens.

create table if not exists public.recommendation_dismissals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  signature text not null,
  dismissed_at timestamptz not null default now(),
  -- Dismissing the same thing twice is a no-op, not a second row.
  unique (user_id, signature)
);

create index if not exists recommendation_dismissals_user_idx
  on public.recommendation_dismissals(user_id);

alter table public.recommendation_dismissals enable row level security;

drop policy if exists "Users manage own recommendation dismissals" on public.recommendation_dismissals;
create policy "Users manage own recommendation dismissals"
  on public.recommendation_dismissals for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
