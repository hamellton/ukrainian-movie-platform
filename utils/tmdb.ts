import axios, { AxiosError } from 'axios'
import { TmdbSearchResponse, TmdbMovieDetails, TmdbGenre, TmdbGenre as TmdbGenreType } from '@/types'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function handleTmdbError(error: unknown, context: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ status_message?: string }>
    console.error(`TMDB ${context} error:`, axiosError.response?.data || axiosError.message)
    throw new Error(axiosError.response?.data?.status_message || axiosError.message || `TMDB ${context} failed`)
  }
  if (error instanceof Error) {
    console.error(`TMDB ${context} error:`, error.message)
    throw error
  }
  throw new Error(`Unknown error in TMDB ${context}`)
}

export async function searchMovies(query: string, page: number = 1): Promise<TmdbSearchResponse> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get<TmdbSearchResponse>(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error) {
    handleTmdbError(error, 'search')
  }
}

export async function getMovieDetails(tmdbId: number, type: 'movie' | 'tv' = 'movie'): Promise<TmdbMovieDetails> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const response = await axios.get<TmdbMovieDetails>(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'uk-UA',
        append_to_response: 'videos,images',
      },
    })
    return response.data
  } catch (error) {
    handleTmdbError(error, 'details')
  }
}

export async function getPopularMovies(page: number = 1): Promise<TmdbSearchResponse> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get<TmdbSearchResponse>(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error) {
    handleTmdbError(error, 'popular movies')
  }
}

export async function getPopularSeries(page: number = 1): Promise<TmdbSearchResponse> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get<TmdbSearchResponse>(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error) {
    handleTmdbError(error, 'popular series')
  }
}

export async function getGenres(type: 'movie' | 'tv' = 'movie'): Promise<TmdbGenreType[]> {
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const response = await axios.get<{ genres: TmdbGenreType[] }>(`${TMDB_BASE_URL}/genre/${endpoint}/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'uk-UA',
      },
    })
    return response.data.genres || []
  } catch (error) {
    console.error('TMDB genres error:', error)
    return []
  }
}

export function getImageUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/placeholder-poster.jpg'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function getBackdropUrl(path: string | null, size: string = 'w1280'): string {
  if (!path) return '/placeholder-backdrop.jpg'
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function formatMovieFromTMDB(tmdbData: TmdbMovieDetails, type: 'movie' | 'tv' = 'movie') {
  const overview = tmdbData.overview || ''
  return {
    title: tmdbData.title || tmdbData.name || '',
    titleOriginal: tmdbData.original_title || tmdbData.original_name || '',
    description: overview || `${tmdbData.title || tmdbData.name || ''} - ${type === 'movie' ? 'фільм' : 'серіал'}`,
    descriptionShort: overview ? overview.substring(0, 200) : '',
    poster: getImageUrl(tmdbData.poster_path ?? null),
    backdrop: getBackdropUrl(tmdbData.backdrop_path ?? null),
    releaseDate: tmdbData.release_date || tmdbData.first_air_date || '',
    genres: (tmdbData.genres || []).map((g) => g.name),
    countries: (tmdbData.production_countries || []).map((c) => c.name),
    rating: tmdbData.vote_average || 0,
    ratingCount: tmdbData.vote_count || 0,
    duration: tmdbData.runtime || (tmdbData.episode_run_time && tmdbData.episode_run_time[0]) || 0,
    type: type === 'movie' ? 'MOVIE' : 'SERIES',
    tmdbId: tmdbData.id,
    imdbId: tmdbData.imdb_id,
  }
}
