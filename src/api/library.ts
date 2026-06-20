import { apiFetch } from './client'
import type { ContentResponse, LibraryItem } from '@/types/LibraryContent.ts'

export type { ContentResponse, LibraryItem }

export async function getLibraryPage(
  bearerToken: string,
  page = 1,
  size = 20,
  signal?: AbortSignal
): Promise<LibraryItem[]> {
  const path = `/library?page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`

  return apiFetch<LibraryItem[]>(path, { method: 'GET', signal }, bearerToken)
}

export async function getRecommendedLibrary(
  bearerToken: string,
  signal?: AbortSignal
): Promise<ContentResponse[]> {
  const path = '/recommended/library'

  return apiFetch<ContentResponse[]>(path, { method: 'GET', signal }, bearerToken)
}
