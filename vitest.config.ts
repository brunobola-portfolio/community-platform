import { defineConfig } from 'vitest/config';

/**
 * Separate from vite.config.ts on purpose: the app config carries plugins that
 * transform HTML and write into dist/, which a test run has no business doing.
 *
 * What belongs here is logic that is subtle and fails quietly — token bucket
 * arithmetic, excerpt truncation, the CSP the browser enforces, the release
 * guard. Rendering and database behaviour are covered by running the app, not
 * by mocking Convex.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
