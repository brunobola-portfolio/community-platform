# Design System

Referência visual da plataforma. Fonte de verdade dos tokens:
[tailwind.config.ts](../tailwind.config.ts) e [index.css](../index.css). Estética:
glassmorphism sobre neutros slate, com uma cor brand por instância (escolhida no
backoffice, ver [Marca dinâmica](#marca-dinâmica)).

## Temas

- `darkMode: 'class'` com **escuro por default** — [hooks/useTheme.ts](../hooks/useTheme.ts)
  aplica a classe antes do primeiro paint (script inline no `index.html` evita flash).
- **Regra de pares**: toda a cor que assume fundo escuro precisa do par light —
  `bg-white dark:bg-dark-surface`, `text-slate-900 dark:text-white`,
  `border-slate-900/10 dark:border-white/10`.
- **Exceções dark-only** (iguais nos dois temas): texto sobre fotografias com overlay
  preto, o cartão de sócio 3D, e o backoffice `/admin` + `/setup`.

## Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `brand-600` | `rgb(var(--brand-600))` | A cor escolhida pela instância (por omissão `#4f46e5`); títulos grandes, gradientes |
| `brand-700` | `rgb(var(--brand-700))` | Botões com texto branco e texto da marca em light (AA garantido) |
| `brand-400` / `brand-500` | `rgb(var(--brand-400))` / `…500` | Texto da marca em dark / ícones, rings de foco, pontos |
| `brand-50…950` | variáveis `--brand-*` | Fundos suaves, borders, hovers |
| `dark-bg` | `#020617` | Fundo dark (slate-950); também `theme-color`/manifest |
| `dark-surface` | `#0f172a` | Cartões e superfícies em dark |
| `dark-border` | `rgba(255,255,255,0.08)` | Borders em dark |
| `accent-gold` | `#fbbf24` | Destaques (quota paga, tiers ouro) |
| `accent-glow` | `rgb(var(--brand-600) / 0.5)` | Glows decorativos |
| Neutrals | escala `slate` | Texto e fundos (light bg: `slate-50`) |

Regra de contraste: em dark, a brand para texto é `brand-400`; `brand-600` é para light.

A segunda cor de destaque é o dourado `accent-gold` (gradientes de título `from-brand-600
to-accent-gold`, glows, faixa superior dos cartões). Não existe roxo/azul na paleta pública;
o tom "info" das notificações usa `brand-500/10`.

Cores de categoria (eventos e notícias) vêm da BD como classes Tailwind: a paleta
autorizada é `utils/categoryColors.ts`, importada pelo `safelist` do
[tailwind.config.ts](../tailwind.config.ts). Sem essa entrada a classe não é compilada
e o ponto de cor fica invisível — nunca gravar uma classe fora da paleta.

## Tipografia

| Classe | Variável | Por omissão | Papel |
|--------|----------|-------------|-------|
| `font-sans` | `--font-body` | **Geist** | Corpo, UI, dados |
| `font-serif` | `--font-heading` | **Playfair Display** | Headings display, títulos de página, marca no footer |

A família de cada papel é escolhida por instância numa lista curada
([utils/brandFonts.ts](../utils/brandFonts.ts)). O `index.html` carrega só as duas por
omissão (com `preconnect`); o `BrandTheme` acrescenta um único `<link>` css2 quando a
instância escolhe outras. O CSP permite apenas `fonts.googleapis.com`/`fonts.gstatic.com`
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

Os tokens `brand-*`, `font-sans` e `font-serif` do
[tailwind.config.ts](../tailwind.config.ts) são variáveis CSS
(`rgb(var(--brand-500) / <alpha-value>)`, com canais RGB separados por espaço para os
modificadores `/10`, `/20` continuarem a funcionar). Quem as escreve:

1. **`index.css` `:root`** — valores da cor por omissão (`#4f46e5`), para o primeiro paint
   sem JS. O teste `tests/brandPalette.test.ts` falha se divergirem do gerador.
2. **`applyCachedBrand()`** (`index.tsx`) — a última marca vista neste browser, antes do
   React montar.
3. **`components/BrandTheme.tsx`** — montado uma vez acima do router (portal, `/admin` e
   `/setup`): aplica `settings.brandColor`/`fontHeading`/`fontBody` em
   `document.documentElement`, o `<link>` das fontes e a `meta theme-color` (brand-700).

**Como a escala é gerada** ([utils/brandPalette.ts](../utils/brandPalette.ts)): 50–500 são a
cor misturada com branco (6% a 82% de cor), 600 é a cor escolhida, 700 é a cor com 16% de
preto e 800–950 escurecem a partir do 700 corrigido. Depois, correções por passos pequenos
(para manter o tom o mais perto possível da escolha):

| Garantia | Limiar | Correção |
|----------|--------|----------|
| Texto branco em `brand-700` e `brand-700` sobre branco / tinta `brand-100` | ≥ 4.5:1 | escurece o 700 |
| Texto branco grande em `brand-600` | ≥ 3:1 | escurece o 600 |
| `brand-400` como texto sobre `dark-surface` (e com tinta brand) | ≥ 4.5:1 | clareia o 400 |
| Escala monótona (cada passo nunca mais claro que o anterior) | — | reordena |

Consequência para quem escreve UI: **texto da marca em light é `text-brand-700`** (nunca
600/500 em texto normal), **em dark é `text-brand-400`**, e botões com texto branco usam
`bg-brand-700` (hover `bg-brand-800`). `brand-500` e `brand-600` são para ícones, rings,
glows, gradientes e títulos grandes. Cores fixas da marca em classes arbitrárias
(`shadow-[...rgba(...)]`) escrevem-se com a variável: `rgb(var(--brand-600)/0.3)`.

Os neutros slate, `accent-gold` e o fundo escuro são fixos da plataforma. Ver
[WHITE-LABEL.md](WHITE-LABEL.md) para o resto do branding.
