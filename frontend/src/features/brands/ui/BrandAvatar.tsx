import { useState } from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

/**
 * The brand's first logo (fetched with the signed-in cookie, so it is only ever an <img>), or its
 * initials when there is no logo or it can't be loaded.
 */
export function BrandAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showLogo = logoUrl !== null && failedUrl !== logoUrl;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[15px] font-semibold text-ink ring-1 ring-line',
        showLogo ? 'bg-white' : 'bg-paper',
        className,
      )}
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(logoUrl)}
          className="size-full object-contain p-1.5"
        />
      ) : (
        <span aria-hidden>{initials(name) || '?'}</span>
      )}
    </span>
  );
}
