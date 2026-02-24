import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSafeUser } from '@/lib/auth-helpers';

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { grapeProjects: true } },
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
}
