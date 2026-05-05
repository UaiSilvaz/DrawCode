import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
        },
    });

    if (!user) {
        redirect('/login');
    }

    return <DashboardClient user={user} />;
}
