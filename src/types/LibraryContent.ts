export type LibraryItem = {
  id: string
  title?: string
  genre?: string
  releaseYear?: number
  available?: boolean
  thumbnailUrl?: string
  contentType?: ContentType
}

export enum ContentType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
}

export type EpisodeResponse = {
  id: string
  number: number
  title: string
  durationSeconds: number
  videoUri: string
  languages: String[]
}

export type SeasonResponse = {
  id: string
  number: number
  title: string
  episodes: EpisodeResponse[]
}

export type ContentResponse = {
  id: string
  type: string
  title: string
  description: string
  contentType: ContentType
  thumbnailUrl: string
  genre: string
  releaseYear: number
  available: boolean
  durationSeconds?: number
  videoUri?: string
  languages: string[]
  seasons: SeasonResponse[]
}
