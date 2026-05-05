import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const normalizeName = (value: string) => value.replace(/\s+/g, ' ').trim();

export async function GET(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ available: false, error: 'Sessao expirada.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = normalizeName(searchParams.get('name') ?? '');

    if (name.length < 3) {
        return NextResponse.json({
            available: false,
            reason: 'Nome muito curto.',
        });
    }

    if (!/^[A-Za-z0-9_. -]+$/.test(name)) {
        return NextResponse.json({
            available: false,
            reason: 'Use apenas letras, numeros, espacos, ponto, hifen ou underline.',
        });
    }

    const existing = await prisma.user.findFirst({
        where: {
            id: { not: session.user.id },
            name: { equals: name, mode: 'insensitive' },
        },
        select: { id: true },
    });

    return NextResponse.json({
        available: !existing,
        reason: existing ? 'Esse nome de usuario ja esta em uso.' : '',
    });
}
