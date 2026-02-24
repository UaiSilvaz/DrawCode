import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const saveSchema = z.object({
    projectId: z.string().optional(),
    name: z.string().min(1).max(100).default('Sem título'),
    data: z.record(z.string(), z.unknown()),
});

// POST /api/grape/save – salva ou atualiza projeto GrapesJS
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const parsed = saveSchema.safeParse(body);

        if (!parsed.success) {
            const msg = parsed.error.flatten().formErrors[0] ?? Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? 'Dados inválidos';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const { projectId, name, data } = parsed.data;
        const userId = session.user.id;

        let project;

        if (projectId) {
            // Verificar que o projeto pertence ao usuário
            const existing = await prisma.grapeProject.findFirst({
                where: { id: projectId, userId },
            });

            if (!existing) {
                return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
            }

            project = await prisma.grapeProject.update({
                where: { id: projectId },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: { name, data: data as any },
            });
        } else {
            project = await prisma.grapeProject.create({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: { userId, name, data: data as any },
            });
        }

        return NextResponse.json({ project }, { status: 200 });
    } catch (error) {
        console.error('[GRAPE_SAVE]', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// GET /api/grape/save – lista projetos do usuário
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const projects = await prisma.grapeProject.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ projects });
}
