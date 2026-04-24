import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        passwordHash: true,
      }
    });

    console.log('\n📋 Users in database:');
    users.forEach(u => {
      console.log(`\nEmail: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log(`Active: ${u.isActive}`);
      console.log(`Verified: ${u.isVerified}`);
      console.log(`PasswordHash: ${u.passwordHash.substring(0, 50)}...`);
    });

    if (users.length === 0) {
      console.log('\n⚠️  No users found in database!');
    } else {
      console.log(`\n✅ Found ${users.length} users`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
