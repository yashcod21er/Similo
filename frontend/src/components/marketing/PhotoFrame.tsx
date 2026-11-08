import { Photo } from '@/components/ui/Photo';
import { cn } from '@/lib/cn';

/**
 * A real photograph in the standard frame: rounded corners, a 1 px ring, no
 * shadow, no overlays. Pass the same props as `Photo`, plus an optional
 * `ratio` class (default 4:3) and an optional caption.
 */
export function PhotoFrame({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  ratio = 'aspect-[4/3]',
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
  className?: string;
  imageClassName?: string;
  caption?: string;
}) {
  return (
    <figure className={className}>
      <div className={cn('overflow-hidden rounded-2xl bg-cream-deep ring-1 ring-ink/5', ratio)}>
        <Photo
          src={src}
          alt={alt}
          width={width}
          height={height}
          {...(sizes ? { sizes } : {})}
          {...(priority ? { priority } : {})}
          {...(imageClassName ? { className: imageClassName } : {})}
        />
      </div>
      {caption && <figcaption className="mt-3 text-[13px] text-muted">{caption}</figcaption>}
    </figure>
  );
}
