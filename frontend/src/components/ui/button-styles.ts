import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'dark' | 'light' | 'outline' | 'outline-dark' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/* Design system v6. Crisp pill buttons: flat fills, no glow and no coloured shadow.
   `primary` (burnt orange, white text) is the one main action on a screen; `dark` is the strong
   neutral action; outlines are secondary. Hover changes colour only (150 ms); pressing nudges
   the button down by 1 px (transform). */
const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-ink',
  dark: 'bg-night text-cream hover:bg-night-raised',
  light: 'bg-white text-ink ring-1 ring-line hover:bg-cream',
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
