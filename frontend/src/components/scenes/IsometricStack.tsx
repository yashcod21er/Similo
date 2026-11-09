import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { EASE_OUT_EXPO_CSS } from '@/components/motion/easing';
import { useInView, usePrefersReducedMotion } from '@/components/motion/hooks';
import { cn } from '@/lib/cn';

/*
 * An isometric stack of sheets in plain CSS 3D (no perspective, so every edge stays true), with a
 * dotted leader from each sheet to a mono label. The first layer is the top sheet. Sheets land one
 * after another when the stack scrolls into view, then a light runs down the stack once. Hover,
 * focus or tap a label to lift its sheet and turn it orange.
 *
 * Wide containers put the labels beside the stack with leaders. Narrow ones (a phone) put the
 * labels in a list below, with the detail text always showing. Everything is sized in `cqw`
 * (a share of the container's width), so it scales without JavaScript.
 *
 * The picture is decoration (aria-hidden). The labels are a real list of buttons.
 */

type Tone = 'light' | 'dark';

/*
 * Geometry. The sheets are squares turned 45° and tipped back by TILT. On screen a sheet is a
 * diamond `s * 1.414` wide and `s * 1.414 * cos(TILT)` high, and lifting a sheet by `z` moves it
 * up the screen by `z * sin(TILT)`. A tilt of 66° (a little flatter than a true isometric 60°)
 * leaves more than half of every lower sheet showing, so each one's drawing can be seen.
 */
const TILT = 66;
const SQRT_HALF = 0.7071;
const COS = Math.cos((TILT * Math.PI) / 180);
const FLOOR = Math.sin((TILT * Math.PI) / 180);
const HALF_HEIGHT = SQRT_HALF * COS; // half the diamond's height, as a share of the side `s`
const FULL_HEIGHT = 2 * HALF_HEIGHT;

interface FaceStyle {
  bg: string;
  fg: string;
  edge: string;
}

const FACES: Record<Tone, FaceStyle[]> = {
  light: [
    { bg: '#ffffff', fg: '#15130f', edge: '#d6c9b4' },
    { bg: '#eae1d3', fg: '#15130f', edge: '#bfae94' },
    { bg: '#ffffff', fg: '#15130f', edge: '#d6c9b4' },
    { bg: '#12110f', fg: '#f6f0e6', edge: '#000000' },
  ],
  dark: [
    { bg: '#2b2722', fg: '#f6f0e6', edge: '#080706' },
    { bg: '#24211d', fg: '#f6f0e6', edge: '#080706' },
    { bg: '#2b2722', fg: '#f6f0e6', edge: '#080706' },
    { bg: '#f6f0e6', fg: '#15130f', edge: '#a89a85' },
  ],
};
// White (not cream) on the orange: the small sheet numbers need 4.5:1, and white gets 4.7:1.
const ACTIVE_FACE: FaceStyle = { bg: '#c2500a', fg: '#ffffff', edge: '#7c3200' };

/** Thickness: the sheet shape repeated a little way "down", which reads as an edge. */
function thickness(color: string): string {
  return Array.from({ length: 6 }, (_, step) => {
    const d = (step + 1) * 0.3;
    return `-${d}cqw ${d}cqw 0 ${color}`;
  }).join(', ');
}

const dot = 'absolute rounded-full bg-current';
const block = 'absolute rounded-[6%] bg-current';

/** What is drawn on the top of each kind of sheet. Percentages of the sheet's side. */
function Art({ kind, active }: { kind: number; active: boolean }) {
  if (kind === 0) {
    return (
      <>
        <span className="absolute inset-x-[7%] top-[7%] h-[10%] border-b border-current opacity-40" />
        {[0, 1, 2].map((n) => (
          <span
            key={n}
            className={cn(dot, 'opacity-40')}
            style={{ left: `${9 + n * 4.5}%`, top: '10.5%', width: '2.6%', height: '2.6%' }}
          />
        ))}
        <span
          className={cn(block, 'opacity-[0.14]')}
          style={{ left: '7%', top: '23%', width: '86%', height: '30%' }}
        />
        <span
          className={cn(block, 'opacity-30')}
          style={{ left: '7%', top: '60%', width: '40%', height: '6%' }}
        />
        <span
          className={cn(block, 'opacity-20')}
          style={{ left: '7%', top: '71%', width: '60%', height: '6%' }}
        />
        <span
          className={cn(block, active ? 'opacity-100' : 'bg-accent')}
          style={{ left: '7%', top: '83%', width: '24%', height: '9%' }}
        />
      </>
    );
  }
  if (kind === 1) {
    return (
      <span className="absolute inset-[14%] grid grid-cols-3 gap-[6%]">
        {Array.from({ length: 9 }, (_, n) => (
          <span
            key={n}
            className={cn(
              'aspect-square rounded-[24%]',
              n === 4 ? (active ? 'bg-current' : 'bg-accent') : 'bg-current opacity-[0.15]',
            )}
          />
        ))}
      </span>
    );
  }
  if (kind === 2) {
    return (
      <>
        <span
          className="absolute rounded-full border-current opacity-70"
          style={{ left: '27%', top: '27%', width: '46%', height: '46%', borderWidth: '1.4cqw' }}
        />
        <span
          className="absolute inset-0 grid place-items-center font-sans font-semibold"
          style={{ fontSize: 'calc(var(--s) * 0.17)', lineHeight: 1 }}
        >
          ™
        </span>
        {(['left-[6%] top-[6%]', 'right-[6%] top-[6%]', 'left-[6%] bottom-[6%]'] as const).map(
          (place) => (
            <span key={place} className={cn('absolute size-[7%] opacity-40', place)}>
              <span className="absolute top-0 left-1/2 h-full w-px bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-full bg-current" />
            </span>
          ),
        )}
      </>
    );
  }
  return (
    <>
      {[0, 1, 2, 3].map((n) => (
        <span key={n}>
          <span
            className={cn(block, 'opacity-50')}
            style={{ left: '9%', top: `${15 + n * 16}%`, width: '5%', height: '5%' }}
          />
          <span
            className={cn(block, 'opacity-[0.22]')}
            style={{
              left: '18%',
              top: `${15.6 + n * 16}%`,
              width: `${46 - (n % 2) * 12}%`,
              height: '3.6%',
            }}
          />
        </span>
      ))}
      <span
        className={cn(
          'absolute rotate-[-12deg] rounded-[8%] border-current',
          active ? 'opacity-100' : 'border-accent text-accent',
        )}
        style={{ right: '8%', bottom: '10%', width: '30%', height: '20%', borderWidth: '0.9cqw' }}
      />
    </>
  );
}

