import { NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { parseVideoUrl, validateVideoUrl } from '@/utils/videoParser'
import { MovieType, VideoSource } from '@prisma/client'
import { PrismaMovieWhereInput, MovieCreateInput, EpisodeCreateInput, VideoLinkCreateInput } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '50',
        search,
        type,
      } = req.query

      const where: PrismaMovieWhereInput = {}

      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      if (type && typeof type === 'string') {
        switch (type) {
          case 'movie':
            where.type = MovieType.MOVIE
            break
          case 'series':
            where.type = MovieType.SERIES
            break
          case 'animated-movie':
            where.type = MovieType.ANIMATED_MOVIE
            break
          case 'animated-series':
            where.type = MovieType.ANIMATED_SERIES
            break
          case 'collection':
            where.type = MovieType.COLLECTION
            break
        }
      }

      const skip = (parseInt(String(page)) - 1) * parseInt(String(limit))

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(String(limit)),
          include: {
            videoLinks: true,
            episodes: {
              include: {
                videoLinks: true,
              },
            },
          },
        }),
        prisma.movie.count({ where }),
      ])

      return res.status(200).json({
        movies,
        pagination: {
          page: parseInt(String(page)),
          limit: parseInt(String(limit)),
          total,
          pages: Math.ceil(total / parseInt(String(limit))),
        },
      })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to fetch movies',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as MovieCreateInput & {
        videoLinks?: VideoLinkCreateInput[]
        episodes?: EpisodeCreateInput[]
      }

      const movieData: Prisma.MovieCreateInput = {
        title: body.title,
        titleOriginal: body.titleOriginal,
        description: body.description,
        descriptionShort: body.descriptionShort,
        poster: body.poster,
        backdrop: body.backdrop,
        releaseDate: body.releaseDate ? new Date(body.releaseDate) : new Date(),
        genres: body.genres || [],
        countries: body.countries || [],
        rating: body.rating || 0,
        duration: body.duration,
        type: (() => {
          switch (body.type) {
            case 'SERIES':
              return MovieType.SERIES
            case 'ANIMATED_SERIES':
              return MovieType.ANIMATED_SERIES
            case 'ANIMATED_MOVIE':
              return MovieType.ANIMATED_MOVIE
            case 'COLLECTION':
              return MovieType.COLLECTION
            default:
              return MovieType.MOVIE
          }
        })(),
        tmdbId: body.tmdbId,
        imdbId: body.imdbId,
      }

      if (body.videoLinks && Array.isArray(body.videoLinks)) {
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
        movieData.videoLinks = {
          create: validatedLinks,
        }
      }

      if (body.episodes && Array.isArray(body.episodes)) {
        movieData.episodes = {
          create: body.episodes.map((ep: EpisodeCreateInput) => {
            const episodeData: Prisma.EpisodeUncheckedCreateWithoutMovieInput = {
              episodeNumber: ep.episodeNumber,
              seasonNumber: ep.seasonNumber,
              title: ep.title,
              description: ep.description ?? null,
              duration: ep.duration ?? null,
              thumbnail: ep.thumbnail ?? null,
            }
            if (ep.videoLinks && ep.videoLinks.length > 0) {
              return {
                ...episodeData,
                videoLinks: {
                  create: ep.videoLinks.map((vl: VideoLinkCreateInput) => ({
                    url: vl.url,
                    quality: vl.quality || '720p',
                    source: 'EMBED' as VideoSource,
                    language: 'uk',
                    isActive: true,
                  })),
                },
              } as Prisma.EpisodeCreateWithoutMovieInput
            }
            return episodeData as Prisma.EpisodeCreateWithoutMovieInput
          }),
        }
      }

      const movie = await prisma.movie.create({
        data: movieData,
        include: {
          videoLinks: true,
          episodes: {
            include: {
              videoLinks: true,
            },
          },
        },
      })

      return res.status(201).json({ movie })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to create movie',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
