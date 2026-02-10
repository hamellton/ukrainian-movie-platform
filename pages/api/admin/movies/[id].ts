import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { parseVideoUrl, validateVideoUrl } from '@/utils/videoParser'
import { MovieType, VideoSource } from '@prisma/client'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const movie = await prisma.movie.findUnique({
        where: { id: id as string },
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch movie', details: error.message })
    }
  }

  if (req.method === 'PUT') {
    try {
      const updateData: any = { ...req.body }

      if (updateData.releaseDate) {
        updateData.releaseDate = new Date(updateData.releaseDate)
      }

      if (updateData.videoLinks && Array.isArray(updateData.videoLinks)) {
        await prisma.videoLink.deleteMany({
          where: { movieId: id as string },
        })

        const validatedLinks = []
        for (const link of updateData.videoLinks) {
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
        updateData.videoLinks = {
          create: validatedLinks,
        }
      }

      if (updateData.type) {
        updateData.type = updateData.type.toUpperCase() === 'MOVIE' ? MovieType.MOVIE : MovieType.SERIES
      }

      const movie = await prisma.movie.update({
        where: { id: id as string },
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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to update movie', details: error.message })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const movie = await prisma.movie.delete({
        where: { id: id as string },
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

export default requireAuth(handler)
