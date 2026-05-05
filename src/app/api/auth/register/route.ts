import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, createSafeUser } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db/prisma';

// ---- Rate Limit simples por IP (em memória) ----
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string, max = 5, windowMs = 60_000): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.reset) {
        rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
        return true;
    }

    if (entry.count >= max) return false;

    entry.count++;
    return true;
}

// ---- Validação Zod ----
const registerSchema = z.object({
    name: z.string()
        .trim()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(32, 'Nome deve ter no maximo 32 caracteres')
        .regex(/^[A-Za-z0-9_. -]+$/, 'Use apenas letras, numeros, espacos, ponto, hifen ou underline'),
    email: z.string().email('Email inválido'),
    password: z
        .string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

export async function POST(request: NextRequest) {
    // Rate limit por IP
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '127.0.0.1';
    if (!rateLimit(ip)) {
        return NextResponse.json(
            { error: 'Muitas tentativas. Aguarde 1 minuto.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            return NextResponse.json(
                { error: issue?.message ?? 'Dados inválidos' },
                { status: 400 }
            );
        }

        const { name, email, password } = parsed.data;

        // Verificar email já cadastrado
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: 'Email já cadastrado' },
                { status: 409 }
            );
        }

        const existingName = await prisma.user.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } },
            select: { id: true },
        });
        if (existingName) {
            return NextResponse.json(
                { error: 'Nome de usuario ja esta em uso' },
                { status: 409 }
            );
        }

        // Hash da senha com bcrypt salt 12
        const hashedPassword = await hashPassword(password);

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER',
            },
        });

        return NextResponse.json(
            { user: createSafeUser(user), message: 'Conta criada com sucesso!' },
            { status: 201 }
        );
    } catch (error) {
        console.error('[REGISTER]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
