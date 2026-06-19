import { apiFetch } from '@/api/client'
import type { PlaybackResponse } from '@/types/ContentPlayback'

export function startPlayback(contentId: string, accessToken: string): Promise<PlaybackResponse> {
  return apiFetch<PlaybackResponse>(`/play/${contentId}`, { method: 'POST' }, accessToken)
}

export function saveProgress(
  contentId: string,
  positionSeconds: number,
  accessToken: string,
): Promise<void> {
  return apiFetch<void>(
    `/play/${contentId}/progress`,
    {
      method: 'PUT',
      body: JSON.stringify({ positionSeconds }),
    },
    accessToken,
  )
}

export function completePlayback(contentId: string, accessToken: string): Promise<void> {
  return apiFetch<void>(`/play/${contentId}/complete`, { method: 'POST' }, accessToken)
}

export function saveProgressOnUnload(
  contentId: string,
  positionSeconds: number,
  accessToken: string,
): void {
  const apiBase = import.meta.env.VITE_API_BASE_URL

  fetch(`${apiBase}/play/${contentId}/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ positionSeconds }),
    keepalive: true,
  }).catch(() => {})
}
