import { describe, expect, it, vi } from 'vitest';
import type { MutationCtx } from '../convex/_generated/server';
import { reconcileImageUpdate } from '../convex/lib/cascade';

function fakeCtx() {
  const deleted: string[] = [];
  // An empty uploads ledger: these records hold legacy files or typed links
  const ctx = {
    db: { query: () => ({ withIndex: () => ({ first: async () => null }) }) },
    storage: { delete: vi.fn(async (id: string) => { deleted.push(id); }) },
  } as unknown as MutationCtx;
  return { ctx, deleted };
}

describe('reconcileImageUpdate', () => {
  it('a new URL releases the stored file the read side would still prefer', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { externalPhoto: 'https://new.example/p.jpg' };
    await reconcileImageUpdate(ctx, { photo: 'st_old' }, updates, 'photo', 'externalPhoto');
    expect(deleted).toEqual(['st_old']);
    expect('photo' in updates && updates.photo === undefined).toBe(true);
  });

  it('removing the image ("") also releases the stored file', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { externalImage: '' };
    await reconcileImageUpdate(ctx, { image: 'st_old', externalImage: 'https://x' }, updates, 'image', 'externalImage');
    expect(deleted).toEqual(['st_old']);
  });

  it('fields the form echoes unchanged leave the stored file alone', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { photo: 'st_old', externalPhoto: 'https://same', name: 'X' };
    await reconcileImageUpdate(ctx, { photo: 'st_old', externalPhoto: 'https://same' }, updates, 'photo', 'externalPhoto');
    expect(deleted).toEqual([]);
    expect(updates.photo).toBe('st_old');
  });

  it('a new URL next to an echoed storage id still wins', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { photo: 'st_old', externalPhoto: 'https://new' };
    await reconcileImageUpdate(ctx, { photo: 'st_old' }, updates, 'photo', 'externalPhoto');
    expect(deleted).toEqual(['st_old']);
    expect(updates.photo).toBeUndefined();
  });

  it('a new storage id releases the previous one', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { logo: 'st_new' };
    await reconcileImageUpdate(ctx, { logo: 'st_old' }, updates, 'logo', 'externalLogo');
    expect(deleted).toEqual(['st_old']);
    expect(updates.logo).toBe('st_new');
  });

  it('records that only ever had a URL need nothing', async () => {
    const { ctx, deleted } = fakeCtx();
    const updates: Record<string, unknown> = { externalLogo: 'https://new' };
    await reconcileImageUpdate(ctx, { externalLogo: 'https://old' }, updates, 'logo', 'externalLogo');
    expect(deleted).toEqual([]);
    expect('logo' in updates).toBe(false);
  });
});
