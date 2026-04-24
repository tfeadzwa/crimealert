import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) {
    console.log('❌ Invalid hash format');
    return false;
  }
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
};

async function main() {
  try {
    const email = 'admin@police.zw';
    const password = 'admin123';

    console.log(`\n🔑 Testing login for ${email}:`);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✓ User found');
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Active: ${user.isActive}`);

    const passwordMatch = verifyPassword(password, user.passwordHash);
    console.log(`\n🔐 Password verification: ${passwordMatch ? '✓ MATCH' : '❌ NO MATCH'}`);

    if (!passwordMatch) {
      console.log('\n⚠️  Password verification failed!');
      console.log('This is likely why login credentials are not working.');
    } else {
      console.log('\n✅ Password verification successful!');
      console.log('The password should work for login.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
