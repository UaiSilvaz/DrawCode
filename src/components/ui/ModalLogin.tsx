"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Login from "@/screens/Login";
import Cadastro from "@/screens/Cadastro";
import "./modal.css";
import { signIn } from "next-auth/react";

type ModalLoginProps = {
    open: boolean;
    onClose: () => void;
    initialMode?: "login" | "signup";
    callbackUrl?: string;
};

export default function ModalLogin({ open, onClose, initialMode = "login", callbackUrl = "/dashboard" }: ModalLoginProps) {
    const [mode, setMode] = useState<"login" | "signup">(initialMode);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const prevOpenRef = useRef(open);
    const [, startTransition] = useTransition();

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            startTransition(() => {
                setMode(initialMode);
            });
        }
        prevOpenRef.current = open;
    }, [open, initialMode]);

    const handleLogin = async (email: string, password: string) => {
        setLoading(true);
        setError("");
        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
            callbackUrl,
        });
        setLoading(false);
        if (res?.error) {
            setError('Email ou senha incorretos.');
        } else {
            handleClose();
            window.location.assign(res?.url ?? callbackUrl);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook' | 'twitter') => {
        signIn(provider, { callbackUrl });
    };

    function handleClose() {
        setTimeout(() => {
            onClose();
        }, 300);
    }

    const handleRegister = async (name: string, email: string, password: string) => {
        setLoading(true);
        setError("");

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
                callbackUrl,
            });

            if (signInResult?.error) {
                setError('Conta criada, mas o login automático falhou. Entre com seu email e senha.');
                return;
            }

            handleClose();
            window.location.assign(signInResult?.url ?? callbackUrl);
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    function handleSwitchToSignUp() {
        setMode("signup");
        setError("");
    }

    function handleSwitchToLogin() {
        setMode("login");
        setError("");
    }

    if (!open) return null;

    return (
        <div
            className={`modal-overlay ${open ? "show" : "hide"}`}
            onClick={handleClose}
        >
            <div
                className={`modal-box ${open ? "show" : "hide"}`}
                onClick={(e) => e.stopPropagation()}
            >
                {mode === "login" ? (
                    <Login
                        initialMode={mode}
                        onSwitchToSignUp={handleSwitchToSignUp}
                        onSwitchToLogin={handleSwitchToLogin}
                        onClose={handleClose}
                        onLogin={handleLogin}
                        onSocialLogin={handleSocialLogin}
                        error={error}
                        loading={loading}
                    />
                ) : (
                    <Cadastro
                        onSwitchToLogin={handleSwitchToLogin}
                        onClose={handleClose}
                        onRegister={handleRegister}
                        onSocialLogin={handleSocialLogin}
                        error={error}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
