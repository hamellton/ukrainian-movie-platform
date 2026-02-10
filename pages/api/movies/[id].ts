import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id: id as string },
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
        where: { id: id as string },
        data: { views: { increment: 1 } },
      })

      return res.status(200).json({ movie })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch movie', details: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const movie = await prisma.movie.update({
        where: { id: id as string },
        data: req.body,
      })

      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      return res.status(200).json({ movie })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update movie', details: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const movie = await prisma.movie.update({
        where: { id: id as string },
        data: { isActive: false },
      })

      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      return res.status(200).json({ message: 'Movie deleted successfully' })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to delete movie', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
