import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

const profileUpdateSchema = z.object({
    name: z.string()
        .trim()
        .min(3, 'Nome de usuario deve ter pelo menos 3 caracteres.')
        .max(32, 'Nome de usuario deve ter no maximo 32 caracteres.')
        .regex(/^[A-Za-z0-9_. -]+$/, 'Use apenas letras, numeros, espacos, ponto, hifen ou underline.'),
    image: z.string().trim().nullable().optional(),
});

const isAllowedProfileImage = (value: string | null | undefined) => {
    if (value == null || value === '') return true;
    if (value.length > 1_600_000) return false;
    if (/^https:\/\/[^\s]+$/i.test(value)) return true;
    return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
};

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

export async function PATCH(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Sessao expirada. Entre novamente.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return NextResponse.json(
            { error: issue?.message ?? 'Dados invalidos para atualizar a conta.' },
            { status: 400 },
        );
    }

    const nextName = parsed.data.name.replace(/\s+/g, ' ').trim();
    const shouldUpdateImage = Object.prototype.hasOwnProperty.call(parsed.data, 'image');
    const nextImage = parsed.data.image === '' ? null : parsed.data.image;

    if (!isAllowedProfileImage(nextImage)) {
        return NextResponse.json(
            { error: 'Use uma imagem PNG, JPG, WEBP, GIF ou uma URL HTTPS valida de imagem.' },
            { status: 400 },
        );
    }

    const existingName = await prisma.user.findFirst({
        where: {
            id: { not: session.user.id },
            name: { equals: nextName, mode: 'insensitive' },
        },
        select: { id: true },
    });

    if (existingName) {
        return NextResponse.json(
            { error: 'Esse nome de usuario ja esta em uso.', field: 'name' },
            { status: 409 },
        );
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: nextName,
            ...(shouldUpdateImage ? { image: nextImage ?? null } : {}),
        },
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

    return NextResponse.json({
        user,
        message: 'Conta atualizada com sucesso.',
    });
}
