const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.gatewayClient.findFirst({ where: { apiKey: 'test-key' } });
    if (existing) {
      console.log('Gateway client already exists:', existing.id);
      await prisma.$disconnect();
      return;
    }
    const client = await prisma.gatewayClient.create({ data: { name: 'local-gateway', apiKey: 'test-key' } });
    console.log('Created gateway client:', client.id);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
