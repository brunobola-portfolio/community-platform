
import React from 'react';
import { Bot, Shield, Image as LucideImage } from 'lucide-react';
import { STD_INPUT_CLASS, LABEL_CLASS } from './constants';
import { AdminSelect } from './components/AdminSelect';
import { ProviderConfigSection } from './components/ProviderConfigSection';
import { ImageEngineSection } from './components/ImageEngineSection';
import { AIUsagePanel } from './ai/AIUsagePanel';
import { TestChatSection } from './ai/TestChatSection';
import { SaveBar } from './components/SaveBar';
import { useData } from '../../context/DataContext';
import type { AdminAITabProps } from './types';
import { Field } from './components/Field';
import { GEMINI_CHAT_MODELS, GEMINI_TTS_MODELS, GEMINI_IMAGE_MODELS } from '../../convex/lib/aiDefaults';

/** Settings the test chat answers with; a difference here means the test is not what was typed. */
const CHAT_KEYS = ['enableChatbot', 'chatModel', 'chatModelFallback', 'thinkingBudget', 'aiSystemPromptExtra', 'aiGuardrailsEnabled', 'aiAllowedTopics', 'aiForbiddenTopics', 'aiProvider', 'openrouterModel', 'customModel', 'customApiUrl'] as const;

/**
 * AI & Chatbot configuration tab.
 * Usage and costs first (what the admin checks most), then chatbot, guardrails
 * and image configuration.
 */
export const AdminAITab: React.FC<AdminAITabProps> = ({
    settingsForm,
    onSettingsChange,
    onSave,
    isSaving = false,
}) => {
    const { settings: saved } = useData();
    const update = <K extends keyof typeof settingsForm>(key: K, value: (typeof settingsForm)[K]) => {
        onSettingsChange({ ...settingsForm, [key]: value });
    };
    const chatDirty = CHAT_KEYS.some(k => (settingsForm[k] ?? '') !== (saved[k] ?? ''));

    return (
        <div className="space-y-6 animate-fade-in-up">
            <AIUsagePanel budgetUsd={settingsForm.aiMonthlyBudgetUsd} onBudgetChange={v => update('aiMonthlyBudgetUsd', v)} />
            <ProviderConfigSection settingsForm={settingsForm} update={update} />
            <ChatbotConfig settingsForm={settingsForm} update={update} />
            <GuardrailsConfig settingsForm={settingsForm} update={update} />
            <ImageGenerationConfig settingsForm={settingsForm} update={update} />
            <ImageEngineSection settingsForm={settingsForm} update={update} />
            <TestChatSection enabled={saved.enableChatbot !== false} bubbleVisible={saved.showChatbotBubble !== false} dirty={chatDirty} />

            <SaveBar onSave={onSave} isSaving={isSaving} dirty={chatDirty} />
        </div>
    );
};

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
                <Field label="Modelo Principal"><AdminSelect value={settingsForm.chatModel} onChange={e => update('chatModel', e.target.value)}>
                        {GEMINI_CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </AdminSelect></Field>
                <Field label="Modelo Fallback"><AdminSelect value={settingsForm.chatModelFallback} onChange={e => update('chatModelFallback', e.target.value)}>
                        {GEMINI_CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </AdminSelect></Field>
            </div>
            <Field label="Modelo TTS (Voz)"><AdminSelect value={settingsForm.ttsModel} onChange={e => update('ttsModel', e.target.value)}>
                    {GEMINI_TTS_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </AdminSelect></Field>
            <div>
                <label htmlFor="ai-thinking-budget" className={LABEL_CLASS}>Orçamento de raciocínio (thinking budget)</label>
                <div className="flex items-center gap-4">
                    <input id="ai-thinking-budget" type="range" min="128" max="2048" step="128" value={settingsForm.thinkingBudget} onChange={e => update('thinkingBudget', parseInt(e.target.value))} className="flex-1 accent-brand-500" />
                    <span className="text-brand-400 font-mono text-sm w-16 text-right">{settingsForm.thinkingBudget}</span>
                </div>
            </div>
            <div>
                <label htmlFor="ai-prompt-extra" className={LABEL_CLASS}>Instruções extra do sistema</label>
                <textarea id="ai-prompt-extra" rows={3} value={settingsForm.aiSystemPromptExtra ?? ''} onChange={e => update('aiSystemPromptExtra', e.target.value)} className={STD_INPUT_CLASS} placeholder="Instruções adicionais para personalizar o comportamento do chatbot..." />
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
                <label htmlFor="ai-allowed-topics" className={LABEL_CLASS}>Tópicos permitidos</label>
                <input id="ai-allowed-topics" maxLength={200} value={settingsForm.aiAllowedTopics ?? ''} onChange={e => update('aiAllowedTopics', e.target.value)} className={STD_INPUT_CLASS} placeholder="associação, localidade, eventos, cultura, desporto, comunidade" />
                <p className="text-slate-600 text-xs mt-1">Separados por vírgula. O chatbot foca-se nestes temas.</p>
            </div>
            <div>
                <label htmlFor="ai-forbidden-topics" className={LABEL_CLASS}>Tópicos proibidos</label>
                <input id="ai-forbidden-topics" maxLength={200} value={settingsForm.aiForbiddenTopics ?? ''} onChange={e => update('aiForbiddenTopics', e.target.value)} className={STD_INPUT_CLASS} placeholder="política partidária, religião, aconselhamento médico, conteúdo adulto" />
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
                <Field label="Modelo de Imagem"><AdminSelect value={settingsForm.imageModel} onChange={e => update('imageModel', e.target.value)}>
                        {GEMINI_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </AdminSelect></Field>
                <Field label="Resolução Padrão"><AdminSelect value={settingsForm.imageResolution ?? '1k'} onChange={e => update('imageResolution', e.target.value)}>
                        <option value="1k">1K (1024x1024) -- Rápido</option>
                        <option value="2k">2K (2048x2048) -- Qualidade</option>
                        <option value="4k">4K (4096x4096) -- Máxima (só Pro)</option>
                    </AdminSelect></Field>
            </div>
            <Field label="Estilo Visual Padrão"><textarea rows={2} value={settingsForm.defaultImageStyle} onChange={e => update('defaultImageStyle', e.target.value)} className={STD_INPUT_CLASS} placeholder="Cinematic lighting, photorealistic, 4k, community atmosphere, warm tones" /></Field>
            <Field label="Tom do Conteúdo"><AdminSelect value={settingsForm.contentTone} onChange={e => update('contentTone', e.target.value)}>
                    <option value="Profissional e Inspirador">Profissional e Inspirador</option>
                    <option value="Informal e Amigável">Informal e Amigável</option>
                    <option value="Formal e Institucional">Formal e Institucional</option>
                    <option value="Jovem e Dinâmico">Jovem e Dinâmico</option>
                </AdminSelect></Field>
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
            <p className="text-slate-400 text-xs mt-0.5">{description}</p>
        </div>
        <input type="checkbox" className="accent-brand-500 w-5 h-5" checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
);
