import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useFiltersStore } from '@/stores/filtersStore'

const genres = [
  'Бойовик',
  'Комедія',
  'Драма',
  'Жахи',
  'Фантастика',
  'Трилер',
  'Романтика',
  'Детектив',
  'Пригоди',
  'Анімація',
]

export default function GenreFilter() {
  const router = useRouter()
  const { genre, setGenre, setFilters } = useFiltersStore()

  useEffect(() => {
    const qGenre = (router.query.genre as string) || ''
    if (qGenre !== genre) {
      setFilters({ genre: qGenre })
    }
  }, [router.query.genre, genre, setFilters])

  const handleGenreChange = (genreName: string) => {
    const newGenre = genre === genreName ? '' : genreName
    setGenre(newGenre)
    const query = { ...router.query } as Record<string, string>
    if (newGenre) {
      query.genre = newGenre
    } else {
      delete query.genre
    }
    query.page = '1'
    router.push({ pathname: router.pathname, query })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {genres.map((genreName) => (
        <button
          key={genreName}
          onClick={() => handleGenreChange(genreName)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            genre === genreName
              ? 'bg-primary text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {genreName}
        </button>
      ))}
    </div>
  )
}
