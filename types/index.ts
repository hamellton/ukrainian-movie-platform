import { Movie, Admin, AdConfig, Episode, VideoLink } from '@prisma/client'

export type MovieWithRelations = Movie & {
  videoLinks: VideoLink[]
  episodes: (Episode & { videoLinks: VideoLink[] })[]
}

export type EpisodeWithRelations = Episode & {
  videoLinks: VideoLink[]
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: string
}

export interface PaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface VideoLinkParsed {
  source: 'embed' | 'direct' | 'parsed'
  url: string
  quality?: string
}

export interface MovieCreateInput {
  title: string
  titleOriginal?: string
  description: string
  descriptionShort?: string
  poster: string
  backdrop?: string
  releaseDate: string | Date
  genres: string[]
  countries?: string[]
  rating?: number
  duration?: number
  type?: 'MOVIE' | 'SERIES'
  videoLinks?: Array<{
    url: string
    quality?: string
    source?: 'EMBED' | 'DIRECT' | 'PARSED'
  }>
  episodes?: Array<{
    episodeNumber: number
    seasonNumber: number
    title: string
    description?: string
    videoLinks?: Array<{
      url: string
      quality?: string
    }>
  }>
  tmdbId?: number
  imdbId?: string
}
