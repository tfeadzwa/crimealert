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
  const [saltHex, hash] = hashedPassword.split(':');
  if (!saltHex || !hash) {
    console.log('  Invalid format - no colon separator');
    return false;
  }
  const salt = Buffer.from(saltHex, 'hex');
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
};

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@police.zw' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('🔍 Debug password hash from database:\n');
    console.log('Stored hash:', user.passwordHash);
    console.log('\nHash length:', user.passwordHash.length);
    
    const parts = user.passwordHash.split(':');
    console.log('Parts after split:', parts.length);
    
    if (parts.length === 2) {
      console.log('  Salt hex:', parts[0], `(length: ${parts[0].length})`);
      console.log('  Hash:', parts[1].substring(0, 50) + '...', `(length: ${parts[1].length})`);
    } else {
      console.log('  ⚠️  Unexpected format - not 2 parts');
    }

    console.log('\n🔑 Testing password verification:\n');
    const result = verifyPassword('admin123', user.passwordHash);
    console.log('Result:', result ? '✅ MATCH' : '❌ NO MATCH');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
