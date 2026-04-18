import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Wipe existing data
  await db.module.deleteMany()
  await db.inviteCode.deleteMany()
  await db.membership.deleteMany()
  await db.community.deleteMany()
  await db.user.deleteMany()

  const hash = (pw: string) => bcrypt.hash(pw, 10)

  // Create users
  const admin = await db.user.create({
    data: {
      name: 'Admin Alex',
      username: 'admin_alex',
      email: 'admin@xpgazette.dev',
      passwordHash: await hash('admin123'),
      avatarEmoji: '🎩',
      xp: 8720,
      level: 'Expert',
      streak: 31,
      badges: 14,
      specialty: 'Budgeting & Saving',
      bio: 'Community founder and financial educator.',
      location: 'Katowice, Poland',
      goals: JSON.stringify(['save', 'invest', 'fire']),
    },
  })

  const alice = await db.user.create({
    data: {
      name: 'Alice Kowalski',
      username: 'alice_k',
      email: 'alice@example.com',
      passwordHash: await hash('password123'),
      avatarEmoji: '🦊',
      xp: 3450,
      level: 'Pro',
      streak: 8,
      badges: 5,
      specialty: 'Investing',
      bio: 'Learning to invest for the long term.',
      location: 'Warsaw, Poland',
      goals: JSON.stringify(['invest', 'emergency']),
    },
  })

  const bob = await db.user.create({
    data: {
      name: 'Bob Nowak',
      username: 'bob_n',
      email: 'bob@example.com',
      passwordHash: await hash('password123'),
      avatarEmoji: '🧙',
      xp: 1200,
      level: 'Rookie',
      streak: 3,
      badges: 2,
      specialty: 'DeFi & Web3',
      bio: 'Web3 enthusiast exploring crypto.',
      location: 'Kraków, Poland',
      goals: JSON.stringify(['invest', 'debt']),
    },
  })

  // Create community with admin
  const community = await db.community.create({
    data: {
      name: 'ETH Silesia DAO',
      emoji: '⛓️',
      type: 'DAO',
      isPublic: true,
      adminId: admin.id,
      memberships: {
        create: [
          { userId: admin.id },
          { userId: alice.id },
          { userId: bob.id },
        ],
      },
      inviteCodes: {
        create: [
          { code: 'ETHSIL01', maxUses: 100, uses: 3 },
          { code: 'SILESIA2', maxUses: 25,  uses: 0 },
        ],
      },
      modules: {
        create: [
          { emoji: '💸', title: 'Budgeting Basics',   description: 'Track income, expenses & build habits', lessons: 5, published: true  },
          { emoji: '📈', title: 'Intro to Investing',  description: 'Stocks, ETFs and compound interest',    lessons: 8, published: true  },
          { emoji: '🔥', title: 'FIRE Movement',       description: 'Financial independence retire early',   lessons: 6, published: false },
        ],
      },
    },
  })

  console.log(`✅ Created community: ${community.name} (${community.id})`)
  console.log(`\n📋 Seed accounts:`)
  console.log(`   admin@xpgazette.dev  / admin123   → Admin`)
  console.log(`   alice@example.com    / password123 → Member`)
  console.log(`   bob@example.com      / password123 → Member`)
  console.log(`\n🔑 Invite codes: ETHSIL01 · SILESIA2\n`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
