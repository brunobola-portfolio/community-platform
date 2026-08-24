
import React from 'react';
import {
    BarChart3, Bot, Shield, MessageSquare,
    Image as LucideImage
} from 'lucide-react';
import { Button } from '../../components/ui/UIComponents';
import { STD_INPUT_CLASS, LABEL_CLASS } from './constants';
import { AdminSelect } from './components/AdminSelect';
import { ProviderConfigSection } from './components/ProviderConfigSection';
import type { AdminAITabProps } from './types';

/**
 * AI & Chatbot configuration tab.
 * Manages chatbot settings, guardrails, image generation config, and usage analytics.
 */
export const AdminAITab: React.FC<AdminAITabProps> = ({
    aiStats,
    settingsForm,
    onSettingsChange,
    onSave,
}) => {
    const update = <K extends keyof typeof settingsForm>(key: K, value: (typeof settingsForm)[K]) => {
        onSettingsChange({ ...settingsForm, [key]: value });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <AnalyticsOverview aiStats={aiStats} />
            <ProviderConfigSection settingsForm={settingsForm} update={update} />
            <ChatbotConfig settingsForm={settingsForm} update={update} />
            <GuardrailsConfig settingsForm={settingsForm} update={update} />
            <ImageGenerationConfig settingsForm={settingsForm} update={update} />
            <TestChatSection />

            <div className="flex justify-end sticky bottom-0 bg-dark-bg p-4 z-10 border-t border-white/10">
                <Button onClick={onSave}>Guardar Alterações</Button>
            </div>
        </div>
    );
};

// ── Analytics Overview ────────────────────────────────────────────────────────

const AnalyticsOverview: React.FC<{ aiStats: AdminAITabProps['aiStats'] }> = ({ aiStats }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
            <BarChart3 className="text-cyan-400" /> Análise de Uso (Últimos 7 dias)
        </h3>
        {aiStats ? (
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard label="Total Pedidos" value={String(aiStats.totalCalls)} color="text-white" />
                    <MetricCard label="Taxa Sucesso" value={`${aiStats.successRate}%`} color="text-green-400" />
                    <MetricCard label="Latência Média" value={`${aiStats.avgLatency}ms`} color="text-brand-400" />
                    <MetricCard label="Erros" value={String(aiStats.errorCount)} color="text-red-400" />
                </div>
                {Object.keys(aiStats.byAction).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <BreakdownCard title="Por Ação" entries={aiStats.byAction} valueColor="text-brand-400" />
                        <BreakdownCard
                            title="Por Modelo"
                            entries={Object.fromEntries(
                                Object.entries(aiStats.byModel).map(([k, v]) => [k.replace('gemini-', ''), v])
                            )}
                            valueColor="text-purple-400"
                            truncateKeys
                        />
                        <ClassificationBreakdown entries={aiStats.byClassification} />
                    </div>
                )}
            </div>
        ) : (
            <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Sem dados de utilização ainda.</p>
            </div>
        )}
    </div>
);

// ── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
    label: string;
    value: string;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => (
    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
        <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
);

// ── Breakdown Card ──────────────────────────────────────────────────────────

