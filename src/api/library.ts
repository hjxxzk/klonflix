import { apiFetch } from './client'

export type LibraryItem = {
  id: string
  title?: string
  genre?: string
  releaseYear?: number
  available?: boolean
  thumbnailUrl?: string
}

export async function getLibraryPage(
  bearerToken: string,
  page = 1,
  size = 20,
  signal?: AbortSignal
): Promise<LibraryItem[]> {
  const path = `/library?page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`

  return apiFetch<LibraryItem[]>(path, { method: 'GET', signal }, bearerToken)
}
