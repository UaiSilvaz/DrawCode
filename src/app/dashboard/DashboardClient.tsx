'use client';

import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bell,
  Briefcase,
  ChevronRight,
  Download,
  FolderOpen,
  Globe,
  HelpCircle,
  Home,
  LayoutTemplate,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
} from 'lucide-react';
import BubbleBackground from '@/components/BubbleBackground';

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

interface WebTemplate {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  source: string;
}

const INTERNET_TEMPLATES: WebTemplate[] = [
  {
    id: 'saas-dark',
    name: 'Landing SaaS Moderna',
    category: 'SaaS',
    imageUrl:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
  {
    id: 'ecommerce-minimal',
    name: 'E-commerce Minimalista',
    category: 'Loja Virtual',
    imageUrl:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
  {
    id: 'agency-bold',
    name: 'Site de Agencia Criativa',
    category: 'Agencia',
    imageUrl:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
  {
    id: 'portfolio-clean',
    name: 'Portfolio Profissional',
    category: 'Portfolio',
    imageUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
  {
    id: 'restaurant-premium',
    name: 'Restaurante Premium',
    category: 'Negocio Local',
    imageUrl:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
  {
    id: 'course-platform',
    name: 'Plataforma de Curso',
    category: 'Educacao',
    imageUrl:
      'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80',
    source: 'Unsplash',
  },
];

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'designs' | 'templates'>('designs');
  const [searchTerm, setSearchTerm] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/grape/save')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const initials = (user.name ?? user.email ?? '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(normalizedSearch),
  );
  const sortedFilteredProjects = [...filteredProjects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const filteredTemplates = INTERNET_TEMPLATES.filter((template) =>
    `${template.name} ${template.category}`.toLowerCase().includes(normalizedSearch),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0E131F] font-sans text-white">
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      <aside className="z-20 flex w-[88px] flex-shrink-0 flex-col items-center border-r border-[#ffffff10] bg-[#18191b] py-5">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-xl p-1 transition-colors hover:bg-white/5"
          aria-label="Dashboard DrawCode"
        >
          <Image src="/IconD.png" alt="DrawCode D" width={66} height={66} className="h-24 w-24 object-contain" />
        </button>

        <nav className="mt-4 flex w-full flex-col gap-1 px-2">
          <NavItem icon={<Home size={24} />} label="Inicio" active onClick={() => router.push('/dashboard')} />
          <NavItem icon={<FolderOpen size={24} />} label="Projetos" />
          <NavItem icon={<LayoutTemplate size={24} />} label="Modelos" />
        </nav>

        <div className="relative mt-auto flex w-full flex-col items-center gap-5" ref={profileRef}>
          <button
            type="button"
            className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Bell size={24} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-[#18191b] bg-red-500" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-transparent bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold transition-all hover:border-white/20"
          >
            {user.image ? <img src={user.image} alt="Avatar" className="h-full w-full object-cover" /> : initials}
          </button>

          {isProfileOpen && (
            <div className="absolute bottom-16 left-20 z-50 flex w-80 flex-col rounded-2xl border border-[#ffffff15] bg-[#1e1f22] py-2 text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2">
              <div className="border-b border-[#ffffff10] px-4 py-3">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Contas</p>
                <div className="mx-[-8px] flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-lg text-white">
                    {user.image ? <img src={user.image} alt="Avatar" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-base font-semibold text-white">{user.name || 'Usuario'}</p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-500" />
                </div>
              </div>

              <div className="border-b border-[#ffffff10] py-2">
                <MenuOption icon={<Settings size={20} />} label="Configuracoes" />
                <MenuOption icon={<Moon size={20} />} label="Tema" />
                <MenuOption icon={<HelpCircle size={20} />} label="Ajuda e recursos" />
                <MenuOption icon={<Briefcase size={20} />} label="Ferramentas avancadas" badge="Beta" />
                <MenuOption icon={<Award size={20} />} label="Planos e precos" />
              </div>

              <div className="border-b border-[#ffffff10] py-2">
                <MenuOption icon={<Download size={20} />} label="Baixe o app do DrawCode" />
              </div>

              <div className="py-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={20} className="text-gray-400" />
                  <span>Fazer logout de todas as contas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="relative flex-1 overflow-y-auto bg-[#131417]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[620px] md:h-[720px]">
          <BubbleBackground
            interactive
            fixed={false}
            className="absolute inset-x-0 top-0 h-full opacity-80 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.82)_38%,rgba(0,0,0,0.52)_68%,transparent_100%)]"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900/22 via-fuchsia-900/10 to-[#131417]" />

        <div className="relative z-10 mx-auto flex min-h-full max-w-[1700px] flex-col px-8 pb-16 pt-0 md:px-12 md:pt-0">
          <div className="mb-10 mt-60 text-center">
            <div className="mx-auto mb-2 w-full max-w-2xl px-4 sm:px-0">
              <div className="relative mx-auto h-[108px] w-full max-w-[560px] md:h-[122px]">
                <Image
                  src="/draw.png"
                  alt="DrawCode Logo"
                  fill
                  priority
                  sizes="(max-width: 768px) 90vw, 560px"
                  className="pointer-events-none select-none object-cover object-[center_46%]"
                />
              </div>
            </div>

            <div className="mb-3 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('designs')}
                className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'designs'
                    ? 'border-[#ffffff30] bg-white/10 text-white'
                    : 'border-[#ffffff20] bg-white/5 text-gray-200 hover:bg-white/10'
                }`}
              >
                <FolderOpen size={16} /> Recentes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'border-purple-500/60 bg-purple-500/20 text-white'
                    : 'border-purple-500/40 bg-purple-500/10 text-gray-200 hover:bg-purple-500/20'
                }`}
              >
                <LayoutTemplate size={16} /> Modelos
              </button>
            </div>

            <div className="group relative mx-auto mb-5 max-w-3xl">
              <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-gray-400 transition-colors group-focus-within:text-purple-400">
                <Search size={22} className="text-cyan-400/80" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={activeTab === 'designs' ? 'Busque seus designs' : 'Busque modelos de sites editaveis'}
                className="w-full rounded-2xl border border-[#ffffff15] bg-[#1e1f24]/90 py-4 pl-14 pr-14 text-white shadow-2xl backdrop-blur-md transition-all placeholder:text-gray-400 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <div className="absolute inset-y-0 right-5 flex cursor-pointer items-center text-gray-400 transition-colors hover:text-white">
                <Settings size={20} />
              </div>
            </div>

            <div className="mb-12 flex justify-center">
              <button
                type="button"
                onClick={() => router.push('/grape')}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(124,58,237,0.3)] transition-all duration-300 hover:-translate-y-1 hover:from-purple-500 hover:to-blue-500 hover:shadow-[0_0_60px_rgba(124,58,237,0.5)]"
              >
                <div className="absolute inset-0 z-0 w-0 bg-white/20 transition-all duration-500 ease-out group-hover:w-full" />
                <Plus size={24} className="relative z-10" />
                <span className="relative z-10">Criar Novo Projeto</span>
              </button>
            </div>
          </div>

          <section className="mb-12 mt-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {activeTab === 'designs' ? 'Seus designs' : 'Modelos de sites editaveis'}
              </h2>
              <span className="text-sm font-medium text-purple-300">
                {activeTab === 'designs'
                  ? `${sortedFilteredProjects.length} projeto(s)`
                  : `${filteredTemplates.length} modelo(s)`}
              </span>
            </div>

            {activeTab === 'designs' ? (
              loadingProjects ? (
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-44 min-w-[280px] animate-pulse rounded-xl bg-[#1e1f24]" />
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#ffffff15] bg-[#1e1f24]/50 py-12 text-center">
                  <LayoutTemplate className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                  <p className="text-gray-400">Nenhum design encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {sortedFilteredProjects.map((project) => (
                    <div key={project.id} className="group cursor-pointer">
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <span className="text-4xl font-bold text-gray-300">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => router.push('/grape')}
                            className="translate-y-4 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white shadow-xl transition-all duration-300 hover:bg-purple-500 group-hover:translate-y-0"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                      <h3 className="truncate pr-2 font-semibold text-gray-100 transition-colors group-hover:text-purple-400">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-[13px] text-gray-400">
                        Editado em {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : filteredTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#ffffff15] bg-[#1e1f24]/50 py-12 text-center">
                <Globe className="mx-auto mb-3 h-12 w-12 text-gray-600" />
                <p className="text-gray-400">Nenhum modelo encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="group cursor-pointer">
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-[#1e1f24] shadow-md">
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] text-white">
                        {template.source}
                      </div>
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => router.push(`/grape?template=${template.id}`)}
                          className="translate-y-4 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white shadow-xl transition-all duration-300 hover:bg-purple-500 group-hover:translate-y-0"
                        >
                          Usar modelo
                        </button>
                      </div>
                    </div>
                    <h3 className="truncate pr-2 font-semibold text-gray-100 transition-colors group-hover:text-purple-400">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-[13px] text-gray-400">{template.category}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all ${
        active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

function MenuOption({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-200">
          {badge}
        </span>
      )}
    </button>
  );
}
