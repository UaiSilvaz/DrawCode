'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import LoginScreen from '@/screens/Login';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (email: string, password: string) => {
        setLoading(true);
        setError('');
        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
            callbackUrl: '/dashboard',
        });
        setLoading(false);
        if (res?.error) {
            setError('Email ou senha incorretos.');
        } else {
            window.location.assign(res?.url ?? '/dashboard');
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook' | 'twitter') => {
        signIn(provider, { callbackUrl: '/dashboard' });
    };

    return (
        <LoginScreen
            onLogin={handleLogin}
            onSocialLogin={handleSocialLogin}
            error={error}
            loading={loading}
        />
    );
}
