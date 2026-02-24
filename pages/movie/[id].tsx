import { useRouter } from 'next/router'
import useSWR from 'swr'
import Image from 'next/image'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import MovieCard from '@/components/MovieCard/MovieCard'
import { MovieWithRelations } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MoviePage() {
  const router = useRouter()
  const { id } = router.query

  const { data, error, isLoading } = useSWR<{ movie: MovieWithRelations }>(
    id ? `/api/movies/${id}` : null,
    fetcher
  )
  const { data: relatedData } = useSWR<{ movies: MovieWithRelations[] }>(
    data?.movie?.genres?.length
      ? `/api/movies?limit=8&genre=${data.movie.genres[0]}&type=${
          data?.movie?.type === 'SERIES' || data?.movie?.type === 'ANIMATED_SERIES' 
            ? 'series' 
            : data?.movie?.type === 'ANIMATED_MOVIE' 
            ? 'animated-movie' 
            : data?.movie?.type === 'COLLECTION'
            ? 'collection'
            : 'movie'
        }`
      : null,
    fetcher
  )

  const movie = data?.movie
  const relatedMovies = relatedData?.movies?.filter(m => m.id !== id) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400">Фільм не знайдено</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="relative h-[60vh] mb-8">
        {movie.backdrop && (
          <div className="absolute inset-0">
            <Image
              src={movie.backdrop}
              alt={movie.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black" />
          </div>
        )}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-4">{movie.title}</h1>
            {movie.descriptionShort && (
              <p className="text-gray-300 text-lg">{movie.descriptionShort}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <VideoPlayer movieId={id as string} />
          </div>
          <div>
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Інформація</h2>
              <div className="space-y-3 text-gray-300">
                {movie.releaseDate && (
                  <div>
                    <span className="font-semibold">Рік:</span>{' '}
                    {new Date(movie.releaseDate).getFullYear()}
                  </div>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <div>
                    <span className="font-semibold">Жанри:</span>{' '}
                    {movie.genres.join(', ')}
                  </div>
                )}
                {movie.countries && movie.countries.length > 0 && (
                  <div>
                    <span className="font-semibold">Країни:</span>{' '}
                    {movie.countries.join(', ')}
                  </div>
                )}
                {movie.duration && (
                  <div>
                    <span className="font-semibold">Тривалість:</span> {movie.duration} хв
                  </div>
                )}
                {movie.rating > 0 && (
                  <div>
                    <span className="font-semibold">Рейтинг:</span> {movie.rating.toFixed(1)} / 10
                  </div>
                )}
                {movie.views > 0 && (
                  <div>
                    <span className="font-semibold">Переглядів:</span> {movie.views}
                  </div>
                )}
              </div>
            </div>
            {movie.description && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Опис</h2>
                <p className="text-gray-300 leading-relaxed">{movie.description}</p>
              </div>
            )}
          </div>
        </div>

        {relatedMovies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Схожі фільми</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <MovieCard key={relatedMovie.id} movie={relatedMovie} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
