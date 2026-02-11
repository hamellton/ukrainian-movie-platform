import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { AdType } from '@prisma/client'
import { PrismaAdConfigWhereInput } from '@/types'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type } = req.query
      const where: PrismaAdConfigWhereInput = { isActive: true }

      if (type && typeof type === 'string') {
        const adType = type.toUpperCase().replace('-', '_') as AdType
        where.type = adType
      }

      const ads = await prisma.adConfig.findMany({
        where,
        orderBy: { priority: 'desc' },
      })
      return res.status(200).json({ ads })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to fetch ads',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
