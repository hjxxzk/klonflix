export interface Keyword {
  name: string
}

export interface Genre {
  name: string
}

export interface Metadata {
  title: string
  description: string
  thumbnailUrl: string
  genre: Genre
  releaseYear: number
  keywords: Keyword[]
}
