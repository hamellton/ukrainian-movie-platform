import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { parseVideoUrl } from '@/utils/videoParser'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, episodeNumber, seasonNumber } = req.query

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
          },
        },
      })

      if (!movie || !movie.isActive) {
        return res.status(404).json({ error: 'Movie not found' })
      }

      let videoLinks = []

      if (movie.type === 'SERIES' && episodeNumber && seasonNumber) {
        const episode = movie.episodes.find(
          ep => ep.episodeNumber === parseInt(episodeNumber as string) &&
          ep.seasonNumber === parseInt(seasonNumber as string)
        )
        if (episode) {
          videoLinks = episode.videoLinks
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
              source: parsed.source.toUpperCase(),
              url: parsed.url,
              quality: parsed.quality || link.quality,
            }
          }

          return link
        })
      )

      return res.status(200).json({ videoLinks: parsedLinks })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch video links', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
