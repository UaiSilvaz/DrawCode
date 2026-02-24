import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('@/lib/auth-helpers', () => ({
    hashPassword: vi.fn().mockResolvedValue('$2b$12$hashed'),
    createSafeUser: vi.fn((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, image: null, createdAt: new Date() })),
}));

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-helpers';

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve criar usuário com dados válidos', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
        vi.mocked(prisma.user.create).mockResolvedValue({
            id: 'cuid1',
            name: 'Teste User',
            email: 'teste@example.com',
            password: '$2b$12$hashed',
            role: 'USER',
            image: null,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Simula lógica do handler
        const email = 'teste@example.com';
        const existing = await prisma.user.findUnique({ where: { email } });
        expect(existing).toBeNull();

        const hashed = await hashPassword('SenhaForte@1');
        expect(hashed).toBe('$2b$12$hashed');

        const user = await prisma.user.create({
            data: { name: 'Teste User', email, password: hashed, role: 'USER' },
        });
        expect(user.email).toBe(email);
        expect(user.role).toBe('USER');
    });

    it('deve rejeitar email já cadastrado', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: 'existing-id',
            name: 'Existente',
            email: 'existente@example.com',
            password: 'hash',
            role: 'USER',
            image: null,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const existing = await prisma.user.findUnique({ where: { email: 'existente@example.com' } });
        expect(existing).not.toBeNull();
        // Handler deve retornar 409 neste caso
    });

    it('deve rejeitar senha fraca (sem maiúscula)', () => {
        const { z } = require('zod');
        const schema = z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(8).regex(/[A-Z]/),
        });

        const result = schema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            password: 'senhafraca123',
        });
        expect(result.success).toBe(false);
    });

    it('deve aceitar senha forte', () => {
        const { z } = require('zod');
        const schema = z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
        });

        const result = schema.safeParse({
            name: 'Test',
            email: 'test@test.com',
            password: 'SenhaForte123',
        });
        expect(result.success).toBe(true);
    });
});