interface BreakdownCardProps {
    title: string;
    entries: Record<string, number>;
    valueColor: string;
    truncateKeys?: boolean;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({ title, entries, valueColor, truncateKeys }) => (
    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
        <p className="text-slate-400 text-xs font-bold uppercase mb-2">{title}</p>
        {Object.entries(entries).map(([key, count]) => (
            <div key={key} className="flex justify-between text-sm py-1">
                <span className={`text-slate-300 capitalize ${truncateKeys ? 'truncate mr-2' : ''}`}>{key}</span>
                <span className={`${valueColor} font-mono`}>{count}</span>
            </div>
        ))}
    </div>
);

// ── Classification Breakdown (custom colors per classification) ─────────────

const ClassificationBreakdown: React.FC<{ entries: Record<string, number> }> = ({ entries }) => (
    <div className="bg-black/30 rounded-lg p-4 border border-white/5">
        <p className="text-slate-400 text-xs font-bold uppercase mb-2">Classificação</p>
        {Object.entries(entries).map(([cls, count]) => (
            <div key={cls} className="flex justify-between text-sm py-1">
                <span className={`text-sm ${cls === 'FORA_DE_TEMA' ? 'text-amber-400' : cls === 'INJECTION' ? 'text-red-400' : 'text-slate-300'}`}>
                    {cls}
                </span>
                <span className="text-slate-400 font-mono">{count}</span>
            </div>
        ))}
    </div>
);

// ── Chatbot Config Section ──────────────────────────────────────────────────

interface ConfigSectionProps {
    settingsForm: AdminAITabProps['settingsForm'];
    update: <K extends keyof AdminAITabProps['settingsForm']>(key: K, value: AdminAITabProps['settingsForm'][K]) => void;
}

const ChatbotConfig: React.FC<ConfigSectionProps> = ({ settingsForm, update }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
            <Bot className="text-brand-400" /> Configuração do Chatbot
        </h3>
        <div className="space-y-4">
            <ToggleRow label="Chatbot Ativo" description="Ativa ou desativa o chatbot no portal público" checked={settingsForm.enableChatbot} onChange={v => update('enableChatbot', v)} />
            <ToggleRow label="Mostrar Bolha Flutuante" description="Mostra o botão flutuante do chatbot no canto inferior direito" checked={settingsForm.showChatbotBubble} onChange={v => update('showChatbotBubble', v)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Modelo Principal</label>
                    <AdminSelect value={settingsForm.chatModel} onChange={e => update('chatModel', e.target.value)}>
                        <option value="gemini-3.7-flash">Gemini 3.7 Flash (mais recente)</option>
                        <option value="gemini-3.5-flash">Gemini 3.5 Flash (recomendado)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (económico)</option>
                    </AdminSelect>
                </div>
                <div>
                    <label className={LABEL_CLASS}>Modelo Fallback</label>
                    <AdminSelect value={settingsForm.chatModelFallback} onChange={e => update('chatModelFallback', e.target.value)}>
                        <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (recomendado)</option>
                        <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                    </AdminSelect>
                </div>
            </div>
            <div>
                <label className={LABEL_CLASS}>Modelo TTS (Voz)</label>
                <AdminSelect value={settingsForm.ttsModel} onChange={e => update('ttsModel', e.target.value)}>
                    <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash TTS</option>
                    <option value="gemini-3.1-flash-tts-preview">Gemini 3.1 Flash TTS (Preview)</option>
                </AdminSelect>
            </div>
            <div>
                <label className={LABEL_CLASS}>Orçamento de Raciocínio (Thinking Budget)</label>
                <div className="flex items-center gap-4">
                    <input type="range" min="128" max="2048" step="128" value={settingsForm.thinkingBudget} onChange={e => update('thinkingBudget', parseInt(e.target.value))} className="flex-1 accent-brand-500" />
                    <span className="text-brand-400 font-mono text-sm w-16 text-right">{settingsForm.thinkingBudget}</span>
                </div>
            </div>
            <div>
                <label className={LABEL_CLASS}>Instruções Extra do Sistema</label>
                <textarea rows={3} value={settingsForm.aiSystemPromptExtra ?? ''} onChange={e => update('aiSystemPromptExtra', e.target.value)} className={STD_INPUT_CLASS} placeholder="Instruções adicionais para personalizar o comportamento do chatbot..." />
                <p className="text-slate-600 text-xs mt-1">Estas instruções são adicionadas ao prompt base do sistema.</p>
            </div>
        </div>
    </div>
);

// ── Guardrails Config ───────────────────────────────────────────────────────

const GuardrailsConfig: React.FC<ConfigSectionProps> = ({ settingsForm, update }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
            <Shield className="text-amber-400" /> Guardrails & Segurança
        </h3>
        <div className="space-y-4">
            <ToggleRow label="Guardrails Ativos" description="Classifica e filtra perguntas fora do âmbito da associação" checked={settingsForm.aiGuardrailsEnabled} onChange={v => update('aiGuardrailsEnabled', v)} />
            <div>
                <label className={LABEL_CLASS}>Tópicos Permitidos</label>
                <input value={settingsForm.aiAllowedTopics ?? ''} onChange={e => update('aiAllowedTopics', e.target.value)} className={STD_INPUT_CLASS} placeholder="associação, localidade, eventos, cultura, desporto, comunidade" />
                <p className="text-slate-600 text-xs mt-1">Separados por vírgula. O chatbot foca-se nestes temas.</p>
            </div>
            <div>
                <label className={LABEL_CLASS}>Tópicos Proibidos</label>
                <input value={settingsForm.aiForbiddenTopics ?? ''} onChange={e => update('aiForbiddenTopics', e.target.value)} className={STD_INPUT_CLASS} placeholder="política partidária, religião, aconselhamento médico, conteúdo adulto" />
                <p className="text-slate-600 text-xs mt-1">Separados por vírgula. Perguntas sobre estes temas são recusadas educadamente.</p>
            </div>
        </div>
    </div>
);

// ── Image Generation Config ─────────────────────────────────────────────────

const ImageGenerationConfig: React.FC<ConfigSectionProps> = ({ settingsForm, update }) => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
            <LucideImage className="text-purple-400" /> Geração de Imagens
        </h3>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={LABEL_CLASS}>Modelo de Imagem</label>
                    <AdminSelect value={settingsForm.imageModel} onChange={e => update('imageModel', e.target.value)}>
                        <option value="gemini-3.1-flash-lite-image">NanoBanana 2 Lite -- económico</option>
                        <option value="gemini-3.1-flash-image">NanoBanana 2 -- recomendado</option>
                        <option value="gemini-3-pro-image">NanoBanana Pro -- qualidade máxima</option>
                        <option value="gemini-2.5-flash-image">NanoBanana (legado)</option>
                    </AdminSelect>
                </div>
                <div>
                    <label className={LABEL_CLASS}>Resolução Padrão</label>
                    <AdminSelect value={settingsForm.imageResolution ?? '1k'} onChange={e => update('imageResolution', e.target.value)}>
                        <option value="1k">1K (1024x1024) -- Rápido</option>
                        <option value="2k">2K (2048x2048) -- Qualidade</option>
                        <option value="4k">4K (4096x4096) -- Máxima (só Pro)</option>
                    </AdminSelect>
                </div>
            </div>
            <div>
                <label className={LABEL_CLASS}>Estilo Visual Padrão</label>
                <textarea rows={2} value={settingsForm.defaultImageStyle} onChange={e => update('defaultImageStyle', e.target.value)} className={STD_INPUT_CLASS} placeholder="Cinematic lighting, photorealistic, 4k, community atmosphere, warm tones" />
            </div>
            <div>
                <label className={LABEL_CLASS}>Tom do Conteúdo</label>
                <AdminSelect value={settingsForm.contentTone} onChange={e => update('contentTone', e.target.value)}>
                    <option value="Profissional e Inspirador">Profissional e Inspirador</option>
                    <option value="Informal e Amigável">Informal e Amigável</option>
                    <option value="Formal e Institucional">Formal e Institucional</option>
                    <option value="Jovem e Dinâmico">Jovem e Dinâmico</option>
                </AdminSelect>
            </div>
        </div>
    </div>
);

// ── Test Chat Section ───────────────────────────────────────────────────────

const TestChatSection: React.FC = () => (
    <div className="bg-dark-surface border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
            <MessageSquare className="text-green-400" /> Testar Chatbot
        </h3>
        <p className="text-slate-400 text-sm mb-4">Testa o chatbot com as definições atuais. As alterações devem ser guardadas primeiro.</p>
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 h-[300px] flex items-center justify-center">
            <button
                type="button"
                onClick={() => {
                    const bubble = document.querySelector('[data-chatbot-trigger]') as HTMLButtonElement | null;
                    if (bubble) bubble.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 rounded-lg text-white text-sm hover:bg-brand-500 transition-all"
            >
                <Bot size={16} /> Abrir Chat de Teste
            </button>
        </div>
    </div>
);

// ── Toggle Row ──────────────────────────────────────────────────────────────

interface ToggleRowProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <span className="text-white text-sm">{label}</span>
            <p className="text-slate-500 text-xs mt-0.5">{description}</p>
        </div>
        <input type="checkbox" className="accent-brand-500 w-5 h-5" checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
);
