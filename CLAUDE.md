# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Específico do Claude Code

- Comunicar com o utilizador em **português (pt-PT)**. Resumos concisos e pragmáticos —
  ir direto ao resultado, sem preâmbulos.
- Depois de mudar o schema ou módulos Convex, regenerar `convex/_generated` com
  `npx convex codegen` (está commitado — o diff gerado acompanha o commit).
- Alterações visuais: validar com `npm run dev` (porta 3000) e fechar com
  `npm run type-check && npm run lint && npm run build`.
- Identidade nova em UI ou prompts vem SEMPRE de `settings` (BD-first) — nunca hardcodar
  o nome de uma associação; ver `docs/WHITE-LABEL.md`.
- Contacto técnico do projeto: **`bruno@bolalabs.pt`** (BolaLabs); contacto da instância
  demo ARCVA: `geral@arcva.pt`.
- **Entregáveis longos vão para Artifact.** Guias, runbooks, relatórios de auditoria ou
  planos com mais de ~60 linhas publicam-se como Artifact (página) e guardam-se também em
  `.artifacts/docs/` (cópia local); na resposta fica só o link e um resumo de 5 linhas.
  Textos curtos, decisões e respostas diretas ficam na conversa — o Artifact só quando
  poupa leitura e tokens, não por defeito.
