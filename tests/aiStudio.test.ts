import { describe, expect, it } from 'vitest';
import { describeDay, findTime, resolveEventDate, resolveRelativeDay } from '../convex/lib/aiStudioDates';
import { coerceEventDraft, coercePostDraft, extractJson, price, places, type CoerceContext } from '../convex/lib/aiStudioDraft';
import { buildPosterPrompt } from '../convex/lib/aiStudioPrompts';
import { isOwnStorageUrl } from '../convex/lib/referenceUrl';
import { draftToFormData, readTimeFor, AI_DRAFT_FLAG } from '../pages/admin/studio/draftToForm';
import { stageAt, stagesFor } from '../pages/admin/studio/studioCopy';

// A Sunday: weekday arithmetic is where models (and naive code) slip
const TODAY = '2026-10-04';

const ctx: CoerceContext = {
  brief: 'Torneio de sueca no sábado às 15h',
  today: TODAY,
  categories: [{ id: 'cat_sport', name: 'Desporto' }, { id: 'cat_culture', name: 'Cultura' }],
  fallbackLocation: 'Sede da associação',
};

describe('AI studio dates', () => {
  it('anchors the model with a readable day', () => {
    expect(describeDay(TODAY)).toBe('domingo, 4 de outubro de 2026');
  });

  it('reads Portuguese relative days against the local today', () => {
    expect(resolveRelativeDay('torneio no sábado', TODAY)).toBe('2026-10-10');
    expect(resolveRelativeDay('almoço no domingo', TODAY)).toBe('2026-10-11');
    expect(resolveRelativeDay('reunião amanhã', TODAY)).toBe('2026-10-05');
    expect(resolveRelativeDay('festa no dia 12', TODAY)).toBe('2026-10-12');
    expect(resolveRelativeDay('festa no dia 2', TODAY)).toBe('2026-11-02');
    expect(resolveRelativeDay('magusto a 11 de novembro', TODAY)).toBe('2026-11-11');
    expect(resolveRelativeDay('trail a 12 de abril', TODAY)).toBe('2027-04-12');
    expect(resolveRelativeDay('sem data nenhuma', TODAY)).toBeNull();
  });

  it('finds the hour in the usual ways it is written', () => {
    expect(findTime('às 15h')).toBe('15:00');
    expect(findTime('às 21h30')).toBe('21:30');
    expect(findTime('pelas 9:15')).toBe('09:15');
    expect(findTime('às 20 horas')).toBe('20:00');
    expect(findTime('5 € por dupla')).toBeNull();
  });

  it('keeps a valid model date and fills a missing hour from the brief', () => {
    expect(resolveEventDate('2026-10-10T15:00', 'x', TODAY)).toEqual({ value: '2026-10-10T15:00' });
    expect(resolveEventDate('2026-10-10', 'às 21h', TODAY)).toEqual({ value: '2026-10-10T21:00' });
  });

  it('falls back to the brief, then to next week, and flags a past date', () => {
    expect(resolveEventDate('next saturday', 'sueca no sábado às 15h', TODAY).value).toBe('2026-10-10T15:00');
    const none = resolveEventDate(undefined, 'sem data', TODAY);
    expect(none.value).toBe('2026-10-11T15:00');
    expect(none.note).toBeDefined();
    expect(resolveEventDate('2025-10-10T15:00', 'x', TODAY).note).toMatch(/já passou/);
    expect(resolveEventDate('2026-02-30T15:00', 'dia 12', TODAY).value).toBe('2026-10-12T15:00');
  });
});

describe('AI studio draft coercion', () => {
  it('extracts JSON wrapped in fences or prose', () => {
    expect(extractJson('```json\n{"title":"A"}\n```')).toEqual({ title: 'A' });
    expect(extractJson('Aqui está: {"a":1} espero que ajude')).toEqual({ a: 1 });
    expect(extractJson('sem json')).toBeNull();
    expect(extractJson('[1,2]')).toBeNull();
  });

  it('coerces prices and places from whatever the model sends', () => {
    expect(price('5,50 €')).toBe(5.5);
    expect(price(-3)).toBe(0);
    expect(price('grátis')).toBe(0);
    expect(places('16')).toBe(16);
    expect(places(0)).toBeNull();
    expect(places(null)).toBeNull();
  });

  it('never trusts the model: category, HTML, fields and types are all checked', () => {
    const { draft } = coerceEventDraft({
      title: '  Torneio   de Sueca ',
      descriptionHtml: '<p>Venha jogar</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
      date: '2026-10-10T15:00',
      categoryId: 'invented',
      isTournament: 'true',
      tournamentType: 'Sueca',
      entryPrice: '5',
      maxParticipants: '16',
      registrationOpen: true,
      registrationFields: [
        { label: 'Nome da dupla', type: 'text', required: true },
        { label: 'Email', type: 'email', required: true },
        { label: 'Escalão', type: 'select', required: false },
        { label: 'nome da dupla', type: 'text' },
      ],
    }, ctx);
    expect(draft.title).toBe('Torneio de Sueca');
    expect(draft.categoryId).toBe('cat_sport');
    expect(draft.descriptionHtml).not.toMatch(/script|onerror/);
    expect(draft.isTournament).toBe(true);
    expect(draft.entryPrice).toBe(5);
    expect(draft.maxParticipants).toBe(16);
    expect(draft.registrationFields).toEqual([
      { id: 'field_ai_1', label: 'Nome da dupla', type: 'text', required: true },
      { id: 'field_ai_2', label: 'Escalão', type: 'text', required: false },
    ]);
    expect(draft.location).toBe('Sede da associação');
  });

  it('matches a category by name and drops fields when registrations are closed', () => {
    const { draft } = coerceEventDraft({ categoryId: 'cultura', registrationOpen: false, registrationFields: [{ label: 'Equipa' }], isTournament: false, tournamentType: 'Sueca' }, ctx);
    expect(draft.categoryId).toBe('cat_culture');
    expect(draft.registrationFields).toEqual([]);
    expect(draft.tournamentType).toBe('');
    expect(draft.title).toBe('Novo evento');
    expect(draft.descriptionHtml).toBe('<p>Torneio de sueca no sábado às 15h</p>');
  });

  it('coerces a post with unique, short tags', () => {
    const { draft } = coercePostDraft({ title: 'Resumo', contentHtml: '<p>Texto</p>', tags: ['Sueca', 'Sueca', 42, '', 'Torneio'] }, ctx);
    expect(draft.tags).toEqual(['Sueca', '42', 'Torneio']);
    expect(draft.categoryId).toBe('cat_sport');
  });
});

