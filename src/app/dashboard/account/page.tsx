import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import AccountSettingsClient from './AccountSettingsClient';

export default async function AccountSettingsPage() {
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
      createdAt: true,
      updatedAt: true,
      _count: { select: { grapeProjects: true } },
    },
  });

  if (!user) {
    redirect('/login');
  }

  return (
    <AccountSettingsClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        projectCount: user._count.grapeProjects,
      }}
    />
  );
}
