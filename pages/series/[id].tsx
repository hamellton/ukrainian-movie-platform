import { useState } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import Image from 'next/image'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer'
import MovieCard from '@/components/MovieCard/MovieCard'
import { MovieWithRelations } from '@/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SeriesPage() {
  const router = useRouter()
  const { id } = router.query
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)

  const { data, error, isLoading } = useSWR<{ movie: MovieWithRelations }>(
    id ? `/api/movies/${id}` : null,
    fetcher
  )
  const { data: relatedData } = useSWR<{ movies: MovieWithRelations[] }>(
    data?.movie?.genres?.length
      ? `/api/movies?limit=8&genre=${data.movie.genres[0]}&type=series`
      : null,
    fetcher
  )

  const series = data?.movie
  const relatedSeries = relatedData?.movies?.filter(s => s.id !== id) || []

  const seasons = series?.episodes
    ? Array.from(new Set(series.episodes.map(ep => ep.seasonNumber))).sort((a, b) => a - b)
    : []

  const episodes = series?.episodes
    ? series.episodes.filter(ep => ep.seasonNumber === selectedSeason)
    : []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    )
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400">Серіал не знайдено</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <div className="relative h-[60vh] mb-8">
        {series.backdrop && (
          <div className="absolute inset-0">
            <Image
              src={series.backdrop}
              alt={series.title}
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black" />
          </div>
        )}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-4">{series.title}</h1>
            {series.descriptionShort && (
              <p className="text-gray-300 text-lg">{series.descriptionShort}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <VideoPlayer
              movieId={id as string}
              episodeNumber={selectedEpisode}
              seasonNumber={selectedSeason}
            />
          </div>
          <div>
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Інформація</h2>
              <div className="space-y-3 text-gray-300">
                {series.releaseDate && (
                  <div>
                    <span className="font-semibold">Рік:</span>{' '}
                    {new Date(series.releaseDate).getFullYear()}
                  </div>
                )}
                {series.genres && series.genres.length > 0 && (
                  <div>
                    <span className="font-semibold">Жанри:</span>{' '}
                    {series.genres.join(', ')}
                  </div>
                )}
                {series.countries && series.countries.length > 0 && (
                  <div>
                    <span className="font-semibold">Країни:</span>{' '}
                    {series.countries.join(', ')}
                  </div>
                )}
                {series.rating > 0 && (
                  <div>
                    <span className="font-semibold">Рейтинг:</span> {series.rating.toFixed(1)} / 10
                  </div>
                )}
                {series.views > 0 && (
                  <div>
                    <span className="font-semibold">Переглядів:</span> {series.views}
                  </div>
                )}
              </div>
            </div>
            {series.description && (
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Опис</h2>
                <p className="text-gray-300 leading-relaxed">{series.description}</p>
              </div>
            )}
            {seasons.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Сезони та серії</h2>
                <div className="space-y-4">
                  {seasons.map((season) => (
                    <div key={season}>
                      <button
                        onClick={() => {
                          setSelectedSeason(season)
                          setSelectedEpisode(1)
                        }}
                        className={`w-full text-left px-4 py-2 rounded mb-2 ${
                          selectedSeason === season
                            ? 'bg-primary text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Сезон {season}
                      </button>
                      {selectedSeason === season && (
                        <div className="ml-4 space-y-2">
                          {episodes.map((episode) => (
                            <button
                              key={episode.id}
                              onClick={() => setSelectedEpisode(episode.episodeNumber)}
                              className={`w-full text-left px-4 py-2 rounded ${
                                selectedEpisode === episode.episodeNumber
                                  ? 'bg-primary/50 text-white'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                            >
                              Серія {episode.episodeNumber}: {episode.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedSeries.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Схожі серіали</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedSeries.map((relatedSerie) => (
                <MovieCard key={relatedSerie.id} movie={relatedSerie} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
