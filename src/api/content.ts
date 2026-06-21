import { apiFetch } from '@/api/client'
import type {
  ContentRequest,
  ContentResponse,
  EpisodeRequest,
  SeasonRequest,
} from '@/types/Content'

export function browseLibrary(
  accessToken: string,
  page = 1,
  size = 20,
  signal?: AbortSignal,
): Promise<ContentResponse[]> {
  return apiFetch<ContentResponse[]>(
    `/library?page=${page}&size=${size}`,
    { signal },
    accessToken,
  )
}

export function createContent(accessToken: string, body: ContentRequest): Promise<string> {
  return apiFetch<string>(
    '/admin/content',
    { method: 'POST', body: JSON.stringify(body) },
    accessToken,
  )
}

export function updateContent(
  accessToken: string,
  contentId: string,
  body: ContentRequest,
): Promise<void> {
  return apiFetch<void>(
    `/admin/content/${contentId}`,
    { method: 'PUT', body: JSON.stringify(body) },
    accessToken,
  )
}

export function deleteContent(accessToken: string, contentId: string): Promise<void> {
  return apiFetch<void>(`/admin/content/${contentId}`, { method: 'DELETE' }, accessToken)
}

export function addSeason(
  accessToken: string,
  seriesId: string,
  body: SeasonRequest,
): Promise<string> {
  return apiFetch<string>(
    `/admin/content/${seriesId}/seasons`,
    { method: 'POST', body: JSON.stringify(body) },
    accessToken,
  )
}

export function updateSeason(
  accessToken: string,
  seriesId: string,
  seasonId: string,
  body: SeasonRequest,
): Promise<void> {
  return apiFetch<void>(
    `/admin/content/${seriesId}/seasons/${seasonId}`,
    { method: 'PUT', body: JSON.stringify(body) },
    accessToken,
  )
}

export function addEpisode(
  accessToken: string,
  seriesId: string,
  seasonId: string,
  body: EpisodeRequest,
): Promise<string> {
  return apiFetch<string>(
    `/admin/content/${seriesId}/seasons/${seasonId}/episodes`,
    { method: 'POST', body: JSON.stringify(body) },
    accessToken,
  )
}

export function updateEpisode(
  accessToken: string,
  seriesId: string,
  seasonId: string,
  episodeId: string,
  body: EpisodeRequest,
): Promise<void> {
  return apiFetch<void>(
    `/admin/content/${seriesId}/seasons/${seasonId}/episodes/${episodeId}`,
    { method: 'PUT', body: JSON.stringify(body) },
    accessToken,
  )
}
