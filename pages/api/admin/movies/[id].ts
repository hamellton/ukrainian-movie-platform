import { NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { parseVideoUrl, validateVideoUrl } from '@/utils/videoParser'
import { MovieType, VideoSource } from '@prisma/client'
import { MovieCreateInput, VideoLinkCreateInput, EpisodeCreateInput } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid movie ID' })
  }

  if (req.method === 'GET') {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          videoLinks: true,
          episodes: {
            include: {
              videoLinks: true,
            },
          },
        },
      })
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }
      return res.status(200).json({ movie })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to fetch movie',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body as Partial<MovieCreateInput> & {
        videoLinks?: VideoLinkCreateInput[]
        episodes?: EpisodeCreateInput[]
      }

      const updateData: Prisma.MovieUpdateInput = {
        title: body.title,
        titleOriginal: body.titleOriginal,
        description: body.description,
        descriptionShort: body.descriptionShort,
        poster: body.poster,
        backdrop: body.backdrop,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : undefined,
        genres: body.genres,
        countries: body.countries,
        rating: body.rating,
        duration: body.duration,
        tmdbId: body.tmdbId,
        imdbId: body.imdbId,
      }

      if (body.releaseDate) {
        updateData.releaseDate = new Date(body.releaseDate)
      }

      if (body.videoLinks && Array.isArray(body.videoLinks)) {
        await prisma.videoLink.deleteMany({
          where: { movieId: id },
        })

        const validatedLinks: Prisma.VideoLinkCreateWithoutMovieInput[] = []
        for (const link of body.videoLinks) {
          if (validateVideoUrl(link.url)) {
            const parsed = await parseVideoUrl(link.url)
            if (parsed) {
              validatedLinks.push({
                url: parsed.url,
                quality: parsed.quality || link.quality || '720p',
                source: parsed.source.toUpperCase() as VideoSource,
                language: link.language || 'uk',
                isActive: link.isActive !== undefined ? link.isActive : true,
              })
            }
          }
        }
        updateData.videoLinks = {
          create: validatedLinks,
        }
      }

      if (body.type) {
        const typeUpper = body.type.toUpperCase()
        switch (typeUpper) {
          case 'SERIES':
            updateData.type = MovieType.SERIES
            break
          case 'ANIMATED_SERIES':
            updateData.type = MovieType.ANIMATED_SERIES
            break
          case 'ANIMATED_MOVIE':
            updateData.type = MovieType.ANIMATED_MOVIE
            break
          case 'COLLECTION':
            updateData.type = MovieType.COLLECTION
            break
          default:
            updateData.type = MovieType.MOVIE
        }
      }

      if (body.episodes && Array.isArray(body.episodes)) {
        await prisma.episode.deleteMany({
          where: { movieId: id },
        })

        const episodesData: Prisma.EpisodeCreateWithoutMovieInput[] = []
        for (const ep of body.episodes) {
          const episodeData: Prisma.EpisodeUncheckedCreateWithoutMovieInput = {
            episodeNumber: ep.episodeNumber,
            seasonNumber: ep.seasonNumber,
            title: ep.title,
            description: ep.description ?? null,
            duration: ep.duration ?? null,
            thumbnail: ep.thumbnail ?? null,
          }

          if (ep.videoLinks && ep.videoLinks.length > 0) {
            const validatedLinks: Prisma.VideoLinkUncheckedCreateWithoutEpisodeInput[] = []
            for (const link of ep.videoLinks) {
              if (validateVideoUrl(link.url)) {
                const parsed = await parseVideoUrl(link.url)
                if (parsed) {
                  validatedLinks.push({
                    url: parsed.url,
                    quality: parsed.quality || link.quality || '720p',
                    source: parsed.source.toUpperCase() as VideoSource,
                    language: 'uk',
                    isActive: true,
                    movieId: id,
                  })
                }
              }
            }
            episodesData.push({
              ...episodeData,
              videoLinks: {
                create: validatedLinks,
              },
            } as Prisma.EpisodeCreateWithoutMovieInput)
          } else {
            episodesData.push({
              ...episodeData,
              videoLinks: {
                create: [],
              },
            } as Prisma.EpisodeCreateWithoutMovieInput)
          }
        }

        updateData.episodes = {
          create: episodesData,
        }
      }

      const movie = await prisma.movie.update({
        where: { id },
        data: updateData,
        include: {
          videoLinks: true,
          episodes: {
            include: {
              videoLinks: true,
            },
          },
        },
      })

      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      return res.status(200).json({ movie })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to update movie',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const movie = await prisma.movie.delete({
        where: { id },
      })
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }
      return res.status(200).json({ message: 'Movie deleted successfully' })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to delete movie',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
