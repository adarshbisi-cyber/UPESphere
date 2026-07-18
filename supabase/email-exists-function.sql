-- Sign-in helper: lets the login form tell "no account for this email" apart
-- from "wrong password", so it can show a helpful message + Create Account CTA
-- instead of a single generic error.
--
-- NOTE: this deliberately enables an email-existence check, which Supabase
-- hides by default (enumeration protection). It's an intentional product
-- trade-off — the function returns only a boolean and nothing else. If you'd
-- rather not expose it, skip this migration; the form falls back to the generic
-- "Incorrect email or password." message.

create or replace function public.email_exists(check_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.email_exists(text) to anon, authenticated;
