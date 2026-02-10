import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { MovieType } from '@prisma/client'

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

      const where: any = { isActive: true }

      if (type && (type === 'movie' || type === 'series')) {
        where.type = type === 'movie' ? MovieType.MOVIE : MovieType.SERIES
      }

      if (genre) {
        where.genres = { has: genre as string }
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ]
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
      const orderBy: any = {}

      if (sort.startsWith('-')) {
        orderBy[sort.substring(1)] = 'desc'
      } else {
        orderBy[sort] = 'asc'
      }

      const [movies, total] = await Promise.all([
        prisma.movie.findMany({
          where,
          orderBy,
          skip,
          take: parseInt(limit as string),
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
      const movieData = req.body
      const movie = await prisma.movie.create({
        data: movieData,
      })

      return res.status(201).json({ movie })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create movie', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
