import { auth } from '@/lib/auth';
import WebBuilder from '../../screens/Grape/WebBuilder';

export default async function GrapePage() {
    const session = await auth();

    // Middleware já protege a rota, mas verificamos novamente por segurança
    return (
        <WebBuilder
            userId={session?.user?.id}
            projectName="Novo Projeto"
        />
    );
}
