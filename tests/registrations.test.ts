import { describe, expect, it } from 'vitest';
import { csvCell, csvFileName, registrationsCsv } from '../utils/registrationsCsv';
import { escapeIcsText, googleCalendarUrl, icsContent } from '../utils/calendar';
import { validateRegistration, type RegistrationValues } from '../hooks/useEventRegistration';
import { cleanAnswers } from '../convex/lib/registrationRules';
import { keyHash } from '../convex/lib/keyHash';

const base: RegistrationValues = { name: 'Maria', email: 'maria@example.org', phone: '', extra: {}, website: '' };

describe('registration validation', () => {
  it('always asks for a name and a usable email', () => {
    const errors = validateRegistration({ ...base, name: ' ', email: 'maria@' }, {});
    expect(errors.name).toBeTruthy();
    expect(errors.email).toMatch(/válido/);
  });

  it("holds the event's own required fields to their label", () => {
    const fields = [{ id: 'team', label: 'Nome da equipa', type: 'text', required: true }];
    expect(validateRegistration(base, { registrationFields: fields }).team).toBe('Preencha “Nome da equipa”.');
    expect(validateRegistration({ ...base, extra: { team: 'Os Ases' } }, { registrationFields: fields }).team).toBeUndefined();
  });
});

describe('registrations CSV', () => {
  const rows = [
    { name: 'João; "Zé"', email: 'joao@x.pt', phone: '912', status: 'confirmed', timestamp: 0, customData: { team: 'Ases' } },
    { name: '=HYPERLINK("x")', email: 'a@b.c', status: 'pending' },
  ];

  it('opens in Portuguese Excel: BOM, semicolons, CRLF', () => {
    const csv = registrationsCsv(rows, [{ id: 'team', label: 'Equipa' }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.split('\r\n')[0]).toBe('\uFEFFNome;Email;Telemóvel;Estado;Inscrito em;Equipa');
  });

  it('quotes cells with separators and neutralises formulas', () => {
    expect(csvCell('João; "Zé"')).toBe('"João; ""Zé"""');
    expect(csvCell('=1+1')).toBe("'=1+1");
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell(undefined)).toBe('');
  });

  it('translates the status and names the file by event and day', () => {
    expect(registrationsCsv(rows)).toContain(';Confirmada;');
    expect(csvFileName('arraial', new Date('2026-07-01T10:00:00Z'))).toBe('inscricoes-arraial-2026-07-01.csv');
    expect(csvFileName(undefined, new Date('2026-07-01T10:00:00Z'))).toBe('inscricoes-todos-os-eventos-2026-07-01.csv');
  });
});

describe('calendar file', () => {
  const event = { title: 'Arraial, Vila Nova', date: '2026-07-18T21:00:00Z', location: 'Pavilhão; sede', slug: 'arraial', description: 'Linha 1\ninha 2' };

  it('carries the fields strict readers require', () => {
    const ics = icsContent(event, new Date('2026-07-01T00:00:00Z'));
    expect(ics).toContain('UID:arraial@community-platform');
    expect(ics).toContain('DTSTAMP:20260701T000000Z');
    expect(ics).toContain('DTSTART:20260718T210000Z');
    expect(ics).toContain('DTEND:20260718T230000Z');
    expect(ics.includes('\r\n')).toBe(true);
  });

  it('escapes commas, semicolons and newlines in text', () => {
    expect(escapeIcsText('a, b; c\nd')).toBe('a\\, b\\; c\\nd');
    expect(icsContent(event)).toContain('SUMMARY:Arraial\\, Vila Nova');
  });

  it('builds a Google Calendar link with the same times', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.searchParams.get('dates')).toBe('20260718T210000Z/20260718T230000Z');
    expect(url.searchParams.get('text')).toBe('Arraial, Vila Nova');
  });
});

describe('answers the server keeps', () => {
  const event = { registrationFields: [
    { id: 'partner', label: 'Parceiro', type: 'text', required: true },
    { id: 'shirt', label: 'Tamanho', type: 'text', required: false },
  ] };

  it('drops fields the event never asked for', () => {
    expect(cleanAnswers(event, { partner: 'Rui', injected: 'x'.repeat(5000) })).toEqual({ partner: 'Rui' });
  });

  it('enforces required answers on the server too', () => {
    expect(() => cleanAnswers(event, { shirt: 'M' })).toThrow(/Parceiro/);
  });

  it('refuses an answer longer than a person writes', () => {
    expect(() => cleanAnswers(event, { partner: 'x'.repeat(1001) })).toThrow(/demasiado longa/);
  });
});

describe('rate-limit key hash', () => {
  it('is stable and never shows the email', () => {
    expect(keyHash('ana@example.org')).toBe(keyHash('ana@example.org'));
    expect(keyHash('ana@example.org')).not.toContain('ana');
    expect(keyHash('ana@example.org')).not.toBe(keyHash('rui@example.org'));
  });
});
