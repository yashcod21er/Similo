import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'dark' | 'light' | 'outline' | 'outline-dark' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/* Flat, rounded-rectangle buttons. `primary` (crimson) is the one main action
   on a screen; `dark` is the strong neutral action; outlines are secondary. */
const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-crimson text-white hover:bg-crimson-dark',
  dark: 'bg-midnight text-white hover:bg-slate-deep',
  light: 'bg-white text-ink ring-1 ring-line hover:bg-paper',
  outline: 'border border-line-strong bg-white text-ink hover:border-ink/40 hover:bg-paper',
  'outline-dark': 'border border-white/25 text-white hover:border-white/50 hover:bg-white/5',
  ghost: 'text-ink hover:bg-ink/[0.05]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
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
