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

      if (type && (type === 'movie' || type === 'series')) {
        where.type = type === 'movie' ? MovieType.MOVIE : MovieType.SERIES
      }

      if (genre && typeof genre === 'string') {
        where.genres = { has: genre }
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
          type: body.type === 'SERIES' ? MovieType.SERIES : MovieType.MOVIE,
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
