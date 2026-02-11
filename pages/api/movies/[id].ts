import { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MovieCreateInput } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid movie ID' })
  }

  if (req.method === 'GET') {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          videoLinks: {
            where: { isActive: true },
          },
          episodes: {
            include: {
              videoLinks: {
                where: { isActive: true },
              },
            },
            orderBy: [
              { seasonNumber: 'asc' },
              { episodeNumber: 'asc' },
            ],
          },
        },
      })

      if (!movie || !movie.isActive) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      await prisma.movie.update({
        where: { id },
        data: { views: { increment: 1 } },
      })

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
      const body = req.body as Partial<MovieCreateInput>
      const updateData: Prisma.MovieUpdateInput = {}
      
      if (body.title !== undefined) updateData.title = body.title
      if (body.titleOriginal !== undefined) updateData.titleOriginal = body.titleOriginal
      if (body.description !== undefined) updateData.description = body.description
      if (body.descriptionShort !== undefined) updateData.descriptionShort = body.descriptionShort
      if (body.poster !== undefined) updateData.poster = body.poster
      if (body.backdrop !== undefined) updateData.backdrop = body.backdrop
      if (body.releaseDate !== undefined) updateData.releaseDate = new Date(body.releaseDate)
      if (body.genres !== undefined) updateData.genres = body.genres
      if (body.countries !== undefined) updateData.countries = body.countries
      if (body.rating !== undefined) updateData.rating = body.rating
      if (body.duration !== undefined) updateData.duration = body.duration
      if (body.tmdbId !== undefined) updateData.tmdbId = body.tmdbId
      if (body.imdbId !== undefined) updateData.imdbId = body.imdbId

      const movie = await prisma.movie.update({
        where: { id },
        data: updateData,
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
      const movie = await prisma.movie.update({
        where: { id },
        data: { isActive: false },
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
