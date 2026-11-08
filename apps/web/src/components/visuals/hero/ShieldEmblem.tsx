import { motion, useReducedMotion } from 'motion/react';

/** Outer and inner shield outlines (viewBox 0 0 400 520). */
const SHIELD = 'M200 20 L345 72 V190 C345 292 285 362 200 400 C115 362 55 292 55 190 V72 Z';
const SHIELD_INNER = 'M200 50 L318 92 V192 C318 274 268 334 200 366 C132 334 82 274 82 192 V92 Z';
const SHIELD_LEFT_HALF = 'M200 20 L55 72 V190 C55 292 115 362 200 400 Z';
const MARK = 'M200 128 L236 141 V170 C236 195 220 211 200 220 C180 211 164 195 164 170 V141 Z';

/**
 * The glass "brand identity" shield on its glowing pedestal.
 * Pure SVG: gradients give the glass and extrusion look; the shield floats
 * while the pedestal light pulses.
 */
/** Font size that keeps a brand name inside the shield face (about 200 units wide). */
const labelSize = (label: string) => Math.max(13, Math.min(30, 200 / (label.length * 0.6)));

export function ShieldEmblem({
  className,
  label,
}: {
  className?: string;
  label?: string | undefined;
}) {
  // MotionConfig's reducedMotion only stops movement; looping fades must be stopped here.
  const reduceMotion = useReducedMotion();
  return (
    <svg viewBox="0 0 400 520" className={className} aria-hidden>
      <defs>
        <linearGradient id="similo-shield-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7487" />
          <stop offset="0.45" stopColor="#d92f48" />
          <stop offset="1" stopColor="#5a0a19" />
        </linearGradient>
        <linearGradient id="similo-shield-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a1428" />
          <stop offset="1" stopColor="#240510" />
        </linearGradient>
        <linearGradient id="similo-shield-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ffd1d7" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d92f48" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="similo-shield-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7283f" />
          <stop offset="1" stopColor="#3d0712" />
        </linearGradient>
        <linearGradient id="similo-shield-gloss" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="similo-pedestal-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#30364d" />
          <stop offset="1" stopColor="#0f1424" />
        </linearGradient>
        <radialGradient id="similo-pedestal-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4d66" stopOpacity="0.95" />
          <stop offset="1" stopColor="#d92f48" stopOpacity="0" />
        </radialGradient>
        <filter id="similo-blur-lg" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="similo-blur-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Pedestal: base tier, top tier, inner rings and a pulsing light pool. */}
      <ellipse
        cx="200"
        cy="470"
        rx="196"
        ry="46"
        fill="url(#similo-pedestal-glow)"
        opacity="0.35"
        filter="url(#similo-blur-lg)"
      />
      <ellipse
        cx="200"
        cy="458"
        rx="186"
        ry="44"
        fill="#0c1121"
        stroke="#d92f48"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <ellipse
        cx="200"
        cy="458"
        rx="186"
        ry="44"
        fill="none"
        stroke="#ff4d66"
        strokeWidth="5"
        opacity="0.35"
        filter="url(#similo-blur-sm)"
      />
      <ellipse
        cx="200"
        cy="436"
        rx="160"
        ry="37"
        fill="url(#similo-pedestal-top)"
        stroke="#e98a91"
        strokeOpacity="0.85"
        strokeWidth="1.5"
      />
      <ellipse
        cx="200"
        cy="436"
        rx="124"
        ry="28"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.12"
      />
      <ellipse
        cx="200"
        cy="436"
        rx="92"
        ry="20"
        fill="none"
        stroke="#e98a91"
        strokeOpacity="0.25"
      />
      <motion.ellipse
        cx="200"
        cy="434"
        rx="110"
        ry="22"
        fill="url(#similo-pedestal-glow)"
        filter="url(#similo-blur-sm)"
        opacity={0.8}
        {...(!reduceMotion && {
          animate: { opacity: [0.55, 0.95, 0.55] },
          transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        })}
      />

      {/* Floating shield */}
      <motion.g
        {...(!reduceMotion && {
          animate: { y: [0, -12, 0] },
          transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
        })}
      >
        <ellipse
          cx="200"
          cy="230"
          rx="150"
          ry="170"
          fill="#d92f48"
          opacity="0.28"
          filter="url(#similo-blur-lg)"
        />
        <path d={SHIELD} transform="translate(9 9)" fill="url(#similo-shield-side)" />
        <path d={SHIELD} fill="url(#similo-shield-face)" />
        <path
          d={SHIELD_INNER}
          fill="url(#similo-shield-inner)"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />
        <path d={SHIELD_LEFT_HALF} fill="url(#similo-shield-gloss)" opacity="0.35" />
        <path
          d={SHIELD}
          fill="none"
          stroke="url(#similo-shield-rim)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Brand mark */}
        <path d={MARK} fill="#ffffff" />
        <path
          d="M181 151 L200 190 L219 151"
          fill="none"
          stroke="#d92f48"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {label ? (
          <>
            <text
              x="200"
              y="276"
              textAnchor="middle"
              fill="#ffffff"
              style={{
                font: `600 ${labelSize(label)}px "Geist Variable", system-ui, sans-serif`,
                letterSpacing: '-0.02em',
              }}
            >
              {label}
            </text>
            <text
              x="200"
              y="306"
              textAnchor="middle"
              fill="#ffffff"
              fillOpacity="0.7"
              style={{
                font: '500 12px "Geist Mono Variable", ui-monospace, monospace',
                letterSpacing: '0.18em',
              }}
            >
              PROTECTED
            </text>
          </>
        ) : (
          <>
            <text
              x="200"
              y="270"
              textAnchor="middle"
              fill="#ffffff"
              style={{
                font: '600 25px "Geist Variable", system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Your Brand
            </text>
            <text
              x="200"
              y="302"
              textAnchor="middle"
              fill="#ffffff"
              style={{
                font: '600 25px "Geist Variable", system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Identity
            </text>
          </>
        )}
      </motion.g>
    </svg>
  );
}
