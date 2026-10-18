/**
 * Category colour palette.
 *
 * Category colours are stored in the database as Tailwind classes. The -500
 * values below are seen by the compiler in this file; the -700 label shades are
 * derived at runtime and listed in the `@source inline(...)` line of index.css.
 * A colour added here must be added there too, or its label renders without a
 * background in production.
 */

export interface CategoryColor {
  label: string;
  value: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { label: 'Marca', value: 'bg-brand-500' },
  { label: 'Vermelho', value: 'bg-red-500' },
  { label: 'Laranja', value: 'bg-orange-500' },
  { label: 'Âmbar', value: 'bg-amber-500' },
  { label: 'Amarelo', value: 'bg-yellow-500' },
  { label: 'Verde', value: 'bg-green-500' },
  { label: 'Esmeralda', value: 'bg-emerald-500' },
  { label: 'Turquesa', value: 'bg-teal-500' },
  { label: 'Ciano', value: 'bg-cyan-500' },
  { label: 'Azul', value: 'bg-blue-500' },
  { label: 'Índigo', value: 'bg-indigo-500' },
  { label: 'Violeta', value: 'bg-violet-500' },
  { label: 'Roxo', value: 'bg-purple-500' },
  { label: 'Rosa', value: 'bg-pink-500' },
  { label: 'Cinzento', value: 'bg-slate-500' },
];

export const CATEGORY_COLOR_CLASSES = CATEGORY_COLORS.map((c) => c.value);

/** White text on a -500 swatch fails WCAG AA for most hues; labels use the -700 shade. */
const toLabelShade = (value: string) => value.replace(/-500$/, '-700');

export const CATEGORY_LABEL_CLASSES = CATEGORY_COLOR_CLASSES.map(toLabelShade);

const DEFAULT_CATEGORY_COLOR = 'bg-brand-500';

/** Keeps legacy or hand-edited values from rendering as an invisible dot. */
export function categoryColorClass(value?: string | null): string {
  return value && CATEGORY_COLOR_CLASSES.includes(value) ? value : DEFAULT_CATEGORY_COLOR;
}

/** Background for a category label with white text, same hue as its dot. */
export function categoryLabelClass(value?: string | null): string {
  return toLabelShade(categoryColorClass(value));
}
