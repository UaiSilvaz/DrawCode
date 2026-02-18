"use client";

import { useState } from "react";
import Image from "next/image";
import "./hero.css";

interface CadastroProps {
    onSwitchToLogin?: () => void;
    onClose?: () => void;
}

export default function Cadastro({ onSwitchToLogin, onClose }: CadastroProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSwitchToLogin = () => {
        if (onSwitchToLogin) {
            onSwitchToLogin();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("As senhas não correspondem!");
            return;
        }
        console.log("Cadastro:", formData);
        // Aqui você adiciona a lógica de cadastro (API call)
    };

    return (
        <section className="hero modal">
            <div className="glow"></div>

            <div className="container">
                <div className="content">
                    <div className="badge">
                        <div className="avatars">
                            <Image src="https://i.pravatar.cc/40?img=1" alt="Avatar 1" width={40} height={40} />
                            <Image src="https://i.pravatar.cc/40?img=2" alt="Avatar 2" width={40} height={40} />
                            <Image src="https://i.pravatar.cc/40?img=3" alt="Avatar 3" width={40} height={40} />
                        </div>
                        <span>Junte-se a comunidade de 1m+ criadores</span>
                    </div>

                    <h1>
                        Crie sua conta
                        <span><br></br>e comece a criar designs incríveis</span>
                    </h1>

                    <p>
                        Preencha os dados abaixo para criar sua conta e acessar todas as
                        ferramentas do DrawCode.
                    </p>
                </div>

                <div className="card">
                    {onClose && <button className="modal-close" onClick={onClose}>✕</button>}
                    <form onSubmit={handleSubmit}>
                        {/* Username */}
                        <div className="field">
                            <label>Nome de usuário</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="seu_usuario"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="field">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Senha */}
                        <div className="field">
                            <label>Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Digite sua senha"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
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

                        {/* Confirmar Senha */}
                        <div className="field">
                            <label>Confirmar Senha</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirme sua senha"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
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
                                Ao criar uma conta, você concorda com nossos <strong>Termos</strong> e{" "}
                                <strong>Política de Privacidade</strong>.
                            </p>

                            <button type="submit">Criar conta</button>
                        </div>

                    </form>
                    <div className="signup-link">
                        <p>Já tem uma conta? <button
                            type="button"
                            onClick={handleSwitchToLogin}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}
                        >
                            faça login aqui
                        </button></p>
                    </div>

                </div>

            </div>
        </section>
    );
}