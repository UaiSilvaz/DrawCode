import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import type { SavedGrapeProjectData } from '@/screens/Grape/web-builder/builder-core';
import WebBuilder from '../../screens/Grape/WebBuilder';

type GrapePageProps = {
    searchParams?: Promise<{
        projectId?: string;
    }>;
};

export default async function GrapePage({ searchParams }: GrapePageProps) {
    const session = await auth();
    const params = await searchParams;
    const projectId = typeof params?.projectId === 'string' ? params.projectId : '';
    const project = projectId && session?.user?.id
        ? await prisma.grapeProject.findFirst({
            where: { id: projectId, userId: session.user.id },
            select: { id: true, name: true, data: true },
        })
        : null;
    const projectData = project?.data && typeof project.data === 'object' && !Array.isArray(project.data)
        ? project.data as SavedGrapeProjectData
        : null;

    // Middleware já protege a rota, mas verificamos novamente por segurança
    return (
        <WebBuilder
            userId={session?.user?.id}
            projectId={project?.id}
            projectName={project?.name ?? 'Novo Projeto'}
            projectData={projectData}
        />
    );
}
