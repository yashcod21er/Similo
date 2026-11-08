import { AlertTriangle, Globe, Smartphone } from 'lucide-react';
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';
import { GlobeCanvas } from './GlobeCanvas';
import { ShieldEmblem } from './ShieldEmblem';

/* Orbit ring geometry, in the 640×640 viewBox shared by both ring layers. */
const RING = { cx: 320, cy: 420, rx: 300, ry: 104 };
const RING_PATH = `M${RING.cx - RING.rx} ${RING.cy} a${RING.rx} ${RING.ry} 0 1 0 ${RING.rx * 2} 0 a${RING.rx} ${RING.ry} 0 1 0 ${-RING.rx * 2} 0`;
const RING_FRONT_ARC = `M${RING.cx - RING.rx} ${RING.cy} A${RING.rx} ${RING.ry} 0 0 0 ${RING.cx + RING.rx} ${RING.cy}`;
const NODE_ANGLES = [200, 340, 152, 28]; // degrees: where the glowing nodes sit
const nodePoint = (deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: RING.cx + RING.rx * Math.cos(rad), y: RING.cy + RING.ry * Math.sin(rad) };
};

/** Back half of the scene: full ring with travelling light dots (hidden behind the shield at the top). */
function RingBack({ animate }: { animate: boolean }) {
  return (
    <svg viewBox="0 0 640 640" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id="similo-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#e98a91" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
        </linearGradient>
        <filter id="similo-node-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <path d={RING_PATH} fill="none" stroke="url(#similo-ring)" strokeWidth="1.5" />
      {animate &&
        [0, 4.5].map((begin) => (
          <g key={begin}>
            <circle r="9" fill="#ff4d66" opacity="0.7" filter="url(#similo-node-glow)">
              <animateMotion
                dur="9s"
                repeatCount="indefinite"
                begin={`-${begin}s`}
                path={RING_PATH}
              />
            </circle>
            <circle r="3.5" fill="#ffffff">
              <animateMotion
                dur="9s"
                repeatCount="indefinite"
                begin={`-${begin}s`}
                path={RING_PATH}
              />
            </circle>
          </g>
        ))}
    </svg>
  );
}

/** Front half: the lower arc passes in front of the pedestal, plus the glowing nodes. */
function RingFront() {
  return (
    <svg
      viewBox="0 0 640 640"
      className="pointer-events-none absolute inset-0 z-20 size-full"
      aria-hidden
    >
      <path d={RING_FRONT_ARC} fill="none" stroke="url(#similo-ring)" strokeWidth="1.5" />
      {NODE_ANGLES.map((deg) => {
        const { x, y } = nodePoint(deg);
        return (
          <g key={deg}>
            <circle
              cx={x}
              cy={y}
              r="10"
              fill="#ff4d66"
              opacity="0.65"
              filter="url(#similo-node-glow)"
            />
            <circle cx={x} cy={y} r="4.5" fill="#ffffff" />
          </g>
        );
      })}
    </svg>
  );
}

/*
 * Orbit the intelligence cards travel around the shield. Units are a share of
 * the visual's width (cqw); the visual is square, so they work for both axes.
 * Angles: 0 = right, 90° = in front of the shield, 180° = left, 270° = behind it.
 */
const ORBIT = { cy: 47, rx: 36, ry: 26 };
const ORBIT_SECONDS = 36; // one full revolution
const ORBIT_SPEED = (2 * Math.PI) / ORBIT_SECONDS; // radians per second
const DEG = Math.PI / 180;

interface OrbitCardProps {
  icon: ReactNode;
  title: [string, string];
  alert: string;
  /** Shorter label for small screens, where the card is narrow. */
  alertShort: string;
  /** Where the card starts on the orbit, in degrees (see ORBIT). */
  startDeg: number;
  delay: number;
  /** Shared orbit rotation in radians, driven by the parent. */
  orbit: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}

/**
 * Frosted-glass intelligence card riding the orbit. Nested layers keep the
 * transforms independent: orbit position → pointer parallax → entrance → 3D facing.
 */
function OrbitCard({
  icon,
  title,
  alert,
  alertShort,
  startDeg,
  delay,
  orbit,
  pointerX,
  pointerY,
}: OrbitCardProps) {
  const theta = useTransform(orbit, (value) => value + startDeg * DEG);
  // 0 = directly behind the shield, 1 = directly in front of it.
  const depth = useTransform(theta, (t) => (Math.sin(t) + 1) / 2);

  const x = useTransform(theta, (t) => `${ORBIT.rx * Math.cos(t)}cqw`);
  const y = useTransform(theta, (t) => `${ORBIT.ry * Math.sin(t)}cqw`);
  const scale = useTransform(depth, (d) => 0.74 + 0.26 * d);
  // Swap layers at the far left/right of the orbit, where the card is clear of the shield.
  const zIndex = useTransform(theta, (t) => (Math.sin(t) >= 0 ? 30 : 10));
  // Darken cards as they pass behind (an overlay, because opacity on an
  // ancestor would switch off the card's backdrop blur).
  const shade = useTransform(theta, (t) => Math.max(0, -Math.sin(t)) * 0.55);
  // Cards turn to face the centre as they swing round.
  const rotateY = useTransform(theta, (t) => -Math.cos(t) * 16);
  const rotateX = useTransform(theta, (t) => Math.sin(t) * 8);
  // Nearer cards move more with the pointer.
  const parallaxX = useTransform([pointerX, depth], ([p = 0, d = 0]: number[]) => p * (8 + 18 * d));
  const parallaxY = useTransform([pointerY, depth], ([p = 0, d = 0]: number[]) => p * (8 + 18 * d));

  // Reduced motion freezes the orbit at the start angles; keep every card in
  // front and unshaded so the still picture stays fully readable.
  const still = useReducedMotion() === true;

  return (
    <motion.div
      style={{ top: `${ORBIT.cy}%`, x, y, scale, zIndex: still ? 30 : zIndex }}
      className="absolute left-1/2 w-[38%] -translate-x-1/2 -translate-y-1/2 sm:w-[36%]"
    >
      <motion.div style={{ x: parallaxX, y: parallaxY }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay }}
        >
          <motion.div style={{ rotateX, rotateY, transformPerspective: 900 }} className="relative">
            {/* Stacked "window" behind the card for depth */}
            <div className="absolute -top-3 -right-3 h-3/4 w-2/3 rounded-xl bg-white/[0.06] ring-1 ring-white/15 backdrop-blur-sm" />
            <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.18] via-white/[0.07] to-crimson/[0.12] p-3 shadow-[0_24px_60px_-12px_rgba(217,47,72,0.55)] ring-1 ring-white/25 backdrop-blur-xl sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {icon}
                <p className="text-[11px] leading-tight font-semibold text-white sm:text-[15px]">
                  {title[0]}
                  <br />
                  {title[1]}
                </p>
              </div>
              <p className="mt-2.5 flex items-center justify-between gap-2 rounded-lg bg-midnight/50 px-2 py-1.5 font-mono text-[9.5px] text-white/90 ring-1 ring-white/15 sm:mt-3 sm:px-2.5 sm:text-[11.5px]">
                <span className="truncate sm:hidden">{alertShort}</span>
                <span className="hidden truncate sm:inline">{alert}</span>
                <AlertTriangle aria-hidden className="size-3 shrink-0 text-[#ff6b80] sm:size-3.5" />
              </p>
              <motion.div
                style={{ opacity: still ? 0 : shade }}
                className="pointer-events-none absolute inset-0 rounded-2xl bg-midnight"
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Example imitation names shown on the orbiting cards. */
export interface OrbitExamples {
  website: string;
  app: string;
  trademark: string;
}

const DEFAULT_EXAMPLES: OrbitExamples = {
  website: 'acme-login.com',
  app: 'Acme Pro',
  trademark: 'ACMEE',
};

/**
 * Hero centrepiece: the protected brand (shield) at the centre of a rotating
 * globe and orbit ring, with three example imitations — a lookalike website,
 * a copycat app and a similar trademark — circling it, in front of the shield
 * and then behind it. Layers move at different depths with the pointer.
 */
export function IdentityHeroVisual({
  pointerX,
  pointerY,
  brand,
  examples = DEFAULT_EXAMPLES,
  className,
}: {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** Shown on the shield; the default reads "Your Brand Identity". */
  brand?: string | undefined;
  examples?: OrbitExamples;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef);

  const globeX = useTransform(pointerX, (value) => value * -10);
  const globeY = useTransform(pointerY, (value) => value * -10);
  const shieldX = useTransform(pointerX, (value) => value * 6);
  const shieldY = useTransform(pointerY, (value) => value * 6);

  // One shared angle keeps the cards evenly spaced. Decreasing it moves them
  // left → front → right → behind, the same way as the ring's light dots.
  // Paused off-screen; with reduced motion the cards stay at their start angles.
  const orbit = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (reduceMotion || !inView) return;
    orbit.set(orbit.get() - (Math.min(delta, 50) / 1000) * ORBIT_SPEED);
  });

  const iconBase =
    'flex size-7 shrink-0 items-center justify-center rounded-lg shadow-lg sm:size-10 sm:rounded-xl';

  return (
    // `@container` lets the cards position themselves in cqw (share of this element's width).
    <div
      ref={rootRef}
      className={cn('@container relative isolate aspect-square w-full', className)}
      aria-hidden
    >
      {/* Layer 1: globe */}
      <motion.div
        style={{ x: globeX, y: globeY }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE_OUT }}
        className="absolute top-[-4%] left-1/2 w-[86%] -translate-x-1/2"
      >
        <GlobeCanvas className="aspect-square w-full" />
      </motion.div>

      {/* Layer 2: back of the orbit ring */}
      <RingBack animate={!reduceMotion} />

      {/* Cards behind the shield sit at z-10, cards in front at z-30 (see OrbitCard). */}

      {/* Layer 3: shield + pedestal */}
      <motion.div
        style={{ x: shieldX, y: shieldY }}
        className="absolute top-[7%] left-1/2 z-20 w-[58%] -translate-x-1/2"
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
        >
          <ShieldEmblem
            label={brand}
            className="w-full drop-shadow-[0_30px_60px_rgba(217,47,72,0.35)]"
          />
        </motion.div>
      </motion.div>

      {/* Layer 4: front of the ring */}
      <RingFront />

      {/* Layer 5: intelligence cards, 120° apart. The start angles give the
          resting layout: upper left, upper right and in front of the pedestal. */}
      <OrbitCard
        icon={
          <span className={cn(iconBase, 'bg-gradient-to-br from-sky-400 to-blue-700')}>
            <Globe className="size-4 text-white sm:size-5" />
          </span>
        }
        title={['Lookalike', 'website']}
        alert={examples.website}
        alertShort={examples.website}
        startDeg={210}
        delay={0.6}
        orbit={orbit}
        pointerX={pointerX}
        pointerY={pointerY}
      />
      <OrbitCard
        icon={
          <span className={cn(iconBase, 'bg-gradient-to-br from-[#ff6b80] to-crimson')}>
            <Smartphone className="size-4 text-white sm:size-5" />
          </span>
        }
        title={['Copycat', 'app']}
        alert={examples.app}
        alertShort={examples.app}
        startDeg={330}
        delay={0.8}
        orbit={orbit}
        pointerX={pointerX}
        pointerY={pointerY}
      />
      <OrbitCard
        icon={
          <span
            className={cn(iconBase, 'rounded-full bg-gradient-to-br from-[#ff6b80] to-crimson')}
          >
            {/* Registered-trademark symbol drawn as a ringed "R" (the font's ® glyph is tiny). */}
            <span className="flex size-[72%] items-center justify-center rounded-full border-[1.5px] border-white text-[10px] font-bold text-white sm:border-2 sm:text-sm">
              R
            </span>
          </span>
        }
        title={['Similar', 'trademark']}
        alert={examples.trademark}
        alertShort={examples.trademark}
        startDeg={90}
        delay={1}
        orbit={orbit}
        pointerX={pointerX}
        pointerY={pointerY}
      />
    </div>
  );
}
