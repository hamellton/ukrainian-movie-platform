import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { getPopularMovies, getPopularSeries, getPopularAnimatedMovies, getPopularAnimatedSeries, getMovieDetails, formatMovieFromTMDB, searchMovies } from '@/utils/tmdb'
import { searchVideoLinks } from '@/utils/videoParser'
import { MovieType, VideoSource } from '@prisma/client'
import { TmdbMovieResult, TmdbMovieDetails } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { type, page = 1, tmdbId, searchQuery } = req.body

      if (tmdbId) {
        if (!type || (type !== 'tv' && type !== 'movie' && type !== 'series')) {
          return res.status(400).json({ error: 'Type is required and must be "movie" or "tv"' })
        }
        
        const movieType: 'movie' | 'tv' = type === 'tv' || type === 'series' ? 'tv' : 'movie'
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

        const releaseYear = formattedData.releaseDate 
          ? new Date(formattedData.releaseDate).getFullYear() 
          : undefined

        const autoFoundLinks = await searchVideoLinks(
          formattedData.titleOriginal || formattedData.title,
          releaseYear
        )

        const videoLinksData = autoFoundLinks.length > 0 
          ? {
              create: autoFoundLinks.map(url => ({
                url,
                quality: '720p',
                source: 'EMBED' as VideoSource,
                language: 'uk',
                isActive: true,
              }))
            }
          : undefined

        const episodesData = movieType === 'tv' && tmdbData.seasons 
          ? {
              create: tmdbData.seasons
                .filter(season => season.season_number > 0)
                .flatMap(season => {
                  const episodes = []
                  for (let i = 1; i <= season.episode_count; i++) {
                    episodes.push({
                      seasonNumber: season.season_number,
                      episodeNumber: i,
                      title: `Сезон ${season.season_number}, Епізод ${i}`,
                      description: season.overview || null,
                      duration: tmdbData.episode_run_time?.[0] || null,
                      thumbnail: season.poster_path ? `https://image.tmdb.org/t/p/w500${season.poster_path}` : null,
                    })
                  }
                  return episodes
                })
            }
          : undefined

        const movie = await prisma.movie.create({
          data: {
            title: formattedData.title,
            titleOriginal: formattedData.titleOriginal,
            description: formattedData.description || formattedData.title || 'Опис відсутній',
            descriptionShort: formattedData.descriptionShort,
            poster: formattedData.poster,
            backdrop: formattedData.backdrop,
            releaseDate: formattedData.releaseDate ? new Date(formattedData.releaseDate) : new Date(),
            genres: formattedData.genres || [],
            countries: formattedData.countries || [],
            rating: formattedData.rating || 0,
            ratingCount: formattedData.ratingCount || 0,
            duration: formattedData.duration || null,
            type: (() => {
              const formattedType = formattedData.type
              switch (formattedType) {
                case 'SERIES':
                  return MovieType.SERIES
                case 'ANIMATED_SERIES':
                  return MovieType.ANIMATED_SERIES
                case 'ANIMATED_MOVIE':
                  return MovieType.ANIMATED_MOVIE
                default:
                  return MovieType.MOVIE
              }
            })(),
            tmdbId: formattedData.tmdbId,
            imdbId: formattedData.imdbId || null,
            videoLinks: videoLinksData,
            episodes: episodesData,
          },
          include: {
            videoLinks: true,
            episodes: {
              include: {
                videoLinks: true,
              },
            },
          },
        })

        return res.status(201).json({ 
          movie, 
          imported: true,
          autoFoundLinks: autoFoundLinks.length,
        })
      }

      if (searchQuery) {
        const searchResults = await searchMovies(searchQuery, page)
        
        if (!searchResults || !searchResults.results) {
          return res.status(404).json({ error: 'No results found' })
        }

        const results = searchResults.results.map((item: TmdbMovieResult) => {
          let mediaType = item.media_type
          
          if (!mediaType) {
            if (item.title && !item.name) {
              mediaType = 'movie'
            } else if (item.name && !item.title) {
              mediaType = 'tv'
            } else {
              mediaType = item.first_air_date ? 'tv' : 'movie'
            }
          }
          
          return {
            id: item.id,
            title: item.title || item.name,
            overview: item.overview,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            releaseDate: item.release_date || item.first_air_date,
            mediaType: mediaType,
          }
        })

        return res.status(200).json({ results, totalPages: searchResults.total_pages })
      }

      if (type === 'popular') {
        const [moviesData, seriesData] = await Promise.all([
          getPopularMovies(page),
          getPopularSeries(page),
        ])

        const allResults = [
          ...(moviesData?.results || []).map((item: TmdbMovieResult) => ({
            ...item,
            mediaType: 'movie',
          })),
          ...(seriesData?.results || []).map((item: TmdbMovieResult) => ({
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

      if (type === 'animated-movies') {
        const animatedMoviesData = await getPopularAnimatedMovies(page)
        
        if (!animatedMoviesData || !animatedMoviesData.results) {
          return res.status(404).json({ error: 'No animated movies found' })
        }

        return res.status(200).json({
          results: animatedMoviesData.results.map((item: TmdbMovieResult) => ({
            ...item,
            mediaType: 'movie',
          })),
          page: animatedMoviesData.page,
          totalPages: animatedMoviesData.total_pages,
        })
      }

      if (type === 'animated-series') {
        const animatedSeriesData = await getPopularAnimatedSeries(page)
        
        if (!animatedSeriesData || !animatedSeriesData.results) {
          return res.status(404).json({ error: 'No animated series found' })
        }

        return res.status(200).json({
          results: animatedSeriesData.results.map((item: TmdbMovieResult) => ({
            ...item,
            mediaType: 'tv',
          })),
          page: animatedSeriesData.page,
          totalPages: animatedSeriesData.total_pages,
        })
      }

      return res.status(400).json({ error: 'Invalid request parameters' })
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('TMDB_API_KEY')) {
        return res.status(400).json({
          error: 'TMDB API Key не настроен',
          details: 'Додайте TMDB_API_KEY в файл .env. Інструкція: https://www.themoviedb.org/settings/api',
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

      const validatedLinks: Array<{
        url: string
        quality: string
        source: VideoSource
        language: string
        isActive: boolean
      }> = []
      for (const link of videoLinks as Array<{ url: string; quality?: string }>) {
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
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to update video links',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
