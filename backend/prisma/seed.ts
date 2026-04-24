import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Password hashing function (matches auth.controller.ts implementation)
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16);
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return salt.toString('hex') + ':' + hash;
};

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create or update admin police user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@police.zw' },
      update: {},
      create: {
        email: 'admin@police.zw',
        passwordHash: hashPassword('admin123'),
        firstName: 'Admin',
        lastName: 'Officer',
        phone: '+263 712 345 678',
        isActive: true,
        isVerified: true,
        role: 'admin',
        department: 'Police Management',
        badgeNumber: 'ADMIN-001',
      },
    });

    console.log('✅ Created admin user:', adminUser.email);

    // Create test supervisor user
    const supervisorUser = await prisma.user.upsert({
      where: { email: 'supervisor@police.zw' },
      update: {},
      create: {
        email: 'supervisor@police.zw',
        passwordHash: hashPassword('supervisor123'),
        firstName: 'Supervisor',
        lastName: 'John',
        phone: '+263 712 987 654',
        isActive: true,
        isVerified: true,
        role: 'supervisor',
        department: 'Crime Intelligence',
        badgeNumber: 'SUP-001',
      },
    });

    console.log('✅ Created supervisor user:', supervisorUser.email);

    // Create test officer user
    const officerUser = await prisma.user.upsert({
      where: { email: 'officer@police.zw' },
      update: {},
      create: {
        email: 'officer@police.zw',
        passwordHash: hashPassword('officer123'),
        firstName: 'Officer',
        lastName: 'Jane',
        phone: '+263 712 555 666',
        isActive: true,
        isVerified: true,
        role: 'officer',
        department: 'Crime Prevention',
        badgeNumber: 'OFF-001',
      },
    });

    console.log('✅ Created officer user:', officerUser.email);

    // Create test gateway client if it doesn't exist
    const gatewayClient = await prisma.gatewayClient.upsert({
      where: { apiKey: 'test-key' },
      update: {},
      create: {
        name: 'Test SMS Gateway',
        apiKey: 'test-key',
        isActive: true,
      },
    });

    console.log('✅ Created gateway client:', gatewayClient.name);

    console.log(
      '\n📝 Test Credentials:\n' +
        '─────────────────────────────────────\n' +
        'Admin:\n' +
        '  Email: admin@police.zw\n' +
        '  Password: admin123\n' +
        '  Role: admin\n\n' +
        'Supervisor:\n' +
        '  Email: supervisor@police.zw\n' +
        '  Password: supervisor123\n' +
        '  Role: supervisor\n\n' +
        'Officer:\n' +
        '  Email: officer@police.zw\n' +
        '  Password: officer123\n' +
        '  Role: officer\n' +
        '─────────────────────────────────────'
    );
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
