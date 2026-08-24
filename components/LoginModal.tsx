
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
      title={flow === 'signUp' ? "Criar Conta" : (isAdmin ? "Acesso Administrativo" : "Portal do Sócio")}
      size="sm"
    >
      <form onSubmit={handleAuth} className="space-y-6 pt-4">
        <div className="text-center mb-6">
          <div className={cn(
            "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border transition-all duration-500",
            isAdmin
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
              : "bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 shadow-[0_0_30px_rgba(223,61,50,0.1)]"
          )}>
            {isAdmin ? <ShieldCheck size={40} /> : <UserCircle size={40} />}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
            {flow === 'signUp'
              ? "Crie uma nova conta para aceder aos serviços."
              : (isAdmin
                ? "Introduza as credenciais de gestão para aceder ao backoffice."
                : "Bem-vindo de volta! Aceda aos seus documentos e cartão digital.")}
          </p>
        </div>

        {error && <div className="text-red-600 dark:text-red-400 text-xs text-center">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Email</label>
            <Input
              placeholder={isAdmin ? "admin@exemplo.pt" : "socio@email.com"}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-slate-900/[0.03] dark:bg-white/[0.03] border-slate-900/5 dark:border-white/5 focus:border-brand-500/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Palavra-passe</label>
            <Input
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-900/[0.03] dark:bg-white/[0.03] border-slate-900/5 dark:border-white/5 focus:border-brand-500/40"
            />
          </div>
        </div>

        <Button
          type="submit"
          className={cn(
            "w-full h-16 text-lg font-bold shadow-2xl transition-all duration-300",
            isAdmin
              ? "bg-amber-600 hover:bg-amber-500 border-amber-500 shadow-amber-900/20"
              : "bg-brand-600 hover:bg-brand-500 border-brand-500 shadow-brand-900/20"
          )}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} className="mr-3" /> {flow === 'signUp' ? 'Registar' : 'Entrar no Sistema'}</>}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
            className="text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors uppercase tracking-widest font-bold"
          >
            {flow === 'signIn' ? "Não tem conta? Registar" : "Já tem conta? Entrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
