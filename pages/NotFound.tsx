import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export function NotFoundPage() {
    const navigate = useNavigate();
    const { settings } = useData();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
            <title>{`Página não encontrada — ${settings.siteName}`}</title>
            <p className="text-7xl font-bold text-brand-500 mb-4">404</p>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Página não encontrada
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                A página que procura não existe ou foi movida. Verifique o endereço ou volte à página inicial.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                    Voltar ao Início
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-medium transition-colors border border-slate-900/10 dark:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                    Página Anterior
                </button>
            </div>
        </div>
    );
}
