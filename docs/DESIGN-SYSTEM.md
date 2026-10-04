# Design System

Referência visual da plataforma. Fonte de verdade dos tokens:
[tailwind.config.ts](../tailwind.config.ts) e [index.css](../index.css). Estética:
glassmorphism sobre neutros tingidos pela marca, com uma cor brand e uma cor de destaque
por instância (escolhidas no backoffice, ver [Marca dinâmica](#marca-dinâmica)).

## Temas

- `darkMode: 'class'` com **escuro por default** — [hooks/useTheme.ts](../hooks/useTheme.ts)
  aplica a classe antes do primeiro paint (script inline no `index.html` evita flash).
- **Regra de pares**: toda a cor que assume fundo escuro precisa do par light —
  `bg-white dark:bg-dark-surface`, `text-slate-900 dark:text-white`,
  `border-slate-900/10 dark:border-white/10`.
- **Exceções dark-only** (iguais nos dois temas): texto sobre fotografias com overlay
  preto, o cartão de sócio 3D, e o backoffice `/admin` + `/setup`.
- **Mudança de tema suave**: `toggleTheme` usa a View Transitions API (cross-fade de 280ms do
  snapshot da página, sem reflow); sem a API ou com `prefers-reduced-motion` muda na hora.

## Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `brand-600` | `rgb(var(--brand-600))` | A cor escolhida pela instância (por omissão `#4f46e5`); ícones, glows |
| `brand-700` | `rgb(var(--brand-700))` | Botões com texto branco e texto da marca em light (AA garantido) |
| `brand-400` / `brand-500` | `rgb(var(--brand-400))` / `…500` | Texto da marca em dark / ícones, rings de foco, pontos |
| `brand-display` | `rgb(var(--brand-display))` | Palavras de destaque em **títulos grandes** e início dos gradientes de título; troca sozinho entre temas |
| `brand-50…950` | variáveis `--brand-*` | Fundos suaves, borders, hovers |
| `accent-50…950` | variáveis `--accent-*` | Cor de destaque da instância: `accent-500` é a cor crua (glows, faixas), `accent-600`/`accent-400` o fim dos gradientes de título em light/dark, `accent-700`/`accent-300` texto |
| `slate-50…950` | variáveis `--neutral-*` | Neutros tingidos pela marca (texto e fundos; light bg `slate-50`) |
| `dark-bg` | `--neutral-950` | Fundo dark |
| `dark-surface` | `--neutral-900` | Cartões e superfícies em dark |
| `dark-border` | `--neutral-50` a 8% | Borders em dark |
| `accent-gold` | `#fbbf24` fixo | Só semântica: badge «Destaque», tiers ouro (igual em todas as instâncias) |
| `accent-glow` | `rgb(var(--brand-600) / 0.5)` | Glows decorativos |

Regras de contraste: texto da marca em dark é `brand-400`, em light `brand-700`; palavras de
destaque em títulos grandes (24px ou mais) usam `brand-display`, nunca `brand-400` (que é
clareado para 4.5:1 e transforma um vermelho em salmão).

Gradientes de título: `from-brand-display to-accent-600 dark:to-accent-400`. Decoração dourada
nova usa `accent-*` (segue a cor de destaque da instância); `amber-*` fica para avisos e
estados («Reservado», orçamento, inscrições pendentes). O tom "info" das notificações usa
`brand-500/10`.

Cores de categoria (eventos e notícias) vêm da BD como classes Tailwind: a paleta
autorizada é `utils/categoryColors.ts`, importada pelo `safelist` do
[tailwind.config.ts](../tailwind.config.ts). Sem essa entrada a classe não é compilada
e o ponto de cor fica invisível — nunca gravar uma classe fora da paleta.

## Tipografia

| Classe | Variável | Por omissão | Papel |
|--------|----------|-------------|-------|
| `font-sans` | `--font-body` | **Geist** | Corpo, UI, dados |
| `font-serif` | `--font-heading` | **Playfair Display** | Headings display, títulos de página, marca no footer |
| `font-mono` | `--font-mono` | **Geist Mono** | Eyebrows, datas, labels do backoffice, números |

A família de cada papel é escolhida por instância numa lista curada
([utils/brandFonts.ts](../utils/brandFonts.ts); mono: Geist Mono, JetBrains Mono, IBM Plex
Mono, DM Mono, Space Mono). O `index.html` carrega só as três por omissão (com `preconnect`);
o `BrandTheme` acrescenta um único `<link>` css2 quando a instância escolhe outras. Cada
família tem uma pilha de fallback genérica (serif / sans-serif / monospace), usada enquanto
o ficheiro carrega ou se o Google Fonts estiver inacessível. O CSP permite apenas `fonts.googleapis.com`/`fonts.gstatic.com`
e `'self'`.

## Forma e espaçamento

- Border radius: `rounded-xl` (12px) para controles, `rounded-2xl` (16px) para cartões,
  `rounded-3xl` (24px) para superfícies grandes/modais.
- Spacing: escala Tailwind restrita a 4, 6, 8, 12, 16, 24.
- Glassmorphism: `backdrop-blur-md` + fundo translúcido + border `white/10` (dark) ou
  `slate-900/10` (light).

## Motion

| Animação | Uso |
|----------|-----|
| `animate-fade-in-up` | Entrada de modais e mensagens de chat (0.3s, ease-out expo) |
| `animate-float` | Elementos decorativos do hero (6s) |
| `animate-marquee` | Faixa de parceiros (40s linear) |
| `animate-pulse-slow` | Indicadores de estado (4s) |

`prefers-reduced-motion: reduce` colapsa TODA a animação e transição
(regra global em `index.css`) — motion novo não precisa de tratamento extra, mas não
pode transmitir informação essencial.

## Acessibilidade (contrato)

- Foco visível em todos os interativos: `focus-visible:ring-2 focus-visible:ring-brand-500`
  (+ `focus-visible:outline-none`). Nunca remover o ring sem substituto.
- `aria-label` obrigatório em botões só-ícone; navegação por teclado com `onKeyDown`
  (Enter/Space) em elementos clicáveis não-nativos.
- HTML semântico primeiro; landmarks nas páginas públicas.

## Componentes partilhados (`components/ui/`)

| Componente | Contrato |
|-----------|----------|
| `Lightbox` | Único lightbox do site, controlado por index; setas + teclado; usado em Galeria, Equipa, História |
| `Button` / `Badge` / `Input` | Base atómica; variantes por props, nunca por CSS ad-hoc |
| `Modal` (`components/ui/Modal.tsx`) | Único diálogo do portal. Slots: `icon`, `eyebrow`, `title`, `description`, corpo com scroll e `footer` fixo com as ações. Nunca recriar cabeçalho, banner informativo ou barra de ações dentro do corpo — passar pelos slots; formulários usam `<form id>` + `<Button form=…>` para o botão viver no footer |
| `EmptyState` | Estado vazio partilhado (listas e diálogos), claro e escuro |
| `RichTextEditor` / `MediaStudio` / `FormBuilder` | Editores do admin (`pages/admin/editors/`) |
| `AIModal` + `ai/ChatMessage` | Assistente ancorado em baixo à direita (bottom sheet em mobile): shell/estado no modal, turnos no `ChatMessage`; identidade visual `Sparkles` + gradiente brand |
| `.custom-scrollbar` | Scrollbar fina temática para corpos de modal e rails horizontais |
| `.perspective-1000` | Suporte 3D do cartão de sócio |

Padrões proibidos: inline `style={{}}`, cores fora dos tokens, componentes aninhados,
`ring-*` de foco ad-hoc fora do padrão acima.

## Backoffice (`/admin`)

Dark-only por definição: a raiz tem a classe `dark`, o que faz os componentes partilhados
seguirem o tema escuro independentemente da preferência do visitante.

| Peça | Contrato |
|------|----------|
| `AdminPageHeader` | Título, contagem, uma linha a explicar o que a secção controla no portal, ação primária e atalho "Ver site" |
| `EntityList` | Lista única do backoffice: toolbar (pesquisa `/`, filtros com contagens, ordenação, contador), tabela desktop com scroll horizontal, cartões mobile e dois estados vazios. As ações (duplicar/editar/apagar) são iguais em desktop e mobile |
| `EmptyState` | Coleção vazia, com ação de criação quando existe |
| `Field` | Par label + controlo do backoffice: id gerado, `htmlFor`, asterisco nos obrigatórios e `hint` opcional |
| `Toast` | `success` / `error` / `info`, com `role` adequado, fecho manual e erros a durar mais |
| `DeleteConfirmDialog` | Confirmação com a consequência real (cascatas, storage) e estado ocupado |
| `AdminFormModal` | Diálogo partilhado com barra de ações fixa, aviso de alterações por guardar e mensagens de erro traduzidas |

Formulários por entidade vivem em `pages/admin/forms/` (conteúdo, pessoas, sistema);
o modal é só a casca e o encaminhamento.

## Marca dinâmica

Os tokens `brand-*`, `accent-*`, `slate-*`, `dark-*` e `font-*` do
[tailwind.config.ts](../tailwind.config.ts) são variáveis CSS
(`rgb(var(--brand-500) / <alpha-value>)`, com canais RGB separados por espaço para os
modificadores `/10`, `/20` continuarem a funcionar). Quem as escreve:

1. **`index.css` `:root`** — valores das predefinições (brand `#4f46e5`, destaque automático,
   Playfair Display / Geist / Geist Mono), para o primeiro paint sem JS. Os testes
   `tests/brandTheme.test.ts` e `tests/brandPalette.test.ts` falham se divergirem do gerador.
2. **`applyCachedBrand()`** (`index.tsx`) — a última marca vista neste browser (cor, destaque,
   três fontes), antes do React montar; uma cache de uma versão antiga é lida campo a campo.
3. **`components/BrandTheme.tsx`** — montado uma vez acima do router (portal, `/admin` e
   `/setup`): aplica `brandColor`/`accentColor`/`fontHeading`/`fontBody`/`fontMono` em
   `document.documentElement`, o `<link>` das fontes e a `meta theme-color` (brand-700).

O `brand-display` é o único token que depende do tema: o `BrandTheme` escreve
`--brand-display-light` e `--brand-display-dark`, e o `index.css` escolhe um em `:root`/`.dark`.
Dentro de um contentor com variáveis próprias (a pré-visualização do backoffice), as classes
`brand-scope-light`/`brand-scope-dark` voltam a resolvê-lo.

**Como as escalas são geradas** (módulos em `utils/`, todos puros e testados):

- `oklch.ts` — conversões sRGB ↔ OKLab ↔ OKLCH e *gamut clamp* por redução de croma (a
  luminosidade e o matiz nunca mudam ao trazer uma cor para dentro do sRGB).
- `colorScale.ts` — escada OKLCH em volta de um passo âncora: matiz fixo, luminosidade para
  cima até ~0.985 e para baixo até um piso de 0.16, croma moldado por passo como nas paletas
  Tailwind (tintas perdem croma depressa, sombras mantêm-no). As correções de contraste andam
  só na luminosidade, em passos de 0.004.
- `brandPalette.ts` — `brand-*` com âncora no 600 (a cor escolhida, byte a byte se já cumprir),
  700 abaixo do 600 corrigido e 800–950 a partir do 700 corrigido. Para `#df3d32`: 400
  `#f87e6f`, 500 `#ef584a`, 800 `#9d1d17`, 950 `#490403` (coral/vermelho, nunca rosa).
- `brandNeutrals.ts` — para cada passo do slate Tailwind, a cor com o matiz da marca, croma
  = 45% do croma do slate × intensidade da marca (0 abaixo de C 0.03, total a partir de C 0.12),
  e luminância WCAG **igual** à do slate (bissecção). Marcas cinzentas, pretas ou brancas dão
  cinzento puro.
- `brandAccent.ts` — `accent-*` com a cor crua no 500. Sem cor guardada: dourado `#fbbf24`;
  se a marca já é dourada/laranja (matiz a menos de 35° do dourado), um coral análogo
  (matiz −55°), porque um complementar faria os gradientes passar por cinzento.

Garantias (com folga: 4.6 e 3.05; superfícies escuras = `dark-bg` e `dark-surface` da própria
marca; claras = branco e `slate-50`):

| Garantia | Limiar | Correção |
|----------|--------|----------|
| Texto branco em `brand-700` e `brand-700` sobre branco / tinta `brand-100` | ≥ 4.5:1 | escurece o 700 |
| Texto branco grande em `brand-600` | ≥ 3:1 | escurece o 600 |
| `brand-400` como texto sobre as superfícies escuras (e com tinta `brand-500/15`) | ≥ 4.5:1 | clareia o 400 |
| `brand-display` em dark: a cor escolhida, se chegar | ≥ 3:1 | clareia no mesmo matiz |
| `brand-display` em light: o `brand-600` sobre branco e `slate-50` | ≥ 3:1 | escurece |
| `accent-600` sobre as superfícies claras / `accent-700` | ≥ 3:1 / ≥ 4.5:1 | escurece |
| `accent-400` sobre as superfícies escuras | ≥ 4.5:1 | clareia |
| Neutros: cada `slate-N` com a luminância do slate Tailwind | arredondamento | — |
| Escalas monótonas (cada passo nunca mais claro que o anterior) | — | reordena |

Consequência para quem escreve UI: **texto da marca em light é `text-brand-700`** (nunca
600/500 em texto normal), **em dark é `text-brand-400`**, e botões com texto branco usam
`bg-brand-700` (hover `bg-brand-800`). `brand-500` e `brand-600` são para ícones, rings,
glows, gradientes e títulos grandes. Cores fixas da marca em classes arbitrárias
(`shadow-[...rgba(...)]`) escrevem-se com a variável: `rgb(var(--brand-600)/0.3)`.

Só `accent-gold` e as cores semânticas (`amber`, `emerald`, `red`) são fixas da plataforma.
Ver [WHITE-LABEL.md](WHITE-LABEL.md) para o resto do branding.
