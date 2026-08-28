/**
 * Category colour palette.
 *
 * Category colours are stored in the database as Tailwind classes, so the JIT
 * compiler never sees them in source: tailwind.config.ts imports this list into
 * its safelist. Any colour offered to an admin must live here, or the swatch
 * renders transparent in production.
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

const DEFAULT_CATEGORY_COLOR = 'bg-brand-500';

/** Keeps legacy or hand-edited values from rendering as an invisible dot. */
export function categoryColorClass(value?: string | null): string {
  return value && CATEGORY_COLOR_CLASSES.includes(value) ? value : DEFAULT_CATEGORY_COLOR;
}
