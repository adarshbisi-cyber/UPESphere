import { FileSpreadsheet, FileText, Presentation, Globe, Video, Folder, File, type LucideIcon } from 'lucide-react'
import type { ResourceType } from './types'

// One place mapping a resource_type to how it looks and what its button
// says by default — adding a new value to the DB's resource_type check
// constraint just means adding one entry here, not touching the page/card
// components at all.
export const RESOURCE_TYPE_META: Record<ResourceType, { label: string; icon: LucideIcon; defaultActionLabel: string }> = {
  google_sheet: { label: 'Google Sheet', icon: FileSpreadsheet, defaultActionLabel: 'Open Sheet' },
  google_doc: { label: 'Google Doc', icon: FileText, defaultActionLabel: 'Open Document' },
  google_slides: { label: 'Google Slides', icon: Presentation, defaultActionLabel: 'Open Slides' },
  pdf: { label: 'PDF', icon: FileText, defaultActionLabel: 'View Resource' },
  xlsx: { label: 'Excel', icon: FileSpreadsheet, defaultActionLabel: 'Download Template' },
  docx: { label: 'Word Document', icon: FileText, defaultActionLabel: 'Download' },
  pptx: { label: 'PowerPoint', icon: Presentation, defaultActionLabel: 'Download' },
  website: { label: 'Website', icon: Globe, defaultActionLabel: 'Visit Resource' },
  video: { label: 'Video', icon: Video, defaultActionLabel: 'Watch Now' },
  folder: { label: 'Collection', icon: Folder, defaultActionLabel: 'Open Folder' },
  other: { label: 'Resource', icon: File, defaultActionLabel: 'View Resource' },
}

export const ALL_CATEGORIES_FILTER = 'All'
