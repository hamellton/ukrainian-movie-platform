import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import MovieCard from '@/components/MovieCard/MovieCard'
import Search from '@/components/Search/Search'
import { Movie } from '@prisma/client'

interface MoviesResponse {
  movies: Movie[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SearchPage() {
  const router = useRouter()
  const { q } = router.query
  const [searchQuery, setSearchQuery] = useState<string>((q as string) || '')

  useEffect(() => {
    setSearchQuery((q as string) || '')
  }, [q])

  const { data, error, isLoading } = useSWR<MoviesResponse>(
    searchQuery ? `/api/movies?search=${encodeURIComponent(searchQuery)}&limit=50` : null,
    fetcher
  )

  const movies = data?.movies || []

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Пошук</h1>
          <Search />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Завантаження...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Помилка завантаження</p>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Введіть запит для пошуку</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Нічого не знайдено за запитом "{searchQuery}"</p>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6">
              Знайдено {movies.length} результатів за запитом "{searchQuery}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
