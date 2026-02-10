import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/utils/jwt'

export interface AuthenticatedRequest extends NextApiRequest {
  admin?: {
    id: string
    username: string
    email: string
    role: string
  }
}

export async function authenticateAdmin(req: NextApiRequest) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) {
      return { error: 'Unauthorized', status: 401 }
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.id) {
      return { error: 'Invalid token', status: 401 }
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    })

    if (!admin || !admin.isActive) {
      return { error: 'Admin not found or inactive', status: 401 }
    }

    return { admin }
  } catch (error) {
    return { error: 'Authentication failed', status: 401 }
  }
}

export function requireAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const authResult = await authenticateAdmin(req)
    
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error })
    }

    req.admin = authResult.admin
    return handler(req, res)
  }
}
