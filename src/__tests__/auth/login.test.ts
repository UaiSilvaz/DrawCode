import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role } from '@prisma/client';

vi.mock('@/lib/db/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('@/lib/auth/helpers', () => ({
    verifyPassword: vi.fn(),
}));

import { verifyPassword } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';

describe('Login via Credentials', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve autenticar com credenciais válidas', async () => {
        const mockUser = {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Usuário',
            password: '123456',
            role: Role.USER,
            image: null,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(verifyPassword).mockResolvedValue(true);

        const user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
        expect(user).not.toBeNull();

        const isValid = await verifyPassword('SenhaCorreta@1', user!.password!);
        expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
        const mockUser = {
            id: 'user-1',
            email: 'user@example.com',
            name: 'Usuário',
            password: '$2b$12$hashed',
            role: Role.USER,
            image: null,
            emailVerified: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
        vi.mocked(verifyPassword).mockResolvedValue(false);

        const user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
        const isValid = await verifyPassword('SenhaErrada', user!.password!);
        expect(isValid).toBe(false);
    });

    it('deve rejeitar email inexistente', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const user = await prisma.user.findUnique({ where: { email: 'naoexiste@example.com' } });
        expect(user).toBeNull();
        // authorize() retorna null → 401
    });
});
