import { NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth'
import { AdType } from '@prisma/client'

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
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch ads', details: error.message })
    }
  }

  if (req.method === 'POST') {
    try {
      const adData = req.body
      if (adData.type) {
        adData.type = adData.type.toUpperCase().replace('-', '_') as AdType
      }
      const ad = await prisma.adConfig.create({
        data: adData,
      })
      return res.status(201).json({ ad })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to create ad', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default requireAuth(handler)
