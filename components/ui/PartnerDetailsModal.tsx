
import React from 'react';
import { Modal, Button } from './UIComponents';
import type { Sponsor } from '../../types';
import { Globe, Handshake, Building2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface PartnerDetailsModalProps {
  sponsor: Sponsor | null;
  onClose: () => void;
  onBecomePartner: () => void;
}

export const PartnerDetailsModal: React.FC<PartnerDetailsModalProps> = ({ sponsor, onClose, onBecomePartner }) => {
  const { sponsorTiers } = useData();

  if (!sponsor) return null;

  // Tier Styling Logic using Dynamic Data
  const tierConfig = sponsorTiers.find(t => t.id === sponsor.tier.toLowerCase()) || {
      color: 'from-brand-400 to-blue-600',
      textColor: 'text-brand-400',
      name: sponsor.tier
  };

  return (
    <Modal isOpen={!!sponsor} onClose={onClose} title="Detalhes do Parceiro" size="md">
      <div className="flex flex-col items-center text-center space-y-6 pb-2">

        {/* Logo Container with Tier Glow */}
        <div className="relative group">
            <div className={`absolute inset-0 blur-[40px] opacity-20 bg-gradient-to-br ${tierConfig.color}`}></div>
            <div className="relative w-40 h-40 bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-2xl flex items-center justify-center p-6 shadow-2xl overflow-hidden">
                {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={sponsor.name} className="w-full h-full object-contain drop-shadow-md" />
                ) : (
                    <Building2 size={48} className="text-slate-400 dark:text-slate-600" />
                )}
            </div>
            {/* Floating Badge */}
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-lg bg-slate-900 dark:bg-black text-white`}>
                {tierConfig.name}
            </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mt-4">
            <h2 className="text-2xl font-serif text-slate-900 dark:text-white font-bold">{sponsor.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                Agradecemos o apoio fundamental para o desenvolvimento da nossa comunidade.
            </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col w-full gap-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
            {sponsor.website && (
                <Button
                    className="w-full bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white gap-2"
                    onClick={() => window.open(sponsor.website, '_blank')}
                >
                    <Globe size={16} /> Visitar Website Oficial
                </Button>
            )}

            <div className="mt-4 bg-brand-500/5 dark:bg-brand-900/10 rounded-xl p-4 border border-brand-500/10">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">A sua empresa também pode fazer a diferença.</p>
                <Button variant="ghost" size="sm" className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 w-full" onClick={() => { onClose(); onBecomePartner(); }}>
                    <Handshake size={14} className="mr-2"/> Juntar-se à Rede de Parceiros
                </Button>
            </div>
        </div>

      </div>
    </Modal>
  );
};
