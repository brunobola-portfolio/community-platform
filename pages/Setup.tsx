/**
 * First-Run Setup Wizard
 *
 * Self-service admin bootstrap shown only when the database has zero admin
 * users. Routing gate in `router.tsx` redirects every visitor here until
 * setup is complete; once complete, the gate redirects this page back home.
 *
 * Flow:
 *   1. signUp via Convex Auth Password provider
 *   2. bootstrapInitialAdmin() promotes the just-created user to admin
 *   3. Redirect to /admin
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { api } from '../convex/_generated/api';
import {
    ShieldCheck,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Eye,
    EyeOff,
    Sparkles,
    Lock,
    Mail,
    ArrowRight,
} from 'lucide-react';
import { Button, Input, cn } from '../components/ui/UIComponents';

type PasswordScore = 0 | 1 | 2 | 3 | 4;

function scorePassword(pw: string): PasswordScore {
    let score = 0;
    if (pw.length >= 12) score++;
    if (pw.length >= 16) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4) as PasswordScore;
}

const STRENGTH_META: Record<PasswordScore, { label: string; tone: string; bar: string }> = {
    0: { label: 'Muito fraca', tone: 'text-red-400', bar: 'bg-red-500/70' },
    1: { label: 'Fraca', tone: 'text-orange-400', bar: 'bg-orange-500/70' },
    2: { label: 'Razoável', tone: 'text-amber-400', bar: 'bg-amber-500/70' },
    3: { label: 'Forte', tone: 'text-lime-400', bar: 'bg-lime-500/70' },
    4: { label: 'Excelente', tone: 'text-brand-400', bar: 'bg-brand-500/80' },
};

export const SetupPage: React.FC = () => {
    const navigate = useNavigate();
    const { signIn } = useAuthActions();
    const { isAuthenticated } = useConvexAuth();
    const bootstrap = useMutation(api.setup.bootstrapInitialAdmin);
    const setupComplete = useQuery(api.setup.isSetupComplete);

    // signIn() resolves when tokens are stored locally, but the WebSocket
    // auth handshake with the server completes asynchronously. Calling an
    // authenticated mutation before that finishes runs it without identity.
    const isAuthenticatedRef = useRef(isAuthenticated);
    useEffect(() => {
        isAuthenticatedRef.current = isAuthenticated;
    }, [isAuthenticated]);

    const waitForAuthPropagation = async (timeoutMs = 15000) => {
        const start = Date.now();
        while (!isAuthenticatedRef.current) {
            if (Date.now() - start > timeoutMs) {
                throw new Error('A sessão não ficou ativa a tempo. Recarrega a página e tenta novamente.');
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<'form' | 'creating' | 'promoting' | 'done'>('form');

    const score = useMemo(() => scorePassword(password), [password]);
    const meta = STRENGTH_META[score];

    // If another browser/tab completes setup while this page is open, redirect away.
    useEffect(() => {
        if (setupComplete && phase === 'form') navigate('/');
    }, [setupComplete, phase, navigate]);

    const validate = () => {
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Introduz um email válido.';
        if (password.length < 12) return 'A password tem de ter pelo menos 12 caracteres.';
        if (score < 2) return 'Reforça a password com letras maiúsculas/minúsculas, números e símbolos.';
        if (password !== confirm) return 'As passwords não coincidem.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setError(null);
        setSubmitting(true);

        try {
            setPhase('creating');
            await signIn('password', { email: email.trim(), password, flow: 'signUp' });

            setPhase('promoting');
            await waitForAuthPropagation();
            await bootstrap({});

            setPhase('done');
            // Small pause so the user perceives the success state before navigating
            setTimeout(() => navigate('/admin'), 1400);
        } catch (err) {
            setSubmitting(false);
            setPhase('form');
            const msg =
                err instanceof ConvexError
                    ? String(err.data)
                    : err instanceof Error
                      ? err.message
                      : String(err);
            const lower = msg.toLowerCase();
            if (lower.includes('already exists') || lower.includes('duplicate')) {
                setError('Já existe uma conta com este email. Faz login em vez de criar.');
            } else if (lower.includes('administrador configurado')) {
                setError('Setup já foi concluído por outra pessoa. A redirecionar para a homepage.');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError(msg || 'Erro inesperado ao criar a conta de administrador.');
            }
        }
    };

    return (
        <div className="dark relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <BackgroundDecor />

            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md">
                    {/* Brand mark */}
                    <div className="mb-8 flex flex-col items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-3 rounded-full bg-brand-500/20 blur-2xl" />
                            <div className="relative grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/30 to-brand-700/30 backdrop-blur-xl">
                                <Sparkles className="h-7 w-7 text-brand-300" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-300/80">Community Platform</p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Configuração inicial</h1>
                            <p className="mt-2 text-sm text-slate-400">
                                Cria a primeira conta de administrador para começares a gerir o portal.
                            </p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
                        <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />

                        {phase === 'done' ? (
                            <SuccessState email={email} />
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Field
                                    icon={<Mail className="h-4 w-4" />}
                                    label="Email do administrador"
                                    hint="Será usado para login e notificações."
                                >
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={submitting}
                                        placeholder="admin@exemplo.pt"
                                        className="bg-white/[0.04] border-white/5 focus-visible:border-brand-400/40"
                                    />
                                </Field>

                                <Field
                                    icon={<Lock className="h-4 w-4" />}
                                    label="Password"
                                    hint="Mínimo 12 caracteres com mistura de maiúsculas, números e símbolos."
                                >
                                    <div className="relative">
                                        <Input
                                            type={showPw ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={submitting}
                                            placeholder="••••••••••••"
                                            className="bg-white/[0.04] border-white/5 pr-12 focus-visible:border-brand-400/40"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                            aria-label={showPw ? 'Ocultar password' : 'Mostrar password'}
                                            tabIndex={-1}
                                        >
                                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {password.length > 0 && (
                                        <div className="mt-2.5 flex items-center gap-2">
                                            <div className="flex flex-1 gap-1">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            'h-1 flex-1 rounded-full transition-all duration-300',
                                                            i < score ? meta.bar : 'bg-white/5',
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <span className={cn('text-[10px] font-bold uppercase tracking-widest', meta.tone)}>
                                                {meta.label}
                                            </span>
                                        </div>
                                    )}
                                </Field>

                                <Field
                                    icon={<ShieldCheck className="h-4 w-4" />}
                                    label="Confirmar password"
                                >
                                    <Input
                                        type={showPw ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        disabled={submitting}
                                        placeholder="Repete a password"
                                        className="bg-white/[0.04] border-white/5 focus-visible:border-brand-400/40"
                                    />
                                    {confirm.length > 0 && confirm !== password && (
                                        <p className="mt-2 text-[11px] text-red-400">As passwords não coincidem.</p>
                                    )}
                                </Field>

                                {error && (
                                    <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="h-14 w-full text-sm font-semibold tracking-wide shadow-[0_8px_30px_rgba(223,61,50,0.35)]"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2.5 h-4 w-4 animate-spin" />
                                            {phase === 'creating' ? 'A criar conta…' : 'A activar permissões…'}
                                        </>
                                    ) : (
                                        <>
                                            Criar administrador
                                            <ArrowRight className="ml-2.5 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-3.5 text-[11px] leading-relaxed text-amber-200/80">
                                    <p className="font-semibold text-amber-300">Importante</p>
                                    <p className="mt-1">
                                        Este wizard só aparece uma vez. Guarda a password num gestor de passwords —
                                        recovery requer acesso ao Convex Dashboard.
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>

                    <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-slate-600">
                        Community Platform · Setup seguro
                    </p>
                </div>
            </div>
        </div>
    );
};

// ── Internal sub-components ─────────────────────────────────────────────────

const Field: React.FC<{
    icon: React.ReactNode;
    label: string;
    hint?: string;
    children: React.ReactNode;
}> = ({ icon, label, hint, children }) => (
    <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <span className="text-brand-400/80">{icon}</span>
            {label}
        </label>
        {children}
        {hint && <p className="pl-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
);

const SuccessState: React.FC<{ email: string }> = ({ email }) => (
    <div className="space-y-5 py-2 text-center">
        <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-xl" />
            <div className="relative grid h-full w-full place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
        </div>
        <div>
            <h2 className="text-lg font-semibold text-white">Administrador criado</h2>
            <p className="mt-1.5 text-xs text-slate-400">
                A conta <span className="font-mono text-brand-300">{email}</span> tem agora permissões totais.
            </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            A redirecionar para o painel…
        </div>
    </div>
);

const BackgroundDecor: React.FC = () => (
    <>
        {/* Layered radial mesh: brand cyan, indigo, accent cyan */}
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(60%_50%_at_30%_20%,rgba(223,61,50,0.18)_0%,rgba(223,61,50,0)_60%),radial-gradient(50%_40%_at_80%_80%,rgba(99,102,241,0.16)_0%,rgba(99,102,241,0)_60%),radial-gradient(40%_35%_at_70%_10%,rgba(239,122,112,0.10)_0%,rgba(239,122,112,0)_60%)]" />
        {/* Subtle 48px grid masked toward edges */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,6,23,0.7)_100%)]" />
    </>
);

export default SetupPage;
