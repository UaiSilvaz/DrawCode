'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import CadastroScreen from '@/screens/Cadastro';

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (name: string, email: string, password: string) => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Erro ao criar conta.');
                setLoading(false);
                return;
            }

            // Faz login automático após registro
            const signInResult = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: '/dashboard',
            });

            if (signInResult?.error) {
                setError('Conta criada, mas o login automático falhou. Entre com seu email e senha.');
                return;
            }

            router.replace(signInResult?.url ?? '/dashboard');
            router.refresh();
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook' | 'twitter') => {
        signIn(provider, { callbackUrl: '/dashboard' });
    };

    return (
        <CadastroScreen
            onRegister={handleRegister}
            onSocialLogin={handleSocialLogin}
            error={error}
            loading={loading}
        />
    );
}
