"use client";

import { useEffect, useState } from "react";
import "./hero.css";
import Cadastro from "../Cadastro";

interface LoginProps {
    initialMode?: "login" | "signup";
    onSwitchToSignUp?: () => void;
    onSwitchToLogin?: () => void;
    onClose?: () => void;
    // Props de integração NextAuth
    onLogin?: (email: string, password: string) => Promise<void>;
    onSocialLogin?: (provider: "google" | "facebook" | "twitter") => void;
    error?: string;
    loading?: boolean;
}

export default function Login({
    initialMode = "login",
    onSwitchToSignUp,
    onSwitchToLogin,
    onClose,
    onLogin,
    onSocialLogin,
    error: externalError,
    loading = false,
}: LoginProps) {
    const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        setIsSignUp(initialMode === "signup");
    }, [initialMode]);

    const handleSwitchToSignUp = () => {
        if (onSwitchToSignUp) onSwitchToSignUp();
        else setIsSignUp(true);
    };

    const handleSwitchToLogin = () => {
        if (onSwitchToLogin) onSwitchToLogin();
        else setIsSignUp(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (onLogin) await onLogin(email, password);
    };

    if (isSignUp) {
        return <Cadastro onSwitchToLogin={handleSwitchToLogin} onClose={onClose} />;
    }

    return (
        <section className="hero modal">
            <div className="glow"></div>
            <div className="container">
                <div className="content">
                    <div className="badge">
                        <div className="avatars">
                            <img src="https://i.pravatar.cc/40?img=1" alt="Avatar 1" />
                            <img src="https://i.pravatar.cc/40?img=2" alt="Avatar 2" />
                            <img src="https://i.pravatar.cc/40?img=3" alt="Avatar 3" />
                        </div>
                        <span>Junte-se à comunidade de 1m+ criadores</span>
                    </div>
                    <h1>
                        Bem-vindo(a) de volta
                        <span><br />Faça login na sua conta</span>
                    </h1>
                    <p>
                        Acesse seu painel de controle e continue criando designs incríveis.
                        Insira suas credenciais abaixo.
                    </p>
                </div>

                <div className="card">
                    {onClose && <button className="modal-close" onClick={onClose}>✕</button>}

                    <div className="social-box">
                        <p className="social-title">Login com</p>
                        <div className="social-buttons">
                            <button
                                type="button"
                                className="social-btn google"
                                onClick={() => onSocialLogin?.("google")}
                                title="Login com Google"
                            >
                                <svg viewBox="0 0 48 48" width="22" height="22">
                                    <path fill="currentColor" d="M24 9.5c3.54 0 6.65 1.22 9.1 3.6l6.8-6.8C35.8 2.6 30.3 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.9 6.1C12.4 13.2 17.8 9.5 24 9.5z" />
                                    <path fill="currentColor" d="M46.1 24.5c0-1.7-.1-3.3-.4-4.9H24v9.3h12.5c-.5 2.8-2.1 5.2-4.4 6.8l7 5.4c4.1-3.8 7-9.3 7-16.6z" />
                                    <path fill="currentColor" d="M10.5 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-8-6.2C.9 16.8 0 20.3 0 24s.9 7.2 2.5 10.6z" />
                                    <path fill="currentColor" d="M24 48c6.5 0 12-2.1 16-5.8l-7-5.4c-2 1.4-4.6 2.2-9 2.2-6.2 0-11.5-3.7-13.4-9l-8 6.2C6.6 42.6 14.6 48 24 48z" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className="social-btn x"
                                onClick={() => onSocialLogin?.("twitter")}
                                title="Login com X/Twitter"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="currentColor" d="M18.24 2H21l-6.38 7.29L22 22h-6.78l-5.3-7.32L3.7 22H1l6.82-7.8L2 2h6.95l4.8 6.6L18.24 2z" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className="social-btn facebook"
                                onClick={() => onSocialLogin?.("facebook")}
                                title="Login com Facebook"
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22">
                                    <path fill="currentColor" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 6 4.39 10.98 10.12 11.85v-8.39H7.08V12h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.46h-2.79v8.39C19.61 22.98 24 18 24 12z" />
                                </svg>
                            </button>
                        </div>

                        <div className="social-divider">
                            <span>ou faça login com email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {externalError && (
                            <div style={{
                                padding: '0.6rem 1rem',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '8px',
                                color: '#f87171',
                                fontSize: '0.85rem',
                                marginBottom: '1rem',
                            }}>
                                {externalError}
                            </div>
                        )}

                        <div className="field">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="field">
                            <label>Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bottom">
                            <p>
                                Ao fazer login, você concorda com nossos <strong>Termos</strong> e{" "}
                                <strong>Política de Privacidade</strong>.
                            </p>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Entrando…' : 'Login'}
                            </button>
                        </div>
                    </form>

                    <div className="signup-link">
                        <p>Não tem uma conta? <button
                            type="button"
                            onClick={handleSwitchToSignUp}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}
                        >
                            Cadastre-se aqui
                        </button></p>
                    </div>
                </div>
            </div>
        </section>
    );
}
