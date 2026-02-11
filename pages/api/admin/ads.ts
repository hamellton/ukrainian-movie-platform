import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { AdType } from '@prisma/client'
import { getErrorMessage, getErrorDetails } from '@/utils/errorHandler'

interface AdConfigCreateInput {
  name: string
  type: string
  position?: number
  adTag: string
  isActive?: boolean
  priority?: number
  startTime?: number
  endTime?: number
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const ads = await prisma.adConfig.findMany({
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      })
      return res.status(200).json({ ads })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to fetch ads',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  if (req.method === 'POST') {
    try {
      const adData = req.body as AdConfigCreateInput
      if (!adData.type) {
        return res.status(400).json({ error: 'Ad type is required' })
      }

      const typedAdData: {
        name: string
        type: AdType
        position?: number
        adTag: string
        isActive?: boolean
        priority?: number
        startTime?: number
        endTime?: number
      } = {
        ...adData,
        type: adData.type.toUpperCase().replace('-', '_') as AdType,
      }
      const ad = await prisma.adConfig.create({
        data: typedAdData,
      })
      return res.status(201).json({ ad })
    } catch (error: unknown) {
      return res.status(500).json({
        error: 'Failed to create ad',
        details: getErrorDetails(error) || getErrorMessage(error),
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
