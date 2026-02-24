import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MovieType } from '@prisma/client'
import { PrismaMovieWhereInput, PrismaMovieOrderByInput, MovieCreateInput } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '20',
        type,
        genre,
        search,
        sort = '-createdAt',
      } = req.query

      const where: PrismaMovieWhereInput = { isActive: true }

      if (type && typeof type === 'string') {
        const types = type.split(',').map(t => t.trim())
        if (types.length > 1) {
          where.type = { in: types.map(t => {
            switch (t) {
              case 'movie':
                return MovieType.MOVIE
              case 'series':
                return MovieType.SERIES
              case 'animated-movie':
                return MovieType.ANIMATED_MOVIE
              case 'animated-series':
                return MovieType.ANIMATED_SERIES
              case 'collection':
                return MovieType.COLLECTION
              default:
                return null
            }
          }).filter(Boolean) as MovieType[] }
        } else {
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
      }

      if (genre && typeof genre === 'string') {
        const genreVariants: Record<string, string[]> = {
          'Фантастика': ['Фантастика', 'Науково фантастичний', 'Наукова фантастика', 'Science Fiction', 'Sci-Fi'],
          'Детектив': ['Детектив', 'Mystery', 'Crime'],
          'Бойовик': ['Бойовик', 'Екшн', 'Action'],
          'Пригоди': ['Пригоди', 'Adventure'],
          'Комедія': ['Комедія', 'Comedy'],
          'Драма': ['Драма', 'Drama'],
          'Жахи': ['Жахи', 'Horror'],
          'Трилер': ['Трилер', 'Thriller'],
          'Романтика': ['Романтика', 'Romance', 'Мелодрама'],
          'Анімація': ['Анімація', 'Animation', 'Мультфільм', 'Мультиплікація'],
        }
        
        const variants = genreVariants[genre] || [genre]
        where.genres = { hasSome: variants }
      }

      if (search && typeof search === 'string') {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }

      const skip = (parseInt(String(page)) - 1) * parseInt(String(limit))
      const orderBy: PrismaMovieOrderByInput = {}
      const sortStr = Array.isArray(sort) ? sort[0] : sort

      if (typeof sortStr === 'string') {
        if (sortStr.startsWith('-')) {
          const field = sortStr.substring(1) as keyof PrismaMovieOrderByInput
          orderBy[field] = 'desc'
        } else {
          const field = sortStr as keyof PrismaMovieOrderByInput
          orderBy[field] = 'asc'
        }
      }

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          orderBy,
          skip,
          take: parseInt(String(limit)),
          select: {
            id: true,
            title: true,
            titleOriginal: true,
            description: true,
            descriptionShort: true,
            poster: true,
            backdrop: true,
            releaseDate: true,
            genres: true,
            countries: true,
            rating: true,
            ratingCount: true,
            duration: true,
            type: true,
            tmdbId: true,
            imdbId: true,
            views: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
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
      const body = req.body as MovieCreateInput
      const movie = await prisma.movie.create({
        data: {
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
