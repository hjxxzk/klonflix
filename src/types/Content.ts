export type ContentType = 'MOVIE' | 'SERIES'

export type Genre = 'ACTION' | 'COMEDY' | 'DRAMA' | 'DOCUMENTARY' | 'HORROR'

export interface ContentRequest {
  type: ContentType
  title: string
  description?: string
  thumbnailUrl?: string
  genre: Genre
  releaseYear: number
  keywords?: string[]
  durationSeconds?: number
  videoUri?: string
  languages?: string[]
}

export interface SeasonRequest {
  number: number
  title: string
}

export interface EpisodeRequest {
  number: number
  title: string
  durationSeconds: number
  videoUri: string
  languages?: string[]
}

export interface EpisodeResponse {
  id: string
  number: number
  title: string
  durationSeconds: number
  videoUri: string
  languages: string[]
}

export interface SeasonResponse {
  id: string
  number: number
  title: string
  episodes: EpisodeResponse[]
}

export interface ContentResponse {
  id: string
  type: ContentType
  title: string
  description: string
  thumbnailUrl: string
  genre: Genre
  releaseYear: number
  available: boolean
  durationSeconds: number | null
  videoUri: string | null
  languages: string[]
  seasons: SeasonResponse[]
}

export interface LibraryPagination {
  page: number
  size: number
  itemCount: number
}

export interface LibraryPageResponse {
  contents: ContentResponse[]
  recommendations: { contentId: string; score: number; reason: string }[]
  pagination: LibraryPagination
}

export const GENRES: { value: Genre; label: string }[] = [
  { value: 'ACTION', label: 'Akcja' },
  { value: 'COMEDY', label: 'Komedia' },
  { value: 'DRAMA', label: 'Dramat' },
  { value: 'DOCUMENTARY', label: 'Dokument' },
  { value: 'HORROR', label: 'Horror' },
]

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  MOVIE: 'Film',
  SERIES: 'Serial',
}
