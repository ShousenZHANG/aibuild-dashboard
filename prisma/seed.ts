import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('123456', 10)

    const user = await prisma.user.upsert({
        where: { email: 'admin@aibuild.com' },
        update: {},
        create: {
            email: 'admin@aibuild.com',
            username: 'Admin User',
            password: passwordHash,
        },
    })

    console.log(`✅ Default admin created: ${user.email} / 123456`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
        console.log('🌱 Seed completed successfully!')
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
