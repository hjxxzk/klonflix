import { apiFetch } from '@/api/client'
import type { ContentResponse } from '@/types/LibraryContent'

export function getWatchlist(accessToken: string, signal?: AbortSignal): Promise<ContentResponse[]> {
  return apiFetch<ContentResponse[]>('/watchlist', { method: 'GET', signal }, accessToken)
}

export function addToWatchlist(accessToken: string, contentId: string): Promise<void> {
  return apiFetch<void>(`/watchlist/${contentId}`, { method: 'POST' }, accessToken)
}

export function removeFromWatchlist(
  accessToken: string,
  contentId: string,
  signal?: AbortSignal,
): Promise<void> {
  return apiFetch<void>(`/watchlist/${contentId}`, { method: 'DELETE', signal }, accessToken)
}
