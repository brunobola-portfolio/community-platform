
/**
 * Login Modal Component
 *
 * Sign-in for members and administrators. There is no self sign-up: accounts are
 * given by an administrator (Acessos tab) and the server refuses any other
 * sign-up once an administrator exists, so the modal explains how to ask for one.
 */

import React, { useEffect, useState } from 'react';
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from 'react-router-dom';
import { Loader2, LogIn, ShieldCheck, UserCircle } from 'lucide-react';
import { Button, Modal, Input, cn } from './ui/UIComponents';
import { HELP_PARAM } from '../content/help';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'USER' | 'ADMIN';
  onLogin: (role: 'USER' | 'ADMIN') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, mode, onLogin }) => {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // The modal stays mounted for the whole session; wiping on close keeps
  // credentials from lingering on shared computers.
  useEffect(() => {
    if (isOpen) return;
    setEmail('');
    setPassword('');
    setError('');
  }, [isOpen]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signIn("password", { email: email.trim(), password, flow: 'signIn' });
      onLogin(mode);
      onClose();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const lowerError = errorMessage.toLowerCase();

      if (lowerError.includes('invalid') || lowerError.includes('credentials') || lowerError.includes('password')) {
        setError('Email ou password incorretos.');
      } else if (lowerError.includes('not found') || lowerError.includes('no user')) {
        setError('Conta não encontrada. Verifique o email.');
      } else if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connect')) {
        setError('Erro de conexão. Verifique a sua internet.');
      } else {
        setError('Erro na autenticação. Verifique os dados e tente novamente.');
      }
    } finally {
      setPassword('');
      setIsLoading(false);
    }
  };

  const isAdmin = mode === 'ADMIN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAdmin ? 'Acesso Administrativo' : 'Portal do Sócio'}
      eyebrow={isAdmin ? 'Área reservada' : 'Área de sócio'}
      description={isAdmin
        ? 'Introduza as credenciais de gestão para aceder ao backoffice.'
        : 'Aceda aos seus documentos, quotas e cartão digital.'}
      icon={isAdmin ? <ShieldCheck size={20} /> : <UserCircle size={20} />}
      size="sm"
      footer={
        <div className="space-y-3">
          <Button
            type="submit"
            form="login-form"
            className={cn(
              'h-12 w-full text-base font-semibold',
              isAdmin && 'border-amber-500/50 bg-amber-600 hover:bg-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_20px_rgba(245,158,11,0.3)]',
            )}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Entrar</>}
          </Button>
          <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {isAdmin
              ? 'Esqueceu-se da palavra-passe? Outro administrador gera-lhe uma nova em Acessos.'
              : <>Ainda não tem conta ou esqueceu-se da palavra-passe? A direção trata disso.{' '}
                  <Link to={`/ajuda?${HELP_PARAM}=esqueci-palavra-passe`} onClick={onClose} className="rounded font-semibold text-brand-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-400">Saber como</Link>
                </>}
          </p>
        </div>
      }
    >
      <form id="login-form" onSubmit={handleAuth} className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs text-red-600 ring-1 ring-red-500/20 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="login-email" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Email</label>
          <Input
            id="login-email"
            placeholder={isAdmin ? 'admin@exemplo.pt' : 'socio@email.com'}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border-slate-900/5 bg-slate-900/[0.03] focus:border-brand-500/40 dark:border-white/5 dark:bg-white/[0.03]"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Palavra-passe</label>
          <Input
            id="login-password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border-slate-900/5 bg-slate-900/[0.03] focus:border-brand-500/40 dark:border-white/5 dark:bg-white/[0.03]"
          />
        </div>
      </form>
    </Modal>
  );
};
