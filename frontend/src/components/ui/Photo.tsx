import { cn } from '@/lib/cn';

interface PhotoProps {
  /**
   * Path without the size suffix, e.g. `/images/core/document-review`.
   * Expects `<src>-800.webp` and `<src>-1600.webp` in `frontend/public`
   * (credits in docs/IMAGE-CREDITS.md).
   */
  src: string;
  /** Describe what the photo shows; use '' only for purely decorative photos. */
  alt: string;
  /** Intrinsic size of the 1600 px file, so the browser reserves space (no layout shift). */
  width: number;
  height: number;
  /** Which width the image occupies, for choosing the 800 or 1600 file. */
  sizes?: string;
  /** Above-the-fold photos load immediately; everything else loads lazily. */
  priority?: boolean;
  /**
   * v6 house look: `duotone` is night, burnt orange and cream with film grain; `halftone` is the
   * same with a printed dot screen. Needs `PhotoFilters` (rendered once by `SiteLayout`); without
   * it the photo simply shows plain. Default `none`, so a screenshot of the product stays honest;
   * `PhotoFrame` (marketing pages) defaults to `duotone`.
   */
  treatment?: PhotoTreatment;
  className?: string;
}

export type PhotoTreatment = 'duotone' | 'halftone' | 'none';

/** A real photograph, served as local WebP in two widths. */
export function Photo({
  src,
  alt,
  width,
  height,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority = false,
  treatment = 'none',
  className,
}: PhotoProps) {
  return (
    <img
      src={`${src}-1600.webp`}
      srcSet={`${src}-800.webp 800w, ${src}-1600.webp 1600w`}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn(
        'h-full w-full object-cover',
        treatment === 'duotone' && 'photo-duotone',
        treatment === 'halftone' && 'photo-halftone',
        className,
      )}
    />
  );
}
