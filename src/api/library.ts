import { apiFetch } from './client'

export type LibraryItem = {
  id: string
  thumbnail?: string
  title?: string
}

export type LibraryPageResponse = {
  items: LibraryItem[]
  total: number
  page: number
  size: number
}

export async function getLibraryPage(
  bearerToken: string,
  page = 1,
  size = 20,
  signal?: AbortSignal
): Promise<LibraryPageResponse> {
  const path = `/library?page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`

  return apiFetch<LibraryPageResponse>(path, { method: 'GET', signal }, bearerToken)
}
