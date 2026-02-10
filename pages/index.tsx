import { useState } from 'react'
import useSWR from 'swr'
import MovieCard from '@/components/MovieCard/MovieCard'
import GenreFilter from '@/components/GenreFilter/GenreFilter'
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
  const [page, setPage] = useState(1)
  const [type, setType] = useState<string>('')
  const [genre, setGenre] = useState<string>('')

  const { data, error, isLoading } = useSWR<MoviesResponse>(
    `/api/movies?page=${page}&limit=20&type=${type}&genre=${genre}&sort=-views`,
    fetcher
  )

  const movies = data?.movies || []
  const pagination = data?.pagination

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Популярні фільми та серіали</h1>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setType('')}
              className={`px-4 py-2 rounded ${
                type === '' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Всі
            </button>
            <button
              onClick={() => setType('movie')}
              className={`px-4 py-2 rounded ${
                type === 'movie' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Фільми
            </button>
            <button
              onClick={() => setType('series')}
              className={`px-4 py-2 rounded ${
                type === 'series' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Серіали
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
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Попередня
                </button>
                <span className="px-4 py-2 text-gray-300">
                  {page} з {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
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
