import { apiFetch } from '@/api/client'
import { browseLibrary } from '@/api/content'
import type { ContentPlaybackDetails, PlaybackResponse } from '@/types/ContentPlayback'

export function startPlayback(contentId: string, accessToken: string): Promise<PlaybackResponse> {
  return apiFetch<PlaybackResponse>(`/play/${contentId}`, { method: 'POST' }, accessToken)
}

export async function fetchPlaybackContent(
  contentId: string,
  accessToken: string,
): Promise<ContentPlaybackDetails | null> {
  const pageSize = 50
  const maxPages = 20

  for (let page = 1; page <= maxPages; page += 1) {
    const items = await browseLibrary(accessToken, page, pageSize)

    for (const item of items) {
      if (item.id === contentId) {
        if (!item.videoUri?.trim()) {
          return null
        }

        return {
          contentId: item.id,
          title: item.title,
          videoUri: item.videoUri,
          durationSec: item.durationSeconds ?? 0,
          videoLanguages: item.languages ?? [],
        }
      }

      for (const season of item.seasons ?? []) {
        for (const episode of season.episodes ?? []) {
          if (episode.id === contentId) {
            if (!episode.videoUri?.trim()) {
              return null
            }

            return {
              contentId: episode.id,
              title: episode.title || `Odcinek ${episode.number}`,
              videoUri: episode.videoUri,
              durationSec: episode.durationSeconds,
              videoLanguages: episode.languages ?? [],
            }
          }
        }
      }
    }

    if (items.length < pageSize) {
      break
    }
  }

  return null
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
