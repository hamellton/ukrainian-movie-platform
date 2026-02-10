import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { AdType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type } = req.query
      const where: any = { isActive: true }
      
      if (type) {
        const adType = (type as string).toUpperCase().replace('-', '_') as AdType
        where.type = adType
      }

      const ads = await prisma.adConfig.findMany({
        where,
        orderBy: { priority: 'desc' },
      })
      return res.status(200).json({ ads })
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch ads', details: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