describe('AI studio poster prompt', () => {
  const lines = { title: '5.º Trail', date: 'Domingo, 12 de abril · 9h00', place: 'Sede', extra: '' };
  it('asks for the Portuguese lines only when a poster with text was requested', () => {
    const withText = buildPosterPrompt({ kind: 'event', imagePrompt: 'runners', posterText: true, lines, hasReference: true, brandColor: '#123456' });
    expect(withText).toContain('"5.º Trail"');
    expect(withText).toContain('#123456');
    expect(withText).toContain('replace every piece of text');
    const noText = buildPosterPrompt({ kind: 'event', imagePrompt: 'runners', posterText: false, lines, hasReference: false });
    expect(noText).toContain('NO text');
    expect(noText).not.toContain('5.º Trail');
  });
});

describe('AI studio draft → form', () => {
  it('maps an event onto the keys EventForm and buildPayload use', () => {
    const { draft } = coerceEventDraft({ title: 'Sueca', date: '2026-10-10T15:00', entryPrice: 0, maxParticipants: null, registrationOpen: true, registrationFields: [{ label: 'Nome da dupla', type: 'text', required: true }] }, ctx);
    const mapped = draftToFormData({ kind: 'event', event: draft, imageUrl: 'https://s/heavy.png', notes: [] }, { nowLocal: '2026-10-04T10:00', imageUrl: 'https://s/light.jpg' });
    expect(mapped?.type).toBe('event');
    expect(mapped?.data).toMatchObject({
      title: 'Sueca', date: '2026-10-10T15:00', status: 'published', categoryId: 'cat_sport',
      entryPrice: '', maxParticipants: '', registrationOpen: true, allowGuestRegistration: true,
      imageUrl: 'https://s/light.jpg', [AI_DRAFT_FLAG]: true,
    });
    expect(mapped?.data.registrationFields).toEqual([{ id: 'field_ai_1', label: 'Nome da dupla', type: 'text', required: true, placeholder: '' }]);
  });

  it('maps a post onto coverUrl, content and a read time', () => {
    const { draft } = coercePostDraft({ title: 'Resumo', excerpt: 'Curto', contentHtml: `<p>${'palavra '.repeat(420)}</p>`, tags: ['A'] }, ctx);
    const mapped = draftToFormData({ kind: 'post', post: draft, imageUrl: 'https://s/c.png', notes: [] }, { nowLocal: '2026-10-04T10:00' });
    expect(mapped?.data).toMatchObject({ title: 'Resumo', excerpt: 'Curto', coverUrl: 'https://s/c.png', published: true, date: '2026-10-04T10:00', readTime: '2 min', tags: ['A'] });
    expect(readTimeFor('<p>uma</p>')).toBe('1 min');
  });
});

describe('AI studio progress', () => {
  it('walks the server stages by elapsed time and never claims to polish early', () => {
    const stages = stagesFor(true, true);
    expect(stages).toEqual(['reference', 'text', 'image', 'polish']);
    expect(stageAt(1000, stages)).toBe('reference');
    expect(stageAt(6000, stages)).toBe('text');
    expect(stageAt(60_000, stages)).toBe('image');
    expect(stageAt(60_000, stagesFor(false, false))).toBe('text');
  });
});

describe('AI studio reference URL guard (SSRF)', () => {
  const cloud = 'https://happy-animal-123.convex.cloud';
  it('accepts only files of this deployment storage', () => {
    expect(isOwnStorageUrl(`${cloud}/api/storage/5b57f7c6-bad1-4d7e`, cloud)).toBe(true);
  });
  it('rejects other hosts, schemes, paths, credentials and a missing deployment URL', () => {
    expect(isOwnStorageUrl('https://other-animal-9.convex.cloud/api/storage/x', cloud)).toBe(false);
    expect(isOwnStorageUrl('http://happy-animal-123.convex.cloud/api/storage/x', cloud)).toBe(false);
    expect(isOwnStorageUrl(`${cloud}/api/query`, cloud)).toBe(false);
    expect(isOwnStorageUrl(`${cloud}/api/storage/../query`, cloud)).toBe(false);
    expect(isOwnStorageUrl('https://user:pw@happy-animal-123.convex.cloud/api/storage/x', cloud)).toBe(false);
    expect(isOwnStorageUrl('https://happy-animal-123.convex.cloud.evil.com/api/storage/x', cloud)).toBe(false);
    expect(isOwnStorageUrl('http://169.254.169.254/latest/meta-data', cloud)).toBe(false);
    expect(isOwnStorageUrl('data:image/png;base64,AAAA', cloud)).toBe(false);
    expect(isOwnStorageUrl('not a url', cloud)).toBe(false);
    expect(isOwnStorageUrl(`${cloud}/api/storage/x`, undefined)).toBe(false);
  });
});
