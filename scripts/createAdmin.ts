import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const username = process.argv[2] || 'admin'
    const email = process.argv[3] || 'admin@example.com'
    const password = process.argv[4] || 'admin123'

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingAdmin) {
      console.log('Admin already exists')
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    console.log('Admin created successfully:')
    console.log(`Username: ${username}`)
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)

    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
