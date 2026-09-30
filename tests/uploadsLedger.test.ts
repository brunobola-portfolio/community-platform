import { describe, expect, it } from 'vitest';
import type { MutationCtx } from '../convex/_generated/server';
import type { Id } from '../convex/_generated/dataModel';
import {
  ABANDONED_UPLOAD_MS,
  registerUpload,
  releaseUrl,
  retainUrl,
  swapUrl,
  sweepAbandonedUploads,
} from '../convex/lib/uploads';
import { reconcileImageUpdate } from '../convex/lib/cascade';

interface Row { _id: string; storageId: string; url: string; refs: number; createdAt: number }
type Filter = [string, 'eq' | 'lt', unknown];

/** Just enough of the Convex db for the ledger: one table, the two index shapes it uses. */
function fakeCtx() {
  const rows = new Map<string, Row>();
  const deletedFiles: string[] = [];
  let next = 0;
  const match = (filters: Filter[]) => [...rows.values()].filter(r =>
    filters.every(([f, op, v]) => {
      const value = r[f as keyof Row];
      return op === 'eq' ? value === v : (value as number) < (v as number);
    }));
  const ctx = {
    db: {
      insert: async (_t: string, doc: Omit<Row, '_id'>) => { const _id = `u${next++}`; rows.set(_id, { _id, ...doc }); return _id; },
      patch: async (id: string, p: Partial<Row>) => { rows.set(id, { ...rows.get(id)!, ...p }); },
      delete: async (id: string) => { rows.delete(id); },
      query: () => ({
        withIndex: (_name: string, build: (q: unknown) => unknown) => {
          const filters: Filter[] = [];
          const q = {
            eq: (f: string, v: unknown) => { filters.push([f, 'eq', v]); return q; },
            lt: (f: string, v: unknown) => { filters.push([f, 'lt', v]); return q; },
          };
          build(q);
          return {
            first: async () => match(filters)[0] ?? null,
            take: async (n: number) => match(filters).slice(0, n),
          };
        },
      }),
    },
    storage: { delete: async (id: string) => { deletedFiles.push(id); } },
  } as unknown as MutationCtx;
  return { ctx, rows, deletedFiles };
}

const file = (id: string) => id as Id<'_storage'>;

describe('uploads ledger', () => {
  it('the file goes with the last record that used it, so a duplicate keeps its picture', async () => {
    const { ctx, deletedFiles } = fakeCtx();
    await registerUpload(ctx, file('f1'), 'https://s/a');
    await retainUrl(ctx, 'https://s/a');
    await retainUrl(ctx, 'https://s/a');
    await releaseUrl(ctx, 'https://s/a');
    expect(deletedFiles).toEqual([]);
    await releaseUrl(ctx, 'https://s/a');
    expect(deletedFiles).toEqual(['f1']);
  });

  it('swapping keeps the new file and releases the old one', async () => {
    const { ctx, deletedFiles, rows } = fakeCtx();
    await registerUpload(ctx, file('old'), 'https://s/old');
    await retainUrl(ctx, 'https://s/old');
    await registerUpload(ctx, file('new'), 'https://s/new');
    await swapUrl(ctx, 'https://s/old', 'https://s/new');
    expect(deletedFiles).toEqual(['old']);
    expect([...rows.values()].map(r => [r.url, r.refs])).toEqual([['https://s/new', 1]]);
  });

  it('swapping a URL for itself never deletes the file', async () => {
    const { ctx, deletedFiles } = fakeCtx();
    await registerUpload(ctx, file('f1'), 'https://s/a');
    await retainUrl(ctx, 'https://s/a');
    await swapUrl(ctx, 'https://s/a', 'https://s/a');
    expect(deletedFiles).toEqual([]);
  });

  it('typed links and legacy files are none of its business', async () => {
    const { ctx, deletedFiles, rows } = fakeCtx();
    await retainUrl(ctx, 'https://unsplash.com/x.jpg');
    await releaseUrl(ctx, 'https://unsplash.com/x.jpg');
    await releaseUrl(ctx, '');
    expect(deletedFiles).toEqual([]);
    expect(rows.size).toBe(0);
  });

  it('the sweep removes only uploads nobody saved within the grace period', async () => {
    const { ctx, deletedFiles, rows } = fakeCtx();
    await registerUpload(ctx, file('abandoned'), 'https://s/abandoned');
    await registerUpload(ctx, file('saved'), 'https://s/saved');
    await retainUrl(ctx, 'https://s/saved');
    const now = Date.now();
    expect(await sweepAbandonedUploads(ctx, now)).toBe(0);
    expect(await sweepAbandonedUploads(ctx, now + ABANDONED_UPLOAD_MS + 1)).toBe(1);
    expect(deletedFiles).toEqual(['abandoned']);
    expect([...rows.values()].map(r => r.url)).toEqual(['https://s/saved']);
  });

  it('replacing an uploaded image on a record releases the previous upload', async () => {
    const { ctx, deletedFiles } = fakeCtx();
    await registerUpload(ctx, file('first'), 'https://s/first');
    await retainUrl(ctx, 'https://s/first');
    await registerUpload(ctx, file('second'), 'https://s/second');
    const updates: Record<string, unknown> = { externalPhoto: 'https://s/second' };
    await reconcileImageUpdate(ctx, { externalPhoto: 'https://s/first' }, updates, 'photo', 'externalPhoto');
    expect(deletedFiles).toEqual(['first']);
  });
});
