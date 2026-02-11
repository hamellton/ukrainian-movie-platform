import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import MovieCard from '@/components/MovieCard/MovieCard'
import GenreFilter from '@/components/GenreFilter/GenreFilter'
import { useFiltersStore } from '@/stores/filtersStore'
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

export default function SeriesPage() {
  const router = useRouter()
  const { page, genre, setPage, setFilters } = useFiltersStore()

  useEffect(() => {
    if (!router.isReady) return
    const q = router.query
    setFilters({
      page: q.page ? Number(q.page) : 1,
      genre: (q.genre as string) || '',
    })
  }, [router.isReady, router.query, setFilters])

  const { data, error, isLoading } = useSWR<MoviesResponse>(
    `/api/movies?page=${page}&limit=20&type=series&genre=${genre}&sort=-releaseDate`,
    fetcher
  )

  const series = data?.movies || []
  const pagination = data?.pagination

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    router.push({ pathname: '/series', query: { ...router.query, page: String(newPage) } })
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Серіали</h1>
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
        ) : series.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Серіали не знайдено</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {series.map((serie) => (
                <MovieCard key={serie.id} movie={serie} />
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
