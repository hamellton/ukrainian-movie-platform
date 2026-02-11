import { create } from 'zustand'

export type CatalogType = '' | 'movie' | 'series'

interface FiltersState {
  page: number
  type: CatalogType
  genre: string
  setPage: (page: number) => void
  setType: (type: CatalogType) => void
  setGenre: (genre: string) => void
  setFilters: (filters: Partial<{ page: number; type: CatalogType; genre: string }>) => void
  reset: () => void
}

const initialState = {
  page: 1,
  type: '' as CatalogType,
  genre: '',
}

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initialState,
  setPage: (page) => set({ page }),
  setType: (type) => set({ type, page: 1 }),
  setGenre: (genre) => set({ genre, page: 1 }),
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  reset: () => set(initialState),
}))
