
/**
 * Member Area Page
 *
 * A private dashboard for association members.
 * Features:
 * - 3D Flippable Membership Card with QR Code.
 * - Payment status overview.
 * - Access to private documents (e.g., meeting minutes, tax declarations).
 * - System notifications.
 */

import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Button, Badge, Modal } from '../components/ui/UIComponents';
import {
  User,
  CreditCard,
  Bell,
  FileText,
  LogOut,
  ShieldCheck,
  Download,
  History,
  QrCode,
  Smartphone,
  Landmark,
  Copy,
  Check,
  Mail,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../utils/cn';
import type { Document, Notification, Settings } from '../types';

// --- Sub-Components (defined at module level to avoid re-creation on every render) ---

type QuotaStatus = 'em-dia' | 'atrasada' | 'desconhecido';

interface QuotaInfo {
  status: QuotaStatus;
  badgeLabel: string;
  badgeClassName: string;
  cardText: string;
  nextPayment: string;
}

/**
 * Derives the quota display state from the member profile. Never fabricates
 * an "em dia" status — with no profile or no quotaPaidUntil, the member is
 * pointed at the direção instead of shown a false positive.
 */
const getQuotaInfo = (quotaPaidUntil: string | null | undefined): QuotaInfo => {
  const currentYear = new Date().getFullYear();
  const paidUntilYear = quotaPaidUntil ? parseInt(quotaPaidUntil, 10) : NaN;

  if (quotaPaidUntil && paidUntilYear >= currentYear) {
    return {
      status: 'em-dia',
      badgeLabel: 'Em dia',
      badgeClassName: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      cardText: `Regularizada até ${quotaPaidUntil}`,
      nextPayment: `Janeiro ${paidUntilYear + 1}`,
    };
  }

  if (quotaPaidUntil) {
    return {
      status: 'atrasada',
      badgeLabel: 'Por regularizar',
      badgeClassName: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      cardText: `Última quota: ${quotaPaidUntil}`,
      nextPayment: 'Assim que possível',
    };
  }

  return {
    status: 'desconhecido',
    badgeLabel: 'Sem registo',
    badgeClassName: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    cardText: 'Contacta a direção para regularizar o teu registo de sócio.',
    nextPayment: '—',
  };
};

interface MemberData {
  name: string;
  number: string;
  since: string;
}

interface DashboardTabProps {
  memberData: MemberData;
  quotaInfo: QuotaInfo | null;
  isFlipped: boolean;
  onFlip: () => void;
  onOpenPaymentModal: () => void;
  notificationsCount: number;
  documentsCount: number;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ memberData, quotaInfo, isFlipped, onFlip, onOpenPaymentModal, notificationsCount, documentsCount }) => (
  <div className="space-y-8 animate-fade-in-up">
      {/* Top Section: Card & Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Digital Card: 3D Flip Interaction */}
          <div className="w-full flex justify-center">
              <div
                  className="relative w-full max-w-[480px] aspect-[1.586/1] cursor-pointer group perspective-1000"
                  tabIndex={0}
                  role="button"
                  aria-label="Virar cartão de sócio"
                  onClick={onFlip}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }}
              >
                  <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                      {/* Front Face */}
                      <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-slate-900 via-brand-950 to-black border border-white/20 rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                          <div className="relative z-10 flex justify-between items-start">
                              <div>
                                  <div className="text-brand-400 font-serif font-bold text-xl sm:text-2xl tracking-wide">ARCVA</div>
                                  <div className="text-[8px] sm:text-[10px] text-slate-400 tracking-[0.4em] uppercase mt-1">Cartão de Sócio</div>
                              </div>
                              <ShieldCheck className="text-brand-500 drop-shadow-[0_0_10px_rgba(223,61,50,0.5)] w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                          <div className="relative z-10 mt-auto">
                              <div className="text-xl sm:text-2xl text-white font-mono tracking-wider font-medium mb-3 sm:mb-4 truncate text-shadow">{memberData.name}</div>
                              <div className="flex flex-wrap gap-4 sm:gap-8 text-sm items-end">
                                  <div><div className="text-slate-500 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5">Sócio Nº</div><div className="text-white font-mono text-base sm:text-lg leading-none">{memberData.number}</div></div>
                                  <div><div className="text-slate-500 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5">Desde</div><div className="text-white font-mono text-base sm:text-lg leading-none">{memberData.since}</div></div>
                                  <div className="ml-auto"><Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Ativo</Badge></div>
                              </div>
                          </div>
                      </div>
                      {/* Back Face (QR Code) */}
                      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900 border border-brand-500/30 rounded-2xl p-6 flex flex-col justify-center items-center shadow-xl">
                          <div className="bg-white p-3 rounded-xl mb-4 shadow-lg w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                              <QrCode size={100} className="text-black"/>
                          </div>
                          <div className="text-brand-300 text-sm font-mono animate-pulse flex items-center gap-2"><QrCode size={16}/> Aproxime do leitor</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {quotaInfo ? (
                  <div
                      className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      role="button"
                      tabIndex={0}
                      aria-label="Ver como pagar a quota"
                      onClick={onOpenPaymentModal}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenPaymentModal(); } }}
                  >
                      <div className="flex items-center justify-between mb-4">
                          <CreditCard className="text-brand-500" size={24} />
                          <Badge className={quotaInfo.badgeClassName}>{quotaInfo.badgeLabel}</Badge>
                      </div>
                      <div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Quotas</div>
                          <div className="text-slate-900 dark:text-white font-medium">{quotaInfo.cardText}</div>
                          <div className="text-brand-600 dark:text-brand-400 text-xs font-medium mt-2">Como pagar &rarr;</div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                          <CreditCard className="text-brand-500" size={24} />
                          <div className="h-5 w-20 rounded-xl bg-slate-900/10 dark:bg-white/10" />
                      </div>
                      <div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Quotas</div>
                          <div className="h-5 w-32 rounded bg-slate-900/10 dark:bg-white/10" />
                      </div>
                  </div>
              )}
              <div className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                      <History className="text-brand-500" size={24} />
                  </div>
                  <div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Próximo Pagamento</div>
                      <div className="text-slate-900 dark:text-white font-medium">{quotaInfo?.nextPayment ?? '—'}</div>
                  </div>
              </div>
              <div className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                      <Bell className="text-brand-500" size={24} />
                      <Badge className="bg-brand-500/20 text-brand-600 dark:text-brand-400 border-brand-500/30">{notificationsCount}</Badge>
                  </div>
                  <div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Notificações</div>
                      <div className="text-slate-900 dark:text-white font-medium">{notificationsCount} novas</div>
                  </div>
              </div>
              <div className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                      <FileText className="text-brand-500" size={24} />
                  </div>
                  <div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Documentos</div>
                      <div className="text-slate-900 dark:text-white font-medium">{documentsCount} disponíveis</div>
                  </div>
              </div>
          </div>
      </div>
  </div>
);

