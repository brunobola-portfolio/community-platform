/**
 * Copy and small pure helpers of the AI studio dialog.
 */

import { ConvexError } from 'convex/values';

export type StudioKind = 'event' | 'post';

export const EXAMPLES: Record<StudioKind, string[]> = {
    event: [
        'Torneio de sueca no sábado às 15h, 5 € por dupla, máximo 16 duplas, inscrições pelo site',
        'Magusto no dia 11 de novembro às 16h no largo da sede, castanhas, jeropiga e música, entrada livre',
        '5.º Trail da associação a 12 de abril às 9h, provas de 10 e 20 km, inscrições a 12 €',
    ],
    post: [
        'Resumo do torneio de sueca de sábado: 14 duplas em prova, venceu a dupla Silva e Costa',
        'Agradecimento aos voluntários e patrocinadores que tornaram possível a festa de verão',
        'Abertas as inscrições para a escola de música: aulas às quartas às 18h, para todas as idades',
    ],
};

export const PLACEHOLDER: Record<StudioKind, string> = {
    event: 'Descreva em poucas palavras: o quê, quando, onde, preço, inscrições…',
    post: 'Descreva em poucas palavras o que aconteceu ou o que quer anunciar…',
};

export type StageId = 'reference' | 'text' | 'image' | 'polish';

export const STAGE_LABEL: Record<StageId, string> = {
    reference: 'A ler a referência…',
    text: 'A escrever o texto…',
    image: 'A criar o cartaz…',
    polish: 'A otimizar a imagem…',
};

/** The stages this run will go through, in order. */
export function stagesFor(hasReference: boolean, withImage: boolean): StageId[] {
    return [
        ...(hasReference ? ['reference' as const] : []),
        'text' as const,
        ...(withImage ? ['image' as const, 'polish' as const] : []),
    ];
}

/**
 * The action is a single call, so the server stages are paced by typical
 * durations: reading a reference takes a few seconds, the text about ten, the
 * poster the rest. 'polish' only starts when the browser really gets there.
 */
export function stageAt(elapsedMs: number, stages: StageId[]): StageId {
    const serverStages = stages.filter(s => s !== 'polish');
    const budget: Record<StageId, number> = { reference: 4000, text: 9000, image: Infinity, polish: Infinity };
    let elapsed = elapsedMs;
    for (const stage of serverStages) {
        if (elapsed < budget[stage]) return stage;
        elapsed -= budget[stage];
    }
    return serverStages[serverStages.length - 1] ?? 'text';
}

const TOKEN_MESSAGES: Record<string, string> = {
    ERR_QUOTA: 'O serviço de IA atingiu o limite de utilização. Tente mais tarde.',
    ERR_RATE_LIMIT: 'Muitos pedidos seguidos. Aguarde um minuto e tente de novo.',
    ERR_UNAVAILABLE: 'O serviço de IA está indisponível de momento. Tente dentro de instantes.',
    ERR_GENERIC: 'A IA não conseguiu preparar o rascunho. Reformule a descrição e tente de novo.',
};

/** Friendly pt-PT text for whatever the action threw; raw provider text never reaches the screen. */
export function studioErrorMessage(error: unknown): string {
    if (error instanceof ConvexError) {
        const data = String(error.data);
        return TOKEN_MESSAGES[data] ?? (data.startsWith('ERR_') ? TOKEN_MESSAGES.ERR_GENERIC : data);
    }
    const token = error instanceof Error ? error.message.match(/ERR_[A-Z_]+/)?.[0] : undefined;
    return (token && TOKEN_MESSAGES[token]) || 'Não foi possível criar o rascunho. Verifique a ligação e tente de novo.';
}

/** Local "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm" (toISOString would give UTC and shift late-evening days). */
export function localStamp(now: Date = new Date()): { day: string; minute: string } {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return { day, minute: `${day}T${pad(now.getHours())}:${pad(now.getMinutes())}` };
}
