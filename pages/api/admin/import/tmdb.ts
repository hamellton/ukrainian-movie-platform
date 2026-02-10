import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { getPopularMovies, getPopularSeries, getMovieDetails, formatMovieFromTMDB, searchMovies } from '@/utils/tmdb'
import { MovieType } from '@prisma/client'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { type, page = 1, tmdbId, searchQuery } = req.body

      if (tmdbId) {
        const movieType = type === 'series' ? 'tv' : 'movie'
        const tmdbData = await getMovieDetails(tmdbId, movieType)
        
        if (!tmdbData) {
          return res.status(404).json({ error: 'Movie not found in TMDB' })
        }

        const formattedData = formatMovieFromTMDB(tmdbData, movieType)
        
        const existingMovie = await prisma.movie.findUnique({
          where: { tmdbId: tmdbData.id },
        })

        if (existingMovie) {
          return res.status(400).json({ error: 'Movie already exists', movie: existingMovie })
        }

        const movie = await prisma.movie.create({
          data: {
            title: formattedData.title,
            titleOriginal: formattedData.titleOriginal,
            description: formattedData.description || 'Опис відсутній',
            descriptionShort: formattedData.descriptionShort,
            poster: formattedData.poster,
            backdrop: formattedData.backdrop,
            releaseDate: formattedData.releaseDate ? new Date(formattedData.releaseDate) : new Date(),
            genres: formattedData.genres || [],
            countries: formattedData.countries || [],
            rating: formattedData.rating || 0,
            ratingCount: formattedData.ratingCount || 0,
            duration: formattedData.duration || null,
            type: movieType === 'movie' ? MovieType.MOVIE : MovieType.SERIES,
            tmdbId: formattedData.tmdbId,
            imdbId: formattedData.imdbId || null,
          },
        })

        return res.status(201).json({ movie, imported: true })
      }

      if (searchQuery) {
        const searchResults = await searchMovies(searchQuery, page)
        
        if (!searchResults || !searchResults.results) {
          return res.status(404).json({ error: 'No results found' })
        }

        const results = searchResults.results.map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          overview: item.overview,
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          releaseDate: item.release_date || item.first_air_date,
          mediaType: item.media_type || (item.title ? 'movie' : 'tv'),
        }))

        return res.status(200).json({ results, totalPages: searchResults.total_pages })
      }

      if (type === 'popular') {
        const [moviesData, seriesData] = await Promise.all([
          getPopularMovies(page),
          getPopularSeries(page),
        ])

        const allResults = [
          ...(moviesData?.results || []).map((item: any) => ({
            ...item,
            mediaType: 'movie',
          })),
          ...(seriesData?.results || []).map((item: any) => ({
            ...item,
            mediaType: 'tv',
          })),
        ]

        return res.status(200).json({
          results: allResults,
          moviesPage: moviesData?.page,
          seriesPage: seriesData?.page,
        })
      }

      if (type === 'movies') {
        const moviesData = await getPopularMovies(page)
        
        if (!moviesData || !moviesData.results) {
          return res.status(404).json({ error: 'No movies found' })
        }

        return res.status(200).json({
          results: moviesData.results,
          page: moviesData.page,
          totalPages: moviesData.total_pages,
        })
      }

      if (type === 'series') {
        const seriesData = await getPopularSeries(page)
        
        if (!seriesData || !seriesData.results) {
          return res.status(404).json({ error: 'No series found' })
        }

        return res.status(200).json({
          results: seriesData.results,
          page: seriesData.page,
          totalPages: seriesData.total_pages,
        })
      }

      return res.status(400).json({ error: 'Invalid request parameters' })
    } catch (error: any) {
      const errorMessage = error.message || 'Import failed'
      if (errorMessage.includes('TMDB_API_KEY')) {
        return res.status(400).json({ 
          error: 'TMDB API Key не настроен', 
          details: 'Додайте TMDB_API_KEY в файл .env. Інструкція: https://www.themoviedb.org/settings/api' 
        })
      }
      return res.status(500).json({ error: 'Import failed', details: errorMessage })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { tmdbId, videoLinks } = req.body

      if (!tmdbId || !videoLinks) {
        return res.status(400).json({ error: 'tmdbId and videoLinks are required' })
      }

      const movie = await prisma.movie.findUnique({
        where: { tmdbId },
      })

      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      await prisma.videoLink.deleteMany({
        where: { movieId: movie.id },
      })

      const { parseVideoUrl, validateVideoUrl } = await import('@/utils/videoParser')
      const { VideoSource } = await import('@prisma/client')

      const validatedLinks = []
      for (const link of videoLinks) {
        if (validateVideoUrl(link.url)) {
          const parsed = await parseVideoUrl(link.url)
          if (parsed) {
            validatedLinks.push({
              url: link.url,
              quality: parsed.quality || link.quality || '720p',
              source: parsed.source.toUpperCase() as VideoSource,
              language: 'uk',
              isActive: true,
            })
          }
        }
      }

      const updatedMovie = await prisma.movie.update({
        where: { id: movie.id },
        data: {
          videoLinks: {
            create: validatedLinks,
          },
        },
        include: {
          videoLinks: true,
        },
      })

      return res.status(200).json({ movie: updatedMovie })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update video links', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
