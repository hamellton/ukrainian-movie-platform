import { create } from 'zustand'
import { MovieWithRelations, TmdbMovieResult } from '@/types'

export interface EpisodeFormData {
  id?: string
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  videoLinks: string
}

export interface AdminFormData {
  title: string
  titleOriginal: string
  description: string
  descriptionShort: string
  poster: string
  backdrop: string
  releaseDate: string
  genres: string
  countries: string
  rating: string
  duration: string
  type: 'MOVIE' | 'SERIES' | 'ANIMATED_MOVIE' | 'ANIMATED_SERIES' | 'COLLECTION'
  videoLinks: string
  episodes: EpisodeFormData[]
}

export type ImportType = 'movies' | 'series' | 'popular' | 'animated-movies' | 'animated-series'

const initialFormData: AdminFormData = {
  title: '',
  titleOriginal: '',
  description: '',
  descriptionShort: '',
  poster: '',
  backdrop: '',
  releaseDate: '',
  genres: '',
  countries: '',
  rating: '',
  duration: '',
  type: 'MOVIE',
  videoLinks: '',
  episodes: [],
}

interface AdminState {
  activeTab: string
  movies: MovieWithRelations[]
  loading: boolean
  editingMovie: MovieWithRelations | null
  formData: AdminFormData
  importSearch: string
  importResults: TmdbMovieResult[]
  importLoading: boolean
  importPage: number
  importType: ImportType
  setActiveTab: (tab: string) => void
  setMovies: (movies: MovieWithRelations[]) => void
  setLoading: (loading: boolean) => void
  setEditingMovie: (movie: MovieWithRelations | null) => void
  setFormData: (data: Partial<AdminFormData>) => void
  setFormDataFromMovie: (movie: MovieWithRelations) => void
  resetForm: () => void
  setImportSearch: (query: string) => void
  setImportResults: (results: TmdbMovieResult[]) => void
  setImportLoading: (loading: boolean) => void
  setImportPage: (page: number) => void
  setImportType: (type: ImportType) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  activeTab: 'movies',
  movies: [],
  loading: true,
  editingMovie: null,
  formData: initialFormData,
  importSearch: '',
  importResults: [],
  importLoading: false,
  importPage: 1,
  importType: 'popular',
  setActiveTab: (activeTab) => set({ activeTab }),
  setMovies: (movies) => set({ movies }),
  setLoading: (loading) => set({ loading }),
  setEditingMovie: (editingMovie) => set({ editingMovie }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  setFormDataFromMovie: (movie) =>
    set({
      editingMovie: movie,
      formData: {
        title: movie.title,
        titleOriginal: movie.titleOriginal || '',
        description: movie.description,
        descriptionShort: movie.descriptionShort || '',
        poster: movie.poster,
        backdrop: movie.backdrop || '',
        releaseDate: new Date(movie.releaseDate).toISOString().split('T')[0],
        genres: movie.genres.join(', '),
        countries: movie.countries.join(', '),
        rating: movie.rating.toString(),
        duration: movie.duration?.toString() || '',
        type: movie.type,
        videoLinks: (movie.videoLinks || []).map((vl) => vl.url).join('\n'),
        episodes: (movie.episodes || []).map((ep) => ({
          id: ep.id,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          description: ep.description || '',
          videoLinks: (ep.videoLinks || []).map((vl) => vl.url).join('\n'),
        })),
      },
    }),
  resetForm: () =>
    set({
      editingMovie: null,
      formData: initialFormData,
    }),
  setImportSearch: (importSearch) => set({ importSearch }),
  setImportResults: (importResults) => set({ importResults }),
  setImportLoading: (importLoading) => set({ importLoading }),
  setImportPage: (importPage) => set({ importPage }),
  setImportType: (importType) => set({ importType }),
}))
