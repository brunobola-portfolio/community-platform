import React from 'react';
import { Modal, Button } from './UIComponents';
import type { Sponsor } from '../../types';
import { Globe, Handshake, Building2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { sponsorTierLabel } from '../../utils/sponsorTiers';

interface PartnerDetailsModalProps {
  sponsor: Sponsor | null;
  onClose: () => void;
  onBecomePartner: () => void;
}

export const PartnerDetailsModal: React.FC<PartnerDetailsModalProps> = ({ sponsor, onClose, onBecomePartner }) => {
  const { sponsorTiers } = useData();

  if (!sponsor) return null;

  const tierName = sponsorTierLabel(sponsorTiers, sponsor.tier);

  return (
    <Modal
      isOpen={!!sponsor}
      onClose={onClose}
      title={sponsor.name}
      eyebrow={`Parceiro ${tierName}`}
      description="Agradecemos o apoio fundamental ao desenvolvimento da nossa comunidade."
      icon={<Handshake size={20} />}
      size="md"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => { onClose(); onBecomePartner(); }}>
            <Handshake size={16} /> Juntar-se à rede
          </Button>
          {sponsor.website && (
            <Button onClick={() => window.open(sponsor.website, '_blank', 'noopener,noreferrer')}>
              <Globe size={16} /> Visitar website
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-36 w-full max-w-[220px] items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-slate-900/10 dark:bg-white/[0.04] dark:ring-white/10">
          {sponsor.logoUrl ? (
            <img src={sponsor.logoUrl} alt={sponsor.name} className="max-h-full w-full object-contain" />
          ) : (
            <Building2 size={44} className="text-slate-300 dark:text-slate-600" />
          )}
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          O apoio de {sponsor.name} ajuda a manter as atividades culturais, desportivas e sociais abertas a toda a
          comunidade. A sua empresa também pode fazer a diferença.
        </p>
      </div>
    </Modal>
  );
};
