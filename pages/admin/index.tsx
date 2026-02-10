import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { MovieWithRelations } from '@/types'

export default function AdminPanel() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('movies')
  const [movies, setMovies] = useState<MovieWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMovie, setEditingMovie] = useState<MovieWithRelations | null>(null)
  const [importSearch, setImportSearch] = useState('')
  const [importResults, setImportResults] = useState<any[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importPage, setImportPage] = useState(1)
  const [importType, setImportType] = useState<'movies' | 'series' | 'popular'>('popular')
  const [formData, setFormData] = useState({
    title: '',
    titleOriginal: '',
    description: '',
    descriptionShort: '',
    poster: '',
    backdrop: '',
    releaseDate: '',
    genres: '',
    countries: '',
    rating: '',
    duration: '',
    type: 'MOVIE',
    videoLinks: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadMovies()
  }, [router])

  const loadMovies = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get('/api/admin/movies', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setMovies(response.data.movies || [])
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const videoLinksArray = formData.videoLinks
        .split('\n')
        .map(url => url.trim())
        .filter(Boolean)
        .map(url => ({
          url,
          quality: '720p',
        }))

      const movieData = {
        title: formData.title,
        titleOriginal: formData.titleOriginal || undefined,
        description: formData.description,
        descriptionShort: formData.descriptionShort || undefined,
        poster: formData.poster,
        backdrop: formData.backdrop || undefined,
        releaseDate: new Date(formData.releaseDate).toISOString(),
        genres: formData.genres.split(',').map(g => g.trim()).filter(Boolean),
        countries: formData.countries.split(',').map(c => c.trim()).filter(Boolean),
        rating: formData.rating ? parseFloat(formData.rating) : 0,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        type: formData.type,
        videoLinks: videoLinksArray,
      }

      if (editingMovie) {
        await axios.put(`/api/admin/movies/${editingMovie.id}`, movieData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post('/api/admin/movies', movieData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }

      resetForm()
      loadMovies()
      setActiveTab('movies')
      alert(editingMovie ? 'Фільм оновлено!' : 'Фільм додано!')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.response?.data?.error || error.response?.data?.details || 'Помилка збереження')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цей фільм?')) return

    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`/api/admin/movies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      loadMovies()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Помилка видалення')
    }
  }

  const handleEdit = (movie: MovieWithRelations) => {
    setEditingMovie(movie)
    setFormData({
      title: movie.title,
      titleOriginal: movie.titleOriginal || '',
      description: movie.description,
      descriptionShort: movie.descriptionShort || '',
      poster: movie.poster,
      backdrop: movie.backdrop || '',
      releaseDate: new Date(movie.releaseDate).toISOString().split('T')[0],
      genres: movie.genres.join(', '),
      countries: movie.countries.join(', '),
      rating: movie.rating.toString(),
      duration: movie.duration?.toString() || '',
      type: movie.type,
      videoLinks: movie.videoLinks.map(vl => vl.url).join('\n'),
    })
    setActiveTab('add')
  }

  const resetForm = () => {
    setFormData({
      title: '',
      titleOriginal: '',
      description: '',
      descriptionShort: '',
      poster: '',
      backdrop: '',
      releaseDate: '',
      genres: '',
      countries: '',
      rating: '',
      duration: '',
      type: 'MOVIE',
      videoLinks: '',
    })
    setEditingMovie(null)
  }

  const handleImportSearch = async () => {
    if (!importSearch.trim()) return
    
    setImportLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.post('/api/admin/import/tmdb', {
        searchQuery: importSearch,
        page: 1,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setImportResults(response.data.results || [])
      setImportPage(1)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Помилка пошуку'
      alert(errorMsg)
      if (errorMsg.includes('TMDB_API_KEY')) {
        alert('Для використання імпорту потрібен TMDB API ключ. Додайте його в .env файл')
      }
    } finally {
      setImportLoading(false)
    }
  }

  const handleLoadPopular = async (type: 'movies' | 'series' | 'popular', page: number = 1) => {
    setImportLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.post('/api/admin/import/tmdb', {
        type,
        page,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setImportResults(response.data.results || [])
      setImportPage(page)
      setImportType(type)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.details || 'Помилка завантаження'
      alert(errorMsg)
      if (errorMsg.includes('TMDB_API_KEY')) {
        alert('Для використання імпорту потрібен TMDB API ключ. Додайте його в .env файл')
      }
    } finally {
      setImportLoading(false)
    }
  }

  const handleImportMovie = async (tmdbId: number, mediaType: string) => {
    if (!confirm('Імпортувати цей фільм/серіал?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.post('/api/admin/import/tmdb', {
        tmdbId,
        type: mediaType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.imported) {
        alert('Фільм успішно імпортовано! Тепер додайте посилання на відео.')
        loadMovies()
        const movie = response.data.movie
        handleEdit(movie)
      } else {
        alert('Фільм вже існує в базі')
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Помилка імпорту')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Адмін панель</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Вийти
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setActiveTab('movies')
              resetForm()
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'movies'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Фільми ({movies.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('add')
              resetForm()
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'add'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {editingMovie ? 'Редагувати' : 'Додати фільм'}
          </button>
          <button
            onClick={() => {
              setActiveTab('import')
              if (importResults.length === 0) {
                handleLoadPopular('popular', 1)
              }
            }}
            className={`px-4 py-2 rounded ${
              activeTab === 'import'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Імпорт з TMDB
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2 rounded ${
              activeTab === 'ads'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Реклама
          </button>
        </div>

        {activeTab === 'movies' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Список фільмів</h2>
            {movies.length === 0 ? (
              <p className="text-gray-400">Немає фільмів. Додайте перший фільм!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-gray-300">Назва</th>
                      <th className="pb-3 text-gray-300">Тип</th>
                      <th className="pb-3 text-gray-300">Переглядів</th>
                      <th className="pb-3 text-gray-300">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((movie) => (
                      <tr key={movie.id} className="border-b border-gray-800">
                        <td className="py-3 text-white">{movie.title}</td>
                        <td className="py-3 text-gray-300">
                          {movie.type === 'MOVIE' ? 'Фільм' : 'Серіал'}
                        </td>
                        <td className="py-3 text-gray-300">{movie.views || 0}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="text-primary hover:underline mr-4"
                          >
                            Редагувати
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="text-red-400 hover:underline"
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingMovie ? 'Редагувати фільм' : 'Додати фільм'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Назва *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Оригінальна назва</label>
                  <input
                    type="text"
                    value={formData.titleOriginal}
                    onChange={(e) => setFormData({ ...formData, titleOriginal: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Опис *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Короткий опис</label>
                <textarea
                  value={formData.descriptionShort}
                  onChange={(e) => setFormData({ ...formData, descriptionShort: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Постер (URL) *</label>
                  <input
                    type="url"
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Фон (URL)</label>
                  <input
                    type="url"
                    value={formData.backdrop}
                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Дата виходу *</label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Рейтинг</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Тривалість (хв)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Жанри (через кому) *</label>
                  <input
                    type="text"
                    value={formData.genres}
                    onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                    placeholder="Драма, Трилер, Комедія"
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Країни (через кому)</label>
                  <input
                    type="text"
                    value={formData.countries}
                    onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                    placeholder="Україна, США"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Тип *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'MOVIE' | 'SERIES' })}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                >
                  <option value="MOVIE">Фільм</option>
                  <option value="SERIES">Серіал</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  Посилання на відео (кожне з нового рядка) *
                </label>
                <textarea
                  value={formData.videoLinks}
                  onChange={(e) => setFormData({ ...formData, videoLinks: e.target.value })}
                  required
                  rows={4}
                  placeholder="https://example.com/video.mp4&#10;https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded font-mono text-sm"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Підтримуються: прямі посилання (.mp4, .m3u8), YouTube, Ok.ru, VK.com
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  {editingMovie ? 'Зберегти зміни' : 'Додати фільм'}
                </button>
                {editingMovie && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Імпорт з TMDB</h2>
            
            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => handleLoadPopular('popular', 1)}
                  className={`px-4 py-2 rounded ${
                    importType === 'popular' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Популярні
                </button>
                <button
                  onClick={() => handleLoadPopular('movies', 1)}
                  className={`px-4 py-2 rounded ${
                    importType === 'movies' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Популярні фільми
                </button>
                <button
                  onClick={() => handleLoadPopular('series', 1)}
                  className={`px-4 py-2 rounded ${
                    importType === 'series' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Популярні серіали
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={importSearch}
                  onChange={(e) => setImportSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleImportSearch()}
                  placeholder="Пошук фільмів та серіалів..."
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded"
                />
                <button
                  onClick={handleImportSearch}
                  disabled={importLoading}
                  className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  Пошук
                </button>
              </div>
            </div>

            {importLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Завантаження...</p>
              </div>
            ) : importResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Нічого не знайдено. Спробуйте пошук або завантажте популярні.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {importResults.map((item: any) => (
                    <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      {item.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                          alt={item.title || item.name}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-white font-semibold mb-2 line-clamp-2">
                          {item.title || item.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                          {item.overview}
                        </p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-500 text-xs">
                            {item.release_date || item.first_air_date || 'N/A'}
                          </span>
                          <span className="text-yellow-400 text-sm">
                            ⭐ {item.vote_average?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleImportMovie(item.id, item.media_type || (item.title ? 'movie' : 'tv'))}
                          className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm"
                        >
                          Імпортувати
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => handleLoadPopular(importType, importPage - 1)}
                    disabled={importPage === 1 || importLoading}
                    className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                  >
                    Попередня
                  </button>
                  <span className="px-4 py-2 text-gray-300">Сторінка {importPage}</span>
                  <button
                    onClick={() => handleLoadPopular(importType, importPage + 1)}
                    disabled={importLoading}
                    className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
                  >
                    Наступна
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Управління рекламою</h2>
            <p className="text-gray-400">
              Функціонал управління рекламою буде реалізовано в наступній версії
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
