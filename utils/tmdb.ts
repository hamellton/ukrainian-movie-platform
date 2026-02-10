import axios from 'axios'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export async function searchMovies(query: string, page: number = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error: any) {
    console.error('TMDB search error:', error.response?.data || error.message)
    throw error
  }
}

export async function getMovieDetails(tmdbId: number, type: 'movie' | 'tv' = 'movie') {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'uk-UA',
        append_to_response: 'videos,images',
      },
    })
    return response.data
  } catch (error: any) {
    console.error('TMDB details error:', error.response?.data || error.message)
    throw error
  }
}

export async function getPopularMovies(page: number = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error: any) {
    console.error('TMDB popular error:', error.response?.data || error.message)
    throw error
  }
}

export async function getPopularSeries(page: number = 1) {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured. Please add it to .env file')
  }
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/tv/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        page: page,
        language: 'uk-UA',
      },
    })
    return response.data
  } catch (error: any) {
    console.error('TMDB popular series error:', error.response?.data || error.message)
    throw error
  }
}

export async function getGenres(type: 'movie' | 'tv' = 'movie') {
  try {
    const endpoint = type === 'movie' ? 'movie' : 'tv'
    const response = await axios.get(`${TMDB_BASE_URL}/genre/${endpoint}/list`, {
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

export function formatMovieFromTMDB(tmdbData: any, type: 'movie' | 'tv' = 'movie') {
  return {
    title: tmdbData.title || tmdbData.name,
    titleOriginal: tmdbData.original_title || tmdbData.original_name,
    description: tmdbData.overview || '',
    descriptionShort: (tmdbData.overview || '').substring(0, 200),
    poster: getImageUrl(tmdbData.poster_path),
    backdrop: getBackdropUrl(tmdbData.backdrop_path),
    releaseDate: tmdbData.release_date || tmdbData.first_air_date,
    genres: (tmdbData.genres || []).map((g: any) => g.name),
    countries: (tmdbData.production_countries || []).map((c: any) => c.name),
    rating: tmdbData.vote_average || 0,
    ratingCount: tmdbData.vote_count || 0,
    duration: tmdbData.runtime || (tmdbData.episode_run_time && tmdbData.episode_run_time[0]) || 0,
    type: type === 'movie' ? 'MOVIE' : 'SERIES',
    tmdbId: tmdbData.id,
    imdbId: tmdbData.imdb_id,
  }
}
