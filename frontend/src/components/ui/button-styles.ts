import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'dark' | 'light' | 'outline' | 'outline-dark' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/* Design system v4. Pill buttons with a hint of depth: a 1 px top highlight and a soft
   shadow on filled buttons. `primary` (burnt orange, white text) is the one main action on
   a screen; `dark` is the strong neutral action; outlines are secondary. Hover changes
   colour only; pressing nudges the button down by 1 px (transform). */
const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(21_19_15/0.18),0_6px_16px_-6px_rgb(194_80_10/0.55)] hover:bg-accent-ink',
  dark: 'bg-night text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_1px_2px_rgb(21_19_15/0.2)] hover:bg-night-raised',
  light: 'bg-white text-ink shadow-[0_1px_2px_rgb(21_19_15/0.08)] ring-1 ring-line hover:bg-cream',
  outline: 'border border-line-strong bg-white/70 text-ink hover:border-ink/40 hover:bg-white',
  'outline-dark': 'border border-cream/25 text-cream hover:border-cream/50 hover:bg-cream/[0.06]',
  ghost: 'text-ink hover:bg-ink/[0.05]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
};

/** Class names for a button-styled element (shared by <Button> and <ButtonLink>). */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
}) {
  return cn(base, variants[variant], sizes[size], className);
}
