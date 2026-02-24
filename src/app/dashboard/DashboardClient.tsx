'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
}

interface Project {
    id: string;
    name: string;
    updatedAt: string;
}

export default function DashboardClient({ user }: { user: User }) {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        fetch('/api/grape/save')
            .then((r) => r.json())
            .then((data) => setProjects(data.projects ?? []))
            .finally(() => setLoadingProjects(false));
    }, []);

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('');
    };

    const initials = (user.name ?? user.email ?? '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="dashboard-wrapper">
            <style>{`
        .dashboard-wrapper {
          min-height: 100vh;
          background: radial-gradient(ellipse at 20% 50%, rgba(120,40,200,0.15) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(40,120,200,0.1) 0%, transparent 50%),
                      #09090b;
          color: #fafafa;
          font-family: var(--font-geist-sans), sans-serif;
          padding: 2rem;
        }
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .dash-logo {
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dash-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .dash-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: white;
          overflow: hidden;
        }
        .dash-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dash-user-name { font-weight: 600; font-size: 0.95rem; }
        .dash-user-email { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
        .dash-logout-btn {
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: #fafafa;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .dash-logout-btn:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.4);
          color: #f87171;
        }
        .dash-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .dash-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 1.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .dash-card:hover { border-color: rgba(167,139,250,0.3); transform: translateY(-2px); }
        .dash-card-icon {
          font-size: 1.8rem;
          margin-bottom: 0.75rem;
        }
        .dash-card-label {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.3rem;
        }
        .dash-card-value {
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .dash-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: rgba(255,255,255,0.85);
        }
        .dash-projects {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .dash-project-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dash-project-card:hover {
          border-color: rgba(96,165,250,0.3);
          background: rgba(96,165,250,0.05);
        }
        .dash-project-name { font-weight: 600; margin-bottom: 0.4rem; font-size: 0.9rem; }
        .dash-project-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .dash-open-editor-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          margin-top: 1rem;
          transition: opacity 0.2s, transform 0.2s;
        }
        .dash-open-editor-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .dash-role-badge {
          display: inline-block;
          padding: 0.15rem 0.6rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 600;
          background: rgba(167,139,250,0.15);
          border: 1px solid rgba(167,139,250,0.3);
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dash-empty {
          text-align: center;
          padding: 2rem;
          color: rgba(255,255,255,0.35);
          font-size: 0.9rem;
        }
      `}</style>

            {/* Header */}
            <header className="dash-header">
                <div className="dash-logo">✦ DrawCode</div>
                <div className="dash-user-info">
                    <div>
                        <div className="dash-user-name">{user.name ?? 'Usuário'}</div>
                        <div className="dash-user-email">{user.email}</div>
                    </div>
                    <div className="dash-avatar">
                        {user.image ? <img src={user.image} alt="Avatar" /> : initials}
                    </div>
                    <button className="dash-logout-btn" onClick={handleLogout}>
                        Sair
                    </button>
                </div>
            </header>

            {/* Cards de resumo */}
            <section className="dash-cards">
                <div className="dash-card">
                    <div className="dash-card-icon">👤</div>
                    <div className="dash-card-label">Conta</div>
                    <div className="dash-card-value">{user.name?.split(' ')[0] ?? 'Olá!'}</div>
                    <span className="dash-role-badge" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        {user.role ?? 'USER'}
                    </span>
                </div>
                <div className="dash-card">
                    <div className="dash-card-icon">📁</div>
                    <div className="dash-card-label">Projetos</div>
                    <div className="dash-card-value">{loadingProjects ? '…' : projects.length}</div>
                </div>
                <div className="dash-card">
                    <div className="dash-card-icon">✉️</div>
                    <div className="dash-card-label">Email</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.25rem' }}>{user.email}</div>
                </div>
            </section>

            {/* Projetos salvos */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="dash-section-title">Meus Projetos</div>
                    <button className="dash-open-editor-btn" onClick={() => router.push('/grape')}>
                        ✦ Novo Projeto
                    </button>
                </div>

                {loadingProjects ? (
                    <div className="dash-empty">Carregando projetos…</div>
                ) : projects.length === 0 ? (
                    <div className="dash-empty">
                        Nenhum projeto salvo ainda.<br />
                        <button className="dash-open-editor-btn" style={{ marginTop: '1rem' }} onClick={() => router.push('/grape')}>
                            Criar primeiro projeto
                        </button>
                    </div>
                ) : (
                    <div className="dash-projects">
                        {projects.map((p) => (
                            <div key={p.id} className="dash-project-card" onClick={() => router.push('/grape')}>
                                <div className="dash-project-name">{p.name}</div>
                                <div className="dash-project-date">
                                    {new Date(p.updatedAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