function artKind(label: string, index: number): number {
  const text = label.toLowerCase();
  if (/(web|domain|site)/.test(text)) return 0;
  if (/app/.test(text)) return 1;
  if (/(trademark|brand|mark)/.test(text)) return 2;
  if (/(evidence|proof|case|record)/.test(text)) return 3;
  return index % 4;
}

export function IsometricStack({
  layers,
  tone = 'light',
  ariaLabel = 'Layers',
  className,
}: {
  /** First item is the top sheet. `detail` is the short plain-words line under the label. */
  layers: { label: string; detail?: string }[];
  tone?: Tone;
  ariaLabel?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -15% 0px' });
  const entered = reduced || seen;

  const [settled, setSettled] = useState(reduced);
  const [scan, setScan] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const count = layers.length;
  const active = hover ?? pinned ?? scan;

  // After the sheets land, a light runs down the stack once.
  useEffect(() => {
    if (reduced || !entered) return;
    const timers: number[] = [window.setTimeout(() => setSettled(true), 1500)];
    for (let index = 0; index < count; index += 1) {
      timers.push(window.setTimeout(() => setScan(index), 1500 + index * 780));
    }
    timers.push(window.setTimeout(() => setScan(null), 1500 + count * 780));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduced, entered, count]);

  const sheet = (index: number, isActive: boolean): FaceStyle => {
    if (isActive) return ACTIVE_FACE;
    const faces = FACES[tone];
    return faces[index % faces.length] ?? ACTIVE_FACE;
  };

  const frame = {
    '--n': count,
    '--nm': count - 1,
    '--dz': `calc(var(--dy) / ${FLOOR})`,
    '--yt': `calc(${HALF_HEIGHT.toFixed(4)} * var(--s) + 6cqw)`,
  } as CSSProperties;

  const muted = tone === 'dark' ? 'text-cream/70' : 'text-muted';
  const leaderBase =
    tone === 'dark' ? 'border-cream/35 text-cream/50' : 'border-ink/35 text-ink/45';

  const pill = (index: number, children: ReactNode) => (
    <li
      key={layers[index]?.label}
      style={{ '--i': index } as CSSProperties}
      className="@2xl:absolute @2xl:top-[calc(var(--yt)+var(--i)*var(--dy)-13px)] @2xl:left-[64cqw] @2xl:w-[36cqw] @2xl:pr-1"
    >
      {children}
    </li>
  );

  return (
    <div ref={ref} className={cn('@container w-full', className)}>
      <div
        className="relative [--dy:12.5cqw] [--s:50cqw] [--cx:50cqw] @2xl:[--cx:29cqw] @2xl:[--dy:11cqw] @2xl:[--s:35cqw]"
        style={frame}
      >
        {/* the picture */}
        <div
          aria-hidden
          className="relative w-full"
          style={{
            height: `calc(${FULL_HEIGHT.toFixed(4)} * var(--s) + var(--nm) * var(--dy) + 10cqw)`,
          }}
        >
          <div
            className="absolute"
            style={{
              left: 'var(--cx)',
              top: 'calc(var(--yt) + var(--nm) * var(--dy))',
              width: 0,
              height: 0,
              transform: `rotateX(${TILT}deg) rotateZ(-45deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {tone === 'light' && (
              <span
                className="absolute"
                style={{
                  left: 'calc(var(--s) / -2)',
                  top: 'calc(var(--s) / -2)',
                  width: 'var(--s)',
                  height: 'var(--s)',
                  borderRadius: '6%',
                  background: 'rgb(21 19 15 / 0.16)',
                  filter: 'blur(1.6cqw)',
                  transform: 'translateZ(-1.5cqw)',
                  opacity: entered ? 1 : 0,
                  transition: reduced ? 'none' : `opacity 900ms ${EASE_OUT_EXPO_CSS} 500ms`,
                }}
              />
            )}
            {layers.map((layer, index) => {
              const isActive = active === index;
              const face = sheet(index, isActive);
              const rank = count - 1 - index; // 0 for the bottom sheet
              const lift = isActive ? 3.6 : 0;
              const drop = entered ? 0 : 16;
              return (
                <span
                  key={layer.label}
                  className="absolute"
                  style={{
                    left: 'calc(var(--s) / -2)',
                    top: 'calc(var(--s) / -2)',
                    width: 'var(--s)',
                    height: 'var(--s)',
                    borderRadius: '6%',
                    background: face.bg,
                    color: face.fg,
                    boxShadow: `${thickness(face.edge)}, inset 0 0 0 1px rgb(21 19 15 / 0.08)`,
                    opacity: entered ? 1 : 0,
                    transform: `translateZ(calc(${rank} * var(--dz) + ${lift + drop}cqw))`,
                    transition: reduced
                      ? 'none'
                      : settled
                        ? `transform 420ms ${EASE_OUT_EXPO_CSS}, background-color 250ms ease-out, opacity 300ms ease-out`
                        : `transform 1000ms ${EASE_OUT_EXPO_CSS} ${rank * 110}ms, opacity 500ms ease-out ${rank * 110}ms`,
                  }}
                >
                  {/* Lower sheets are half covered by the one above, so the drawing sits towards
                      the front (the lower corner on screen) where it stays in view. */}
                  <span
                    className="absolute inset-0"
                    style={{
                      transform: 'translate(-12%, 12%) scale(0.8)',
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <Art kind={artKind(layer.label, index)} active={isActive} />
                  </span>
                  <span
                    className="absolute font-mono font-medium"
                    style={{
                      right: '7%',
                      bottom: '5%',
                      fontSize: 'calc(var(--s) * 0.045)',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </span>
              );
            })}
          </div>

          {/* dotted leaders to the labels (wide containers only) */}
          {layers.map((layer, index) => {
            const isActive = active === index;
            return (
              <span
                key={layer.label}
                className="absolute hidden @2xl:block"
                style={{
                  left: 'calc(var(--cx) + 0.7071 * var(--s) + 1.2cqw)',
                  width: 'calc(62cqw - var(--cx) - 0.7071 * var(--s) - 1.2cqw)',
                  top: `calc(var(--yt) + ${index} * var(--dy))`,
                }}
              >
                <span
                  className={cn(
                    'absolute top-0 left-0 block h-0 w-full origin-left border-t',
                    isActive ? 'border-accent-soft' : leaderBase,
                  )}
                  style={{
                    borderTopStyle: isActive ? 'solid' : 'dotted',
                    borderTopWidth: isActive ? 2 : 1,
                    transform: entered ? 'scaleX(1)' : 'scaleX(0)',
                    transition: reduced
                      ? 'none'
                      : `transform 800ms ${EASE_OUT_EXPO_CSS} ${700 + (count - index) * 90}ms, border-color 200ms ease-out`,
                  }}
                />
                <span
                  className={cn(
                    'absolute -top-[3px] -left-[3px] size-1.5 rounded-full',
                    isActive ? 'bg-accent-soft' : 'bg-current',
                    tone === 'dark' ? 'text-cream/60' : 'text-ink/60',
                  )}
                />
              </span>
            );
          })}
        </div>

        {/* the labels */}
        <ol
          aria-label={ariaLabel}
          className="mt-2 grid gap-2.5 @md:grid-cols-2 @2xl:absolute @2xl:inset-0 @2xl:mt-0 @2xl:block"
        >
          {layers.map((layer, index) => {
            const isActive = active === index;
            return pill(
              index,
              <button
                type="button"
                aria-pressed={pinned === index}
                onClick={() => setPinned((current) => (current === index ? null : index))}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setHover(index);
                }}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
                className="group flex w-full cursor-pointer flex-col items-start gap-1.5 text-left @2xl:gap-1"
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none font-medium tracking-[0.12em] uppercase transition-colors duration-200 motion-reduce:transition-none',
                    isActive
                      ? 'border-accent bg-accent text-white'
                      : tone === 'dark'
                        ? 'border-cream/30 text-cream group-hover:border-cream/60'
                        : 'border-ink/25 text-ink group-hover:border-ink/55',
                  )}
                >
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : tone === 'dark'
                          ? 'text-accent-soft'
                          : 'text-accent-ink'
                    }
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {layer.label}
                </span>
                {layer.detail && (
                  <span className={cn('block text-[13px] leading-[1.25] @2xl:line-clamp-2', muted)}>
                    {layer.detail}
                  </span>
                )}
              </button>,
            );
          })}
        </ol>
      </div>
    </div>
  );
}
