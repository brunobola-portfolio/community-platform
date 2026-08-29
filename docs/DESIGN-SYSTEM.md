# Design System

Referência visual da plataforma. Fonte de verdade dos tokens:
[tailwind.config.ts](../tailwind.config.ts) e [index.css](../index.css). Estética:
glassmorphism sobre neutros slate, com uma cor brand quente por instância.

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
| `brand-600` | `#df3d32` | Cor principal em light (vermelho do logo ARCVA — trocar por instância) |
| `brand-400` / `brand-500` | `#ef7a70` / `#e65649` | Cor principal em dark (contraste sobre fundo escuro) |
| `brand-50…950` | escala completa | Fundos suaves, borders, hovers |
| `dark-bg` | `#020617` | Fundo dark (slate-950); também `theme-color`/manifest |
| `dark-surface` | `#0f172a` | Cartões e superfícies em dark |
| `dark-border` | `rgba(255,255,255,0.08)` | Borders em dark |
| `accent-gold` | `#fbbf24` | Destaques (quota paga, tiers ouro) |
| `accent-glow` | `rgba(223,61,50,0.5)` | Glows decorativos |
| Neutrals | escala `slate` | Texto e fundos (light bg: `slate-50`) |

Regra de contraste: em dark, a brand para texto é `brand-400`; `brand-600` é para light.

Cores de categoria (eventos e notícias) vêm da BD como classes Tailwind: a paleta
autorizada é `utils/categoryColors.ts`, importada pelo `safelist` do
[tailwind.config.ts](../tailwind.config.ts). Sem essa entrada a classe não é compilada
e o ponto de cor fica invisível — nunca gravar uma classe fora da paleta.

## Tipografia

| Família | Papel |
|---------|-------|
| **Geist** (`font-sans`) | Corpo, UI, dados |
| **Playfair Display** (`font-serif`) | Headings display, títulos de página, marca no footer |

Carregadas via Google Fonts com `preconnect`; o CSP permite apenas
`fonts.googleapis.com`/`fonts.gstatic.com` e `'self'`.

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
| `Toast` | `success` / `error` / `info`, com `role` adequado, fecho manual e erros a durar mais |
| `DeleteConfirmDialog` | Confirmação com a consequência real (cascatas, storage) e estado ocupado |
| `AdminFormModal` | Diálogo partilhado com barra de ações fixa, aviso de alterações por guardar e mensagens de erro traduzidas |

Formulários por entidade vivem em `pages/admin/forms/` (conteúdo, pessoas, sistema);
o modal é só a casca e o encaminhamento.

## White-label

A escala `brand` é o único ponto de cor por instância — trocar em
[tailwind.config.ts](../tailwind.config.ts) e manter os neutros slate. Ver
[WHITE-LABEL.md](WHITE-LABEL.md) para o resto do branding.
