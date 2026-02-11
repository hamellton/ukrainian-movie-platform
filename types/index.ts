import { Movie, Admin, AdConfig, Episode, VideoLink, Prisma } from '@prisma/client'

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

export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TmdbMovieResult {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  genres?: TmdbGenre[]
  production_countries?: TmdbProductionCountry[]
  runtime?: number
  episode_run_time?: number[]
  imdb_id?: string
  media_type?: 'movie' | 'tv'
  original_title?: string
  original_name?: string
}

export interface TmdbSearchResponse {
  page: number
  results: TmdbMovieResult[]
  total_pages: number
  total_results: number
}

export interface TmdbMovieDetails extends TmdbMovieResult {
  genres: TmdbGenre[]
  production_countries: TmdbProductionCountry[]
  runtime: number
  episode_run_time?: number[]
  imdb_id?: string
  original_title: string
  original_name?: string
}

export type PrismaMovieWhereInput = Prisma.MovieWhereInput
export type PrismaMovieOrderByInput = Prisma.MovieOrderByWithRelationInput
export type PrismaAdConfigWhereInput = Prisma.AdConfigWhereInput

export interface EpisodeCreateInput {
  episodeNumber: number
  seasonNumber: number
  title: string
  description?: string
  duration?: number
  thumbnail?: string
  videoLinks?: Array<{
    url: string
    quality?: string
  }>
}

export interface VideoLinkCreateInput {
  url: string
  quality?: string
  source?: 'EMBED' | 'DIRECT' | 'PARSED'
  language?: string
  isActive?: boolean
}
