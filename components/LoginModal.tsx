
/**
 * Login Modal Component
 *
 * Provides authentication UI for both regular members and admin users.
 * Extracted from App.tsx to support the router-based layout architecture.
 */

import React, { useState } from 'react';
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, LogIn, ShieldCheck, UserCircle } from 'lucide-react';
import { Button, Modal, Input, cn } from './ui/UIComponents';

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
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await signIn("password", { email, password, flow });
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
      } else if (lowerError.includes('already exists') || lowerError.includes('duplicate')) {
        setError('Já existe uma conta com este email.');
      } else if (lowerError.includes('network') || lowerError.includes('fetch') || lowerError.includes('connect')) {
        setError('Erro de conexão. Verifique a sua internet.');
      } else {
        setError('Erro na autenticação. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = mode === 'ADMIN';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={flow === 'signUp' ? 'Criar Conta' : (isAdmin ? 'Acesso Administrativo' : 'Portal do Sócio')}
      eyebrow={isAdmin ? 'Área reservada' : 'Área de sócio'}
      description={
        flow === 'signUp'
          ? 'Crie uma conta para aceder aos serviços da associação.'
          : (isAdmin
            ? 'Introduza as credenciais de gestão para aceder ao backoffice.'
            : 'Aceda aos seus documentos, quotas e cartão digital.')
      }
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
            {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> {flow === 'signUp' ? 'Registar' : 'Entrar'}</>}
          </Button>
          <button
            type="button"
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
            className="w-full rounded-lg py-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:text-brand-400"
          >
            {flow === 'signIn' ? 'Não tem conta? Registar' : 'Já tem conta? Entrar'}
          </button>
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
          <label htmlFor="login-email" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</label>
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
          <label htmlFor="login-password" className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Palavra-passe</label>
          <Input
            id="login-password"
            placeholder="••••••••"
            type="password"
            autoComplete={flow === 'signUp' ? 'new-password' : 'current-password'}
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
