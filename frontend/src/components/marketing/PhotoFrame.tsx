import { Photo, type PhotoTreatment } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';

/**
 * A real photograph in the standard frame (v6): rounded-2xl corners, a hairline ring and the
 * soft layered card shadow. Photos get the house treatment by default (`duotone`: night,
 * burnt orange and cream with film grain; `halftone` adds a printed dot screen; `none` keeps
 * the plain photo). Pass the same props as `Photo`, plus an optional `ratio` class (default
 * 4:3) and an optional caption.
 */
export function PhotoFrame({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  ratio = 'aspect-[4/3]',
  treatment = 'duotone',
  reveal = false,
  className,
  imageClassName,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  /** Tailwind aspect class: `aspect-[4/3]`, `aspect-[3/2]` or `aspect-[16/9]`. */
  ratio?: string;
  treatment?: PhotoTreatment;
  /** Uncover the photo with a clip-path wipe the first time it scrolls into view. */
  reveal?: boolean;
  className?: string;
  imageClassName?: string;
  caption?: string;
}) {
  const frame = (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-night shadow-card ring-1 ring-ink/[0.06]',
        ratio,
      )}
    >
      <Photo
        src={src}
        alt={alt}
        width={width}
        height={height}
        treatment={treatment}
        {...(sizes ? { sizes } : {})}
        {...(priority ? { priority } : {})}
        {...(imageClassName ? { className: imageClassName } : {})}
      />
    </div>
  );
  return (
    <figure className={className}>
      {reveal ? <Reveal variant="wipe">{frame}</Reveal> : frame}
      {caption && <figcaption className="text-micro mt-3 text-muted">{caption}</figcaption>}
    </figure>
  );
}
