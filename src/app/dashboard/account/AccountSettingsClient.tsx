'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';

type AccountUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  projectCount: number;
};

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;
const NAME_PATTERN = /^[A-Za-z0-9_. -]+$/;

const normalizeName = (value: string) => value.replace(/\s+/g, ' ').trim();

function getInitials(name: string | null, email: string | null) {
  return (name || email || '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AccountSettingsClient({ user }: { user: AccountUser }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name || '');
  const [image, setImage] = useState<string | null>(user.image);
  const [savedName, setSavedName] = useState(user.name || '');
  const [savedImage, setSavedImage] = useState<string | null>(user.image);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const normalizedName = useMemo(() => normalizeName(name), [name]);
  const initials = getInitials(savedName || name, user.email);
  const hasChanges = normalizedName !== normalizeName(savedName) || image !== savedImage;
  const nameIsValid = normalizedName.length >= 3 && normalizedName.length <= 32 && NAME_PATTERN.test(normalizedName);
  const canSave = hasChanges && nameIsValid && availability !== 'taken' && availability !== 'checking' && !saving;

  useEffect(() => {
    if (!normalizedName || normalizedName === normalizeName(savedName)) {
      setAvailability('idle');
      setAvailabilityMessage('');
      return;
    }

    if (normalizedName.length < 3) {
      setAvailability('invalid');
      setAvailabilityMessage('Use pelo menos 3 caracteres.');
      return;
    }

    if (!NAME_PATTERN.test(normalizedName)) {
      setAvailability('invalid');
      setAvailabilityMessage('Use letras, numeros, espacos, ponto, hifen ou underline.');
      return;
    }

    const controller = new AbortController();
    setAvailability('checking');
    setAvailabilityMessage('Verificando disponibilidade...');

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/check-name?name=${encodeURIComponent(normalizedName)}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Nao foi possivel verificar o nome.');
        }

        if (data.available) {
          setAvailability('available');
          setAvailabilityMessage('Nome disponivel.');
          return;
        }

        setAvailability('taken');
        setAvailabilityMessage(data.reason || 'Esse nome de usuario ja esta em uso.');
      } catch (error) {
        if (controller.signal.aborted) return;
        setAvailability('invalid');
        setAvailabilityMessage(error instanceof Error ? error.message : 'Falha ao verificar o nome.');
      }
    }, 380);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedName, savedName]);

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', text: 'Selecione um arquivo de imagem.' });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setNotice({ type: 'error', text: 'Use uma imagem com ate 1.5 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setNotice(null);
      }
    };
    reader.onerror = () => setNotice({ type: 'error', text: 'Nao consegui ler essa imagem.' });
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          image,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Nao foi possivel atualizar sua conta.');
      }

      setSavedName(data.user.name || normalizedName);
      setSavedImage(data.user.image || null);
      setName(data.user.name || normalizedName);
      setImage(data.user.image || null);
      setAvailability('idle');
      setAvailabilityMessage('');
      setNotice({ type: 'success', text: data.message || 'Conta atualizada com sucesso.' });
      router.refresh();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Nao foi possivel atualizar sua conta.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#090414] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,0.34),transparent_32rem),radial-gradient(circle_at_86%_18%,rgba(37,99,235,0.22),transparent_34rem),linear-gradient(180deg,#0c0619_0%,#121015_62%,#09090b_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:54px_54px]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-300/40 hover:bg-white/[0.08]"
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100">
            <ShieldCheck size={16} />
            Conta protegida
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.35fr]">
          <aside className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#15121f]/82 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-violet-600/34 via-fuchsia-500/16 to-blue-500/24" />
            <div className="relative">
              <div className="mb-8 flex items-center gap-3">
                <Image src="/IconD.png" alt="DrawCode" width={46} height={46} className="h-12 w-12 object-contain" />
                <div>
                  <p className="text-sm font-semibold text-violet-200">DrawCode</p>
                  <h1 className="text-2xl font-black tracking-tight">Sua conta</h1>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/22 p-5">
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-violet-300/30 bg-gradient-to-br from-violet-600 to-blue-600 text-3xl font-black shadow-[0_18px_44px_rgba(124,58,237,0.32)]">
                    {image ? (
                      <img src={image} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-xl border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-violet-600"
                      aria-label="Alterar foto"
                    >
                      <Camera size={15} />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black">{savedName || 'Usuario DrawCode'}</p>
                    <p className="mt-1 truncate text-sm text-slate-300">{user.email}</p>
                    <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-200">
                      {user.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric label="Projetos" value={String(user.projectCount)} />
                  <MiniMetric label="Desde" value={new Date(user.createdAt).toLocaleDateString('pt-BR')} />
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-violet-300/16 bg-violet-300/[0.06] p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-200">
                  <Sparkles size={18} />
                </div>
                <h2 className="text-lg font-black">Identidade do workspace</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  O nome e a foto aparecem no painel do DrawCode e ajudam a identificar seus projetos enquanto voce cria.
                </p>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-[#17141f]/88 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl md:p-7">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">Personalizacao</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Perfil da conta</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Atualize seu nome de usuario e avatar. O nome precisa estar livre para evitar confusao entre contas.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSave}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 text-sm font-black text-white shadow-[0_18px_44px_rgba(124,58,237,0.28)] transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar alteracoes
              </button>
            </div>

            {notice && (
              <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.type === 'success'
                ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
                : 'border-rose-400/25 bg-rose-400/10 text-rose-100'
                }`}>
                {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{notice.text}</span>
              </div>
            )}

            <div className="grid gap-5">
              <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/14 text-blue-200">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="font-black">Email da conta</h3>
                    <p className="text-sm text-slate-400">Usado para login e recuperacao de acesso.</p>
                  </div>
                </div>
                <input
                  value={user.email || ''}
                  disabled
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-slate-300 outline-none"
                />
              </section>

              <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-500/16 text-violet-200">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <h3 className="font-black">Nome de usuario</h3>
                    <p className="text-sm text-slate-400">Escolha um nome unico no DrawCode.</p>
                  </div>
                </div>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-200">Novo nome</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Seu nome de usuario"
                    className="h-[52px] w-full rounded-2xl border border-white/10 bg-[#0d0b14] px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                    maxLength={32}
                  />
                </label>

                <div className="mt-3 flex min-h-6 items-center gap-2 text-sm">
                  {availability === 'checking' && <Loader2 size={16} className="animate-spin text-violet-300" />}
                  {availability === 'available' && <CheckCircle2 size={16} className="text-emerald-300" />}
                  {(availability === 'taken' || availability === 'invalid') && <AlertCircle size={16} className="text-rose-300" />}
                  <span className={
                    availability === 'available'
                      ? 'text-emerald-200'
                      : availability === 'taken' || availability === 'invalid'
                        ? 'text-rose-200'
                        : 'text-slate-400'
                  }>
                    {availabilityMessage || 'Letras, numeros, espacos, ponto, hifen e underline.'}
                  </span>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-fuchsia-500/14 text-fuchsia-200">
                    <ImagePlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-black">Foto de perfil</h3>
                    <p className="text-sm text-slate-400">PNG, JPG, WEBP ou GIF ate 1.5 MB.</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageFile}
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-violet-300/25 bg-violet-400/10 px-4 text-sm font-bold text-violet-100 transition hover:bg-violet-400/16"
                  >
                    <Camera size={17} />
                    Enviar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    disabled={!image}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-300/18 bg-rose-400/8 px-4 text-sm font-bold text-rose-100 transition hover:bg-rose-400/14 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 size={17} />
                    Remover
                  </button>
                </div>
              </section>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
