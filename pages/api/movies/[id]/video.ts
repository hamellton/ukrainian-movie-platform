import { NextApiRequest, NextApiResponse } from 'next'
import { VideoLink, VideoSource } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { parseVideoUrl } from '@/utils/videoParser'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, episodeNumber, seasonNumber } = req.query

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
          },
        },
      })

      if (!movie || !movie.isActive) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      let videoLinks: VideoLink[] = []

      if ((movie.type === 'SERIES' || movie.type === 'ANIMATED_SERIES') && episodeNumber && seasonNumber) {
        const episodeNum = typeof episodeNumber === 'string' ? parseInt(episodeNumber) : undefined
        const seasonNum = typeof seasonNumber === 'string' ? parseInt(seasonNumber) : undefined

        if (episodeNum !== undefined && seasonNum !== undefined) {
          const episode = movie.episodes.find(
            (ep) => ep.episodeNumber === episodeNum && ep.seasonNumber === seasonNum
          )
          if (episode) {
            videoLinks = episode.videoLinks
          }
        }
      } else {
        videoLinks = movie.videoLinks
      }

      if (videoLinks.length === 0) {
        return res.status(404).json({ error: 'No video links available' })
      }

      const parsedLinks = await Promise.all(
        videoLinks.map(async (link) => {
          if (link.source === 'PARSED' || link.source === 'DIRECT') {
            return link
          }

          const parsed = await parseVideoUrl(link.url)
          if (parsed) {
            return {
              ...link,
              source: parsed.source.toUpperCase() as VideoSource,
              url: parsed.url,
              quality: parsed.quality || link.quality,
            }
          }

          return link
        })
      )

      return res.status(200).json({ videoLinks: parsedLinks })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to fetch video links',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
