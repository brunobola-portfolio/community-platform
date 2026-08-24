import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/UIComponents';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100">
                    <div className="max-w-md w-full bg-white dark:bg-dark-surface border border-brand-500/20 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in-up">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Ups! Algo correu mal.</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Encontrámos um erro inesperado. A nossa equipa foi notificada.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-slate-900/5 dark:bg-black/30 rounded-lg text-xs font-mono text-red-600 dark:text-red-300 text-left overflow-auto max-h-32 border border-slate-900/5 dark:border-white/5">
                                    {this.state.error.toString()}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                onClick={this.handleReload}
                                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                            >
                                <RefreshCw size={18} className="mr-2" /> Tentar Novamente
                            </Button>
                            <Button
                                onClick={this.handleGoHome}
                                className="flex-1 bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-900/10 dark:border-white/10"
                            >
                                <Home size={18} className="mr-2" /> Voltar à Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
