import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { parseVideoUrl, validateVideoUrl } from '@/utils/videoParser'
import { MovieType, VideoSource } from '@prisma/client'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '50',
        search,
        type,
      } = req.query

      const where: any = {}

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ]
      }

      if (type) {
        where.type = type === 'movie' ? MovieType.MOVIE : MovieType.SERIES
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
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
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch movies', details: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const movieData: any = { ...req.body }

      if (movieData.releaseDate) {
        movieData.releaseDate = new Date(movieData.releaseDate)
      }

      if (movieData.videoLinks && Array.isArray(movieData.videoLinks)) {
        const validatedLinks = []
        for (const link of movieData.videoLinks) {
          if (validateVideoUrl(link.url)) {
            const parsed = await parseVideoUrl(link.url)
            if (parsed) {
              validatedLinks.push({
                url: link.url,
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

      if (movieData.episodes && Array.isArray(movieData.episodes)) {
        movieData.episodes = {
          create: movieData.episodes.map((ep: any) => ({
            episodeNumber: ep.episodeNumber,
            seasonNumber: ep.seasonNumber,
            title: ep.title,
            description: ep.description,
            duration: ep.duration,
            thumbnail: ep.thumbnail,
            videoLinks: ep.videoLinks ? {
              create: ep.videoLinks.map((vl: any) => ({
                url: vl.url,
                quality: vl.quality || '720p',
                source: 'EMBED' as VideoSource,
                language: 'uk',
                isActive: true,
              })),
            } : undefined,
          })),
        }
      }

      if (movieData.type) {
        movieData.type = movieData.type.toUpperCase() === 'MOVIE' ? MovieType.MOVIE : MovieType.SERIES
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create movie', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
