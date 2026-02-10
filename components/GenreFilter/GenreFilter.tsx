import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

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
  const [selectedGenre, setSelectedGenre] = useState<string>((router.query.genre as string) || '')

  useEffect(() => {
    setSelectedGenre((router.query.genre as string) || '')
  }, [router.query.genre])

  const handleGenreChange = (genre: string) => {
    const newGenre = selectedGenre === genre ? '' : genre
    setSelectedGenre(newGenre)
    
    const query = { ...router.query }
    if (newGenre) {
      query.genre = newGenre
    } else {
      delete query.genre
    }
    query.page = '1'

    router.push({
      pathname: router.pathname,
      query,
    })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => handleGenreChange(genre)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedGenre === genre
              ? 'bg-primary text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  )
}
