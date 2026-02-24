import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import MovieCard from '@/components/MovieCard/MovieCard'
import GenreFilter from '@/components/GenreFilter/GenreFilter'
import { useFiltersStore, type CatalogType } from '@/stores/filtersStore'
import { Movie } from '@prisma/client'

interface MoviesResponse {
  movies: Movie[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Home() {
  const router = useRouter()
  const { page, type, genre, setPage, setType, setFilters } = useFiltersStore()

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    setFilters({
      page: q.page ? Number(q.page) : 1,
      type: (q.type as CatalogType) || '',
      genre: (q.genre as string) || '',
    })
  }, [router.isReady, router.query, setFilters])

  const { data, error, isLoading } = useSWR<MoviesResponse>(
    `/api/movies?page=${page}&limit=20&type=${type}&genre=${genre}&sort=-views`,
    fetcher
  )

  const movies = data?.movies || []
  const pagination = data?.pagination

  const handleTypeChange = (newType: CatalogType) => {
    setType(newType)
    const query: Record<string, string> = { ...(router.query as Record<string, string>) }
    query.type = newType
    query.page = '1'
    if (!newType) delete query.type
    router.push({ pathname: '/', query })
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    const query = { ...(router.query as Record<string, string>), page: String(newPage) }
    router.push({ pathname: '/', query })
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Популярні фільми та серіали</h1>
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => handleTypeChange('')}
              className={`px-4 py-2 rounded ${
                type === '' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Всі
            </button>
            <button
              onClick={() => handleTypeChange('series')}
              className={`px-4 py-2 rounded ${
                type === 'series' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Серіали
            </button>
            <button
              onClick={() => handleTypeChange('animated-series')}
              className={`px-4 py-2 rounded ${
                type === 'animated-series' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Мультсеріали
            </button>
            <button
              onClick={() => handleTypeChange('movie')}
              className={`px-4 py-2 rounded ${
                type === 'movie' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Фільми
            </button>
            <button
              onClick={() => handleTypeChange('animated-movie')}
              className={`px-4 py-2 rounded ${
                type === 'animated-movie' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Мультфільми
            </button>
            <button
              onClick={() => handleTypeChange('collection')}
              className={`px-4 py-2 rounded ${
                type === 'collection' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Добірки
            </button>
          </div>
          <GenreFilter />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Завантаження...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Помилка завантаження</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Фільми не знайдено</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Попередня
                </button>
                <span className="px-4 py-2 text-gray-300">
                  {page} з {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                  className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Наступна
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
