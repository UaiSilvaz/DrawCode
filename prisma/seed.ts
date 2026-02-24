import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth-helpers';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Usuário admin padrão
    const adminEmail = 'admin@drawcode.app';
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existing) {
        const hashedPassword = await hashPassword('Admin@123');
        const admin = await prisma.user.create({
            data: {
                name: 'Admin DrawCode',
                email: adminEmail,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log(`✅ Admin criado: ${admin.email}`);
    } else {
        console.log(`ℹ️  Admin já existe: ${existing.email}`);
    }

    // Usuário de teste
    const testEmail = 'teste@drawcode.app';
    const existingTest = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!existingTest) {
        const hashedPassword = await hashPassword('Teste@123');
        const testUser = await prisma.user.create({
            data: {
                name: 'Usuário Teste',
                email: testEmail,
                password: hashedPassword,
                role: 'USER',
            },
        });
        console.log(`✅ Usuário teste criado: ${testUser.email}`);
    } else {
        console.log(`ℹ️  Usuário teste já existe: ${existingTest.email}`);
    }

    console.log('✅ Seed concluído!');
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