interface DocumentsTabProps {
  documents: Document[];
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ documents }) => (
  <div className="space-y-6 animate-fade-in-up">
      <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-6">Documentos Privados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map(doc => (
              <div key={doc.id} className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-5 hover:border-brand-500/30 transition-colors group">
                  <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                          <div className="p-3 bg-brand-500/10 rounded-xl">
                              <FileText className="text-brand-500" size={24} />
                          </div>
                          <div>
                              <h4 className="text-slate-900 dark:text-white font-medium mb-1">{doc.title}</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-sm">{doc.category}</p>
                          </div>
                      </div>
                      {doc.url || doc.externalUrl ? (
                          <a
                              href={doc.url || doc.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5"
                              aria-label={`Descarregar ${doc.title}`}
                          >
                              <Download size={16} />
                          </a>
                      ) : (
                          <Button size="sm" variant="ghost" disabled aria-label="Sem ficheiro disponível">
                              <Download size={16} />
                          </Button>
                      )}
                  </div>
              </div>
          ))}
      </div>
  </div>
);

interface NotificationsTabProps {
  notifications: Notification[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications }) => (
  <div className="space-y-6 animate-fade-in-up">
      <h3 className="text-xl font-serif text-slate-900 dark:text-white mb-6">Notificações</h3>
      <div className="space-y-4">
          {notifications.map(n => (
              <div key={n.id} className="bg-white dark:bg-dark-surface border border-slate-900/10 dark:border-white/10 rounded-2xl p-5 hover:border-brand-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${n.type === 'info' ? 'bg-blue-500/20' : n.type === 'warning' ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                          <Bell size={18} className={n.type === 'info' ? 'text-blue-600 dark:text-blue-400' : n.type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'} />
                      </div>
                      <div className="flex-1">
                          <h4 className="text-slate-900 dark:text-white font-medium mb-1">{n.title}</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">{n.message}</p>
                          <p className="text-slate-500 text-xs mt-2">{n.date ? new Date(n.date).toLocaleDateString('pt-PT') : '\u2014'}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>
  </div>
);

interface CopyableFieldProps {
  label: string;
  value: string;
  monospace?: boolean;
}

/** Labeled value row with a copy-to-clipboard action; flips to a check icon for 2s after copying. */
const CopyableField: React.FC<CopyableFieldProps> = ({ label, value, monospace }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider mb-0.5">{label}</div>
        <div className={cn('text-slate-900 dark:text-white font-medium truncate', monospace && 'font-mono')}>{value}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar"
        className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  );
};

interface PaymentModalContentProps {
  settings: Settings;
}

/** Body of the quota payment modal: lists configured payment methods, or a contact-the-direção empty state. */
const PaymentModalContent: React.FC<PaymentModalContentProps> = ({ settings }) => {
  const hasMbway = Boolean(settings.mbwayNumber);
  const hasIban = Boolean(settings.iban);
  const hasMultibanco = Boolean(settings.multibancoEntity && settings.multibancoReference);
  const hasAnyMethod = hasMbway || hasIban || hasMultibanco;

  if (!hasAnyMethod) {
    return (
      <div className="space-y-4 py-2">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-amber-700 dark:text-amber-400 text-sm space-y-2">
          <p className="font-medium">O pagamento digital de quotas ainda não está disponível.</p>
          <p>Podes regularizar a quota diretamente com a direção no pavilhão, ou por email.</p>
        </div>
        <a
          href={`mailto:${settings.contactEmail}`}
          className="inline-flex items-center gap-2 justify-center w-full px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Mail size={16} /> Contactar a Direção
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-2">
      {settings.quotaAmount && (
        <div className="text-center">
          <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Valor da quota</div>
          <div className="text-2xl font-serif text-slate-900 dark:text-white">{settings.quotaAmount}</div>
        </div>
      )}

      <div className="space-y-3">
        {hasMbway && (
          <div className="border border-slate-900/10 dark:border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">
              <Smartphone size={14} /> MB WAY
            </div>
            <CopyableField label="Número" value={settings.mbwayNumber as string} />
          </div>
        )}
        {hasIban && (
          <div className="border border-slate-900/10 dark:border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">
              <Landmark size={14} /> Transferência Bancária
            </div>
            <CopyableField label="IBAN" value={settings.iban as string} monospace />
          </div>
        )}
        {hasMultibanco && (
          <div className="border border-slate-900/10 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <CreditCard size={14} /> Multibanco
            </div>
            <CopyableField label="Entidade" value={settings.multibancoEntity as string} monospace />
            <CopyableField label="Referência" value={settings.multibancoReference as string} monospace />
          </div>
        )}
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-xs text-center">
        Após o pagamento, a direção confirma e atualiza o estado da tua quota. Em caso de dúvida contacta {settings.contactEmail}.
      </p>
    </div>
  );
};

// --- Main Component ---

export const MemberArea: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { documents, notifications, settings } = useData();
  const me = useQuery(api.users.me);
  const profile = useQuery(api.memberProfiles.mine);

  // Card identity comes from the authenticated account; quota/payment data
  // comes from the member profile registered by the direção.
  const displayName = me?.name || me?.email?.split('@')[0] || 'Sócio ARCVA';
  const memberSince = me?.createdAt ? new Date(me.createdAt).getFullYear().toString() : '---';
  const memberData: MemberData = {
    name: displayName,
    number: profile?.memberNumber ?? '---',
    since: memberSince,
  };

  // undefined while `mine` is loading; the dashboard card shows a pulse
  // placeholder instead of guessing a status.
  const quotaInfo = profile === undefined ? null : getQuotaInfo(profile?.quotaPaidUntil);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Navigation Tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
      <title>{`Área de Sócio — ${settings.siteName}`}</title>
      <div className="max-w-7xl mx-auto px-4 pt-28 sm:pt-32 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-fade-in-up">
            <div>
                <span className="text-brand-600 dark:text-brand-400 uppercase tracking-[0.3em] text-[10px] font-bold">Portal do Sócio</span>
                <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white mt-2 mb-2">Área de Sócio</h1>
                <p className="text-slate-500 dark:text-slate-400">Bem-vindo à sua área reservada.</p>
            </div>
            <Button variant="ghost" onClick={onLogout} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <LogOut size={18} /> Terminar Sessão
            </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                            ? 'bg-brand-500 text-white'
                            : 'bg-white dark:bg-dark-surface text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-900/10 dark:border-white/10'
                    }`}
                >
                    <tab.icon size={16} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            memberData={memberData}
            quotaInfo={quotaInfo}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            onOpenPaymentModal={() => setShowPaymentModal(true)}
            notificationsCount={notifications.length}
            documentsCount={documents.length}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab documents={documents} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab notifications={notifications} />
        )}

        {/* Payment Modal */}
        <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Pagamento de Quota" size="md">
            <PaymentModalContent settings={settings} />
        </Modal>
      </div>
    </div>
  );
};

/**
 * Router wrapper for MemberArea.
 * Retrieves the handleLogout callback from the layout's outlet context.
 */
export const MemberAreaWrapper: React.FC = () => {
  const { handleLogout } = useOutletContext<{ handleLogout: () => void }>();

  return <MemberArea onLogout={handleLogout} />;
};
