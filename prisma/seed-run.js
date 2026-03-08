/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async function main() {
  try {
    console.log('🌱 Iniciando seed (JS)...');

    const adminEmail = 'admin@drawcode.app';
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existing) {
      const hashed = await bcrypt.hash('Admin@123', 12);
      const admin = await prisma.user.create({
        data: {
          name: 'Admin DrawCode',
          email: adminEmail,
          password: hashed,
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin criado:', admin.email);
    } else {
      console.log('ℹ️ Admin já existe:', existing.email);
    }

    const testEmail = 'teste@drawcode.app';
    const existingTest = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!existingTest) {
      const hashed = await bcrypt.hash('Teste@123', 12);
      const testUser = await prisma.user.create({
        data: {
          name: 'Usuário Teste',
          email: testEmail,
          password: hashed,
          role: 'USER',
        },
      });
      console.log('✅ Usuário teste criado:', testUser.email);
    } else {
      console.log('ℹ️ Usuário teste já existe:', existingTest.email);
    }

    console.log('✅ Seed (JS) concluído!');
  } catch (e) {
    console.error('❌ Erro no seed (JS):', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
