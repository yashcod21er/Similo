import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" fill="#0B1020" />
      <path
        d="M16 6.5 9 9.1v5.6c0 4.6 3 8.5 7 9.8 4-1.3 7-5.2 7-9.8V9.1l-7-2.6Z"
        fill="none"
        stroke="#D92F48"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 11v9.5c2.2-1 3.6-3.2 3.6-5.8v-2.4L16 11Z" fill="#E98A91" />
    </svg>
  );
}

export function Logo({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('size-8', tone === 'dark' && 'rounded-[9px] ring-1 ring-white/15')} />
      <span
        className={cn(
          'text-[16px] font-semibold tracking-[-0.03em]',
          tone === 'dark' ? 'text-white' : 'text-ink',
        )}
      >
        Similo
      </span>
    </span>
  );
}
