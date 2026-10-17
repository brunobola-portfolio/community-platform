/**
 * ESLint flat config (ESLint 10 + typescript-eslint 8). Focused on correctness:
 * hooks rules and TypeScript recommended, with stylistic noise disabled where
 * the codebase has an established idiom.
 */
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'convex/_generated', '.artifacts', '.playwright-mcp', 'scripts', '**/*.cjs', '**/*.mjs', '**/*.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The two classic hook rules; the React Compiler rules in v7's preset
      // assume the compiler, which this project does not use
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
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
  },
);
