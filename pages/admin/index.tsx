import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { MovieWithRelations, TmdbMovieResult } from '@/types'
import { useAdminStore, type ImportType } from '@/stores/adminStore'
import { confirmDialog } from '@/components/ConfirmDialog/ConfirmDialog'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

export default function AdminPanel() {
  const router = useRouter()
  const {
    activeTab,
    movies,
    loading,
    editingMovie,
    formData,
    importSearch,
    importResults,
    importLoading,
    importPage,
    importType,
    setActiveTab,
    setMovies,
    setLoading,
    setFormData,
    setFormDataFromMovie,
    resetForm,
    setImportSearch,
    setImportResults,
    setImportLoading,
    setImportPage,
    setImportType,
  } = useAdminStore()

  const loadMovies = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.get('/api/admin/movies', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMovies(response.data.movies || [])
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router, setMovies, setLoading])

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    loadMovies()
  }, [router, loadMovies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('adminToken')
      const videoLinksArray = formData.videoLinks
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => ({ url, quality: '720p' }))

      const episodesArray = formData.episodes.map((ep) => ({
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        description: ep.description || undefined,
        videoLinks: ep.videoLinks
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url) => ({ url, quality: '720p' })),
      }))

      const movieData = {
        title: formData.title,
        titleOriginal: formData.titleOriginal || undefined,
        description: formData.description,
        descriptionShort: formData.descriptionShort || undefined,
        poster: formData.poster,
        backdrop: formData.backdrop || undefined,
        releaseDate: new Date(formData.releaseDate).toISOString(),
        genres: formData.genres.split(',').map((g) => g.trim()).filter(Boolean),
        countries: formData.countries.split(',').map((c) => c.trim()).filter(Boolean),
        rating: formData.rating ? parseFloat(formData.rating.replace(',', '.')) || 0 : 0,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        type: formData.type,
        videoLinks: videoLinksArray,
        episodes: (formData.type === 'SERIES' || formData.type === 'ANIMATED_SERIES') ? episodesArray : undefined,
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
      toast.success(editingMovie ? 'Фільм оновлено!' : 'Фільм додано!')
    } catch (error: unknown) {
      toast.error(getErrorDetails(error) || getErrorMessage(error) || 'Помилка збереження')
    }
  }

  const handleDelete = async (id: string) => {
    confirmDialog({
      title: 'Видалення фільму',
      message: 'Ви впевнені, що хочете видалити цей фільм?',
      confirmText: 'Видалити',
      cancelText: 'Скасувати',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('adminToken')
          await axios.delete(`/api/admin/movies/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
      loadMovies()
      toast.success('Фільм видалено')
    } catch (error: unknown) {
      toast.error(getErrorDetails(error) || getErrorMessage(error) || 'Помилка видалення')
    }
      },
    })
  }

  const handleEdit = (movie: MovieWithRelations) => {
    setFormDataFromMovie(movie)
    setActiveTab('add')
  }

  const handleImportSearch = async () => {
    if (!importSearch.trim()) return

    setImportLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.post(
        '/api/admin/import/tmdb',
        { searchQuery: importSearch, page: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setImportResults(response.data.results || [])
      setImportPage(1)
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.response?.data?.details || 'Помилка пошуку'
      toast.error(errorMsg)
      if (errorMsg.includes('TMDB_API_KEY')) {
        toast.error('Додайте TMDB_API_KEY в .env файл для використання імпорту')
      }
    } finally {
      setImportLoading(false)
    }
  }

  const handleLoadPopular = async (type: ImportType, page: number = 1) => {
    setImportLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const response = await axios.post(
        '/api/admin/import/tmdb',
        { type, page },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setImportResults(response.data.results || [])
      setImportPage(page)
      setImportType(type)
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.response?.data?.details || 'Помилка завантаження'
      toast.error(errorMsg)
      if (errorMsg.includes('TMDB_API_KEY')) {
        toast.error('Додайте TMDB_API_KEY в .env файл для використання імпорту')
      }
    } finally {
      setImportLoading(false)
    }
  }

  const handleImportMovie = async (tmdbId: number, mediaType: string) => {
    confirmDialog({
      title: 'Імпорт фільму',
      message: 'Імпортувати цей фільм/серіал?',
      confirmText: 'Імпортувати',
      cancelText: 'Скасувати',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('adminToken')
          const response = await axios.post(
            '/api/admin/import/tmdb',
            { tmdbId, type: mediaType },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.imported) {
            const autoFound = response.data.autoFoundLinks || 0
            if (autoFound > 0) {
              toast.success(`Фільм імпортовано! Знайдено ${autoFound} посилань на відео.`)
            } else {
              toast.success('Фільм імпортовано! Додайте посилання на відео вручну.')
            }
            loadMovies()
            const movie = response.data.movie
            handleEdit(movie)
          } else {
          toast('Фільм вже є в базі', { icon: 'ℹ️' })
      }
    } catch (error: unknown) {
      toast.error(getErrorDetails(error) || getErrorMessage(error) || 'Помилка імпорту')
    }
      },
    })
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
                          {movie.type === 'MOVIE' ? 'Фільм' : 
                           movie.type === 'SERIES' ? 'Серіал' :
                           movie.type === 'ANIMATED_MOVIE' ? 'Мультфільм' :
                           movie.type === 'ANIMATED_SERIES' ? 'Мультсеріал' :
                           movie.type === 'COLLECTION' ? 'Добірка' : 'Невідомо'}
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
                    onChange={(e) => setFormData({ title: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Оригінальна назва</label>
                  <input
                    type="text"
                    value={formData.titleOriginal}
                    onChange={(e) => setFormData({ titleOriginal: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Опис *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Короткий опис</label>
                <textarea
                  value={formData.descriptionShort}
                  onChange={(e) => setFormData({ descriptionShort: e.target.value })}
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
                    onChange={(e) => setFormData({ poster: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Фон (URL)</label>
                  <input
                    type="url"
                    value={formData.backdrop}
                    onChange={(e) => setFormData({ backdrop: e.target.value })}
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
                    onChange={(e) => setFormData({ releaseDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Рейтинг</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]+([.,][0-9]{1,3})?"
                    value={formData.rating}
                    onChange={(e) => {
                      const value = e.target.value.replace(',', '.')
                      if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                        const numValue = parseFloat(value)
                        if (isNaN(numValue) || (numValue >= 0 && numValue <= 10)) {
                          setFormData({ rating: value })
                        }
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Тривалість (хв)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ duration: e.target.value })}
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
                    onChange={(e) => setFormData({ genres: e.target.value })}
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
                    onChange={(e) => setFormData({ countries: e.target.value })}
                    placeholder="Україна, США"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Тип *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ type: e.target.value as 'MOVIE' | 'SERIES' | 'ANIMATED_MOVIE' | 'ANIMATED_SERIES' | 'COLLECTION' })}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded"
                >
                  <option value="MOVIE">Фільм</option>
                  <option value="SERIES">Серіал</option>
                  <option value="ANIMATED_MOVIE">Мультфільм</option>
                  <option value="ANIMATED_SERIES">Мультсеріал</option>
                  <option value="COLLECTION">Добірка</option>
                </select>
              </div>

              {(formData.type === 'MOVIE' || formData.type === 'ANIMATED_MOVIE' || formData.type === 'COLLECTION') && (
                <div>
                  <label className="block text-gray-300 mb-2">
                    Посилання на відео (кожне з нового рядка) *
                  </label>
                  <textarea
                    value={formData.videoLinks}
                    onChange={(e) => setFormData({ videoLinks: e.target.value })}
                    required
                    rows={4}
                    placeholder="https://ashdi.vip/vod/123&#10;https://tortuga.wtf/embed/abc&#10;https://example.com/video.mp4"
                    className="w-full px-4 py-2 bg-gray-800 text-white rounded font-mono text-sm"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Підтримуються: ashdi.vip, tortuga.wtf, vidstreaming.io, streamtape.com, mixdrop.co та інші спеціалізовані хостинги, або прямі посилання (.mp4, .m3u8)
                  </p>
                </div>
              )}

              {(formData.type === 'SERIES' || formData.type === 'ANIMATED_SERIES') && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-gray-300 text-lg font-semibold">
                      Епізоди
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const newEpisode = {
                          seasonNumber: 1,
                          episodeNumber: formData.episodes.length + 1,
                          title: '',
                          description: '',
                          videoLinks: '',
                        }
                        setFormData({ episodes: [...formData.episodes, newEpisode] })
                      }}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm"
                    >
                      + Додати епізод
                    </button>
                  </div>

                  {formData.episodes.length === 0 ? (
                    <p className="text-gray-400 text-sm mb-4">
                      Епізоди не додані. Натисніть "Додати епізод" щоб додати перший епізод.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.episodes.map((episode, index) => (
                        <div key={index} className="bg-gray-800 p-4 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="block text-gray-300 mb-1 text-sm">Сезон</label>
                              <input
                                type="number"
                                value={episode.seasonNumber}
                                onChange={(e) => {
                                  const updated = [...formData.episodes]
                                  updated[index].seasonNumber = parseInt(e.target.value) || 1
                                  setFormData({ episodes: updated })
                                }}
                                min="1"
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-300 mb-1 text-sm">Епізод</label>
                              <input
                                type="number"
                                value={episode.episodeNumber}
                                onChange={(e) => {
                                  const updated = [...formData.episodes]
                                  updated[index].episodeNumber = parseInt(e.target.value) || 1
                                  setFormData({ episodes: updated })
                                }}
                                min="1"
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-gray-300 mb-1 text-sm">Назва</label>
                              <input
                                type="text"
                                value={episode.title}
                                onChange={(e) => {
                                  const updated = [...formData.episodes]
                                  updated[index].title = e.target.value
                                  setFormData({ episodes: updated })
                                }}
                                placeholder="Назва епізоду"
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                              />
                            </div>
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-300 mb-1 text-sm">Опис</label>
                            <textarea
                              value={episode.description}
                              onChange={(e) => {
                                const updated = [...formData.episodes]
                                updated[index].description = e.target.value
                                setFormData({ episodes: updated })
                              }}
                              rows={2}
                              placeholder="Опис епізоду (необов'язково)"
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-300 mb-1 text-sm">
                              Посилання на відео (кожне з нового рядка)
                            </label>
                            <textarea
                              value={episode.videoLinks}
                              onChange={(e) => {
                                const updated = [...formData.episodes]
                                updated[index].videoLinks = e.target.value
                                setFormData({ episodes: updated })
                              }}
                              rows={3}
                              placeholder="https://ashdi.vip/vod/123&#10;https://tortuga.wtf/embed/abc"
                              className="w-full px-3 py-2 bg-gray-700 text-white rounded font-mono text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.episodes.filter((_, i) => i !== index)
                              setFormData({ episodes: updated })
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Видалити епізод
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                <button
                  onClick={() => handleLoadPopular('animated-movies', 1)}
                  className={`px-4 py-2 rounded ${
                    importType === 'animated-movies' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Популярні мультфільми
                </button>
                <button
                  onClick={() => handleLoadPopular('animated-series', 1)}
                  className={`px-4 py-2 rounded ${
                    importType === 'animated-series' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Популярні мультсеріали
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
                  {importResults.map((item: TmdbMovieResult) => (
                    <div key={item.id} className="bg-gray-800 rounded-lg overflow-hidden">
                      {item.poster_path && (
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                          alt={item.title || item.name || 'Movie poster'}
                          width={500}
                          height={750}
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
