'use client'

// Data-access layer for the Career Resources library. Read-only from this
// app on purpose — RLS in supabase/career-resources-migration.sql has no
// insert/update/delete policy at all, so there's nothing here to write;
// resources are managed directly in the Supabase dashboard until an admin
// portal exists.

import { createClient } from '@/lib/supabase/client'
import type { CareerResource, ResourceType } from './types'

interface ResourceRow {
  id: string
  title: string
  description: string | null
  category: string
  resource_type: ResourceType
  external_url: string
  action_label: string | null
  thumbnail_url: string | null
  tags: string[] | null
  sort_order: number
}

function toResource(r: ResourceRow): CareerResource {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    resourceType: r.resource_type,
    externalUrl: r.external_url,
    actionLabel: r.action_label,
    thumbnailUrl: r.thumbnail_url,
    tags: r.tags ?? [],
    sortOrder: r.sort_order,
  }
}

export async function getPublishedResources(): Promise<CareerResource[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('career_resources')
    .select('id, title, description, category, resource_type, external_url, action_label, thumbnail_url, tags, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as ResourceRow[]).map(toResource)
}
