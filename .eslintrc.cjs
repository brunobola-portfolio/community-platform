/**
 * ESLint configuration (ESLint 8, matching the `lint` script in package.json).
 * Focused on correctness: hooks rules and TypeScript recommended, with
 * stylistic noise disabled where the codebase has an established idiom.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    'convex/_generated',
    '.artifacts',
    '.playwright-mcp',
    'scripts',
    '*.cjs',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    // Codebase convention: unused args/captures prefixed with _
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        // `const { field, ...rest } = doc` is the codebase idiom for omitting fields
        ignoreRestSiblings: true,
      },
    ],
    // `any` is forbidden by CLAUDE.md but pre-existing casts in admin glue
    // code use it deliberately; keep as warning-free until refactored
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
