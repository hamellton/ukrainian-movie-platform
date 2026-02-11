import { useRouter } from 'next/router'
import { FiSearch } from 'react-icons/fi'
import { useSearchStore } from '@/stores/searchStore'

export default function Search() {
  const router = useRouter()
  const { query, setQuery } = useSearchStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук фільмів та серіалів..."
          className="w-full px-4 py-3 pl-12 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary px-4 py-2 rounded text-white font-semibold hover:bg-primary/90 transition-colors"
        >
          Пошук
        </button>
      </div>
    </form>
  )
}
