import { describe, expect, it } from 'vitest';
import { mapsSearchUrl, sanitizeExternalUrl } from '../utils/security';

describe('sanitizeExternalUrl', () => {
    it('adds https to a bare domain', () => {
        expect(sanitizeExternalUrl('www.exemplo.pt')).toBe('https://www.exemplo.pt');
        expect(sanitizeExternalUrl('  exemplo.pt/loja ')).toBe('https://exemplo.pt/loja');
    });

    it('keeps an existing safe scheme', () => {
        expect(sanitizeExternalUrl('http://exemplo.pt')).toBe('http://exemplo.pt');
        expect(sanitizeExternalUrl('https://exemplo.pt')).toBe('https://exemplo.pt');
    });

    it('treats host:port as a bare domain', () => {
        expect(sanitizeExternalUrl('exemplo.pt:8080/x')).toBe('https://exemplo.pt:8080/x');
    });

    it('rejects dangerous schemes and empty values', () => {
        expect(sanitizeExternalUrl('javascript:alert(1)')).toBe('');
        expect(sanitizeExternalUrl('data:text/html,x')).toBe('');
        expect(sanitizeExternalUrl('')).toBe('');
        expect(sanitizeExternalUrl(undefined)).toBe('');
    });
});

describe('mapsSearchUrl', () => {
    it('encodes the address', () => {
        expect(mapsSearchUrl('Rua A, 12 Vila')).toBe('https://www.google.com/maps/search/?api=1&query=Rua%20A%2C%2012%20Vila');
    });
});
