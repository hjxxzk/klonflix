import { apiFetch } from '@/api/client'
import type { Metadata } from '@/types/Metadata'

export async function fetchLibraryMetadata(
  id: string,
  accessToken?: string,
): Promise<Metadata | null> {
  const res = await apiFetch<Metadata>(`/library/${id}`, {}, accessToken)
  return (res as Metadata | undefined) ?? null
}

export type { Metadata }

