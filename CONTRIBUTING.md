# Contributing

Thank you for considering a contribution to the Community Platform.

## Getting started

### Prerequisites

- Node.js ^20.19.0 or >= 22.12.0 (required by Vite 8), npm >= 9
- A free [Convex](https://convex.dev) account
- A [Google Gemini API key](https://aistudio.google.com/apikey) (optional, for AI features)

### Setup

```bash
# 1. Fork, then clone your fork
git clone https://github.com/YOUR_USERNAME/community-platform.git
cd community-platform
git remote add upstream https://github.com/brunobola-portfolio/community-platform.git

# 2. Install and configure
npm install
cp .env.example .env.local
npx convex dev --once            # creates a Convex project, sets VITE_CONVEX_URL

# 3. Optional: AI features
npx convex env set GEMINI_API_KEY "AIza..."

# 4. Run (2 terminals)
npx convex dev                   # backend — also regenerates convex/_generated
npm run dev                      # frontend at http://localhost:3000
```

Note: `convex/_generated/` is committed (Convex's recommendation, so a fresh clone
type-checks). Never edit it by hand — it regenerates via `npx convex codegen` or
automatically while `npx convex dev` runs.

## Workflow

1. Create a branch: `feature/...`, `fix/...`, `docs/...`, `refactor/...`, or `chore/...`
2. Make your changes following the [standards below](#coding-standards)
3. Verify — there is no test suite; these are the gates:

   ```bash
   npm run type-check
   npm run lint
   npm run build
   ```

4. Commit using Conventional Commits: `<type>(<scope>): <subject>`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`
   - Examples: `feat(events): add ICS calendar export`, `fix(chat): handle ERR_QUOTA token`
5. Push to your fork and open a Pull Request against `main`

## Coding standards

The canonical, always-current reference is [AGENTS.md](AGENTS.md) — the same rules bind
human and AI contributors. The essentials:

### TypeScript / React

- Function components only, PascalCase, props interface named `{ComponentName}Props`
- Never `any` — prefer `unknown` or inference; type imports: `import type { X } from './types'`
- Shared interfaces live in `types.ts`; `.tsx` for components, `.ts` for utilities
- Import order: React, third-party, local components, hooks/context, types
- Files < 300 lines, functions < 50 lines
- No nested component definitions, no conditional hooks, no direct state mutation

### Convex backend

- Admin mutations start with `await requireAdmin(ctx)`; user mutations with `await requireAuth(ctx)`
- `.withIndex()` instead of `.filter()`; `v.union(v.literal(...))` for enums
- `??` for boolean defaults, never `||`
- Validate inputs with `validateMaxLength()` / `validateEmail()` from `convex/lib/validation.ts`
- Rate-limit public mutations via `convex/lib/rateLimit.ts`
- Cascade delete and storage cleanup via `convex/lib/cascade.ts`
- Never return secrets from queries — provider keys are write-only (`has*ApiKey` flags)

### Styling

- Tailwind CSS exclusively — zero inline styles; `cn()` from `utils/cn.ts` for conditionals
- Every color that assumes a dark background needs a light-theme pair
  (`bg-white dark:bg-dark-surface`, `text-slate-900 dark:text-white`)
- Interactive elements carry `focus-visible:ring-2 focus-visible:ring-brand-500`

### White-label rule

Never hardcode an association's identity in components or prompts — runtime identity comes
from `settings` (database-first). ARCVA content in the repository is seed/demo data. See
[docs/WHITE-LABEL.md](docs/WHITE-LABEL.md).

### Comments

Explain WHY, not WHAT. Technical register, no emojis, no exclamation marks. JSDoc only for
complex type definitions. UI copy is European Portuguese (pt-PT); code and comments are English.

## Pull request checklist

- [ ] `npm run type-check`, `npm run lint` and `npm run build` all pass
- [ ] No `any`, no inline styles, no hardcoded identity
- [ ] Admin/user mutations carry their auth guard on the first line
- [ ] UI changes verified in both light and dark themes
- [ ] Documentation updated if behavior or commands changed

## Reporting bugs and suggesting features

Open an issue at [github.com/brunobola-portfolio/community-platform/issues](https://github.com/brunobola-portfolio/community-platform/issues)
with steps to reproduce (bugs) or the problem being solved (features). For security
vulnerabilities, do **not** open a public issue — see [SECURITY.md](SECURITY.md).

## Code of conduct

Be kind, professional, and constructive. Assume good faith; review the code, not the person.
The full text is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
