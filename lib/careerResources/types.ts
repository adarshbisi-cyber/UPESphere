export type ResourceType =
  | 'google_sheet' | 'google_doc' | 'google_slides' | 'pdf' | 'xlsx' | 'docx' | 'pptx' | 'website' | 'video' | 'folder' | 'other'

export interface CareerResource {
  id: string
  title: string
  description: string | null
  category: string
  resourceType: ResourceType
  externalUrl: string
  actionLabel: string | null // null = frontend falls back to a per-type default, see constants.ts
  thumbnailUrl: string | null
  tags: string[]
  sortOrder: number
}
