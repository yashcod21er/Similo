import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { useInView, usePageVisible, usePrefersReducedMotion } from './hooks';
import { canUseWebGL } from './webgl';
import { MARK_COPY, MARK_ORIGINAL } from './mark-paths';

/**
 * The home hero's signature object (WebGL, three.js): the logo's ∼ mark in 3D, dark luxury.
 * The original half is polished black lacquer; the copy half is smoked burnt-orange glass that
 * refracts the giant headline word behind it. Both pick up crisp highlights from a generated
 * studio environment (RoomEnvironment, no files) and a burnt-orange rim light. The halves drift
 * apart and snap back together (original vs copy), and the mark tilts toward the pointer.
 *
 * - Loaded lazily (only the home page downloads three.js).
 * - Pauses off-screen and in a hidden tab; one still frame with reduced motion.
 * - Phones get a lighter version: no glass refraction, fewer bevel segments, lower resolution.
 * - If WebGL is unavailable it calls `onFail`, so the hero can show its 2D look.
 *
 * How the refraction works: the giant word is real DOM text under the canvas. The scene holds a
 * full-screen "backdrop" plane painted with the same word at the same pixels (read from the DOM).
 * The plane only writes colour while three renders its transmission pass, so it is invisible on
 * screen but the glass refracts it, and the glass hides the DOM text under its own silhouette.
 */

/** Width of the ∼ in tile units (x 4.5 → 27.5). */
const MARK_WIDTH = 23;
const DEPTH = 2.6;
const NIGHT = '#12110f';
const FOV = 30;
const CAMERA_Z = 10;
const MARK_Z = 1.4;

function halfGeometry(d: string, light: boolean): THREE.ExtrudeGeometry {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((path) => path.toShapes());
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: DEPTH,
    curveSegments: light ? 8 : 20,
    bevelEnabled: true,
    bevelThickness: 0.7,
    bevelSize: 0.42,
    bevelOffset: -0.12,
    bevelSegments: light ? 3 : 10,
  });
  // Centre on the tile's middle, then turn it over (SVG y points down). Rotating instead of
  // mirroring keeps the faces' winding, so normals still point outwards.
  geometry.translate(-16, -16, -DEPTH / 2);
  geometry.rotateX(Math.PI);
  geometry.computeVertexNormals();
  return geometry;
}

/** Ease for the snap back: overshoots a little, like two magnets meeting. */
function easeOutBack(u: number): number {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
}

function easeInOut(u: number): number {
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

/** How far apart the halves are (0 together, 1 apart) over a 7.5 s cycle. */
function driftAt(seconds: number): number {
  const p = seconds % 7.5;
  if (p < 3.4) return 0;
  if (p < 5.2) return easeInOut((p - 3.4) / 1.8);
  if (p < 6.0) return 1;
  if (p < 6.7) return 1 - easeOutBack((p - 6.0) / 0.7);
  return 0;
}

/** Paints what sits behind the glass: the night, the hero's glow and the giant word. */
function paintBackdrop(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  anchor: HTMLElement,
  glow: HTMLElement | null,
  scale: number,
): boolean {
  const box = host.getBoundingClientRect();
  const width = Math.max(1, Math.round(box.width * scale));
  const height = Math.max(1, Math.round(box.height * scale));
  const resized = canvas.width !== width || canvas.height !== height;
  if (resized) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return resized;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, box.width, box.height);

  if (glow) {
    // The glow is a CSS radial gradient (closest-side) on a square box; draw the same one.
    const r = glow.getBoundingClientRect();
    const cx = r.left - box.left + r.width / 2;
    const cy = r.top - box.top + r.height / 2;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(r.width, r.height) / 2);
    gradient.addColorStop(0, 'rgba(194, 80, 10, 0.26)');
    gradient.addColorStop(0.45, 'rgba(194, 80, 10, 0.09)');
    gradient.addColorStop(1, 'rgba(194, 80, 10, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, box.width, box.height);
  }

  const style = getComputedStyle(anchor);
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
  ctx.fillStyle = style.color;
  ctx.textBaseline = 'alphabetic';
  const ascent = ctx.measureText('copycats').fontBoundingBoxAscent;

  // Draw word by word at the exact place the browser put each one.
  const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (const match of text.matchAll(/\S+/g)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rect = range.getBoundingClientRect();
      ctx.fillText(match[0], rect.left - box.left, rect.top - box.top + ascent);
    }
  }
  range.detach();
  return resized;
}

export default function GlassMark({
  className,
  anchorRef,
  glowRef,
  showAfterMs = 0,
  onFail,
}: {
  className?: string;
  /** The giant word the mark floats in front of (and refracts). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Optional glow element behind the word, painted into the refraction too. */
  glowRef?: RefObject<HTMLElement | null>;
  /** Wait this long before showing the mark (lets the headline finish its entrance). */
  showAfterMs?: number;
  onFail?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();
  const inView = useInView(hostRef, { rootMargin: '80px' });
  const activeRef = useRef(false);
  const startRef = useRef<(() => void) | null>(null);
  const stillRef = useRef(false);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const anchor = anchorRef.current;
    if (!host || !anchor) return;

    let renderer: THREE.WebGLRenderer;
    if (!canUseWebGL()) {
      onFail?.();
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      onFail?.();
      return;
    }

    const light = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, light ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.transmissionResolutionScale = 0.75;
    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.set(0, 0, CAMERA_Z);

    // A generated studio environment for crisp reflections (no image files).
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const envTexture = pmrem.fromScene(room, 0.03).texture;
    room.dispose();
    pmrem.dispose();
    scene.environment = envTexture;
    scene.environmentIntensity = 0.85;

    // Warm key light, burnt-orange rim from behind.
    const key = new THREE.DirectionalLight('#ffe6cc', 1.4);
    key.position.set(3, 4, 6);
    const rim = new THREE.DirectionalLight('#ff6a1a', 5);
    rim.position.set(-5, 1.5, -4);
    const under = new THREE.DirectionalLight('#c2500a', 1.6);
    under.position.set(2, -5, 1);
    scene.add(key, rim, under);

    /* The mark: root (placement) → tilt (pointer, idle sway) → the two halves. */
    const root = new THREE.Group();
    root.position.z = MARK_Z;
    const tilt = new THREE.Group();
    root.add(tilt);
    scene.add(root);

    const originalGeometry = halfGeometry(MARK_ORIGINAL, light);
    const copyGeometry = halfGeometry(MARK_COPY, light);
    const originalMaterial = new THREE.MeshPhysicalMaterial({
      color: '#0d0c0b',
      metalness: 0.1,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      envMapIntensity: 1.4,
    });
    const copyMaterial = light
      ? new THREE.MeshPhysicalMaterial({
          color: '#a8400a',
          roughness: 0.18,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          envMapIntensity: 1.2,
        })
      : new THREE.MeshPhysicalMaterial({
          color: '#ffb27a',
          transmission: 1,
          thickness: DEPTH,
          ior: 1.5,
          roughness: 0.1,
          attenuationColor: new THREE.Color('#c2500a'),
          attenuationDistance: 0.55,
          clearcoat: 1,
          clearcoatRoughness: 0.03,
          specularIntensity: 1,
          envMapIntensity: 1.3,
        });
    const original = new THREE.Mesh(originalGeometry, originalMaterial);
    const copy = new THREE.Mesh(copyGeometry, copyMaterial);
    tilt.add(original, copy);

    /* The invisible backdrop the glass refracts (desktop only). */
    let backdropCanvas: HTMLCanvasElement | null = null;
    let backdropTexture: THREE.CanvasTexture | null = null;
    let backdropMaterial: THREE.MeshBasicMaterial | null = null;
    const backdropGeometry = new THREE.PlaneGeometry(1, 1);
    let backdrop: THREE.Mesh | null = null;
    if (!light) {
      backdropCanvas = document.createElement('canvas');
      backdropTexture = new THREE.CanvasTexture(backdropCanvas);
      backdropTexture.colorSpace = THREE.SRGBColorSpace;
      backdropTexture.generateMipmaps = false;
      backdropTexture.minFilter = THREE.LinearFilter;
      backdropMaterial = new THREE.MeshBasicMaterial({
        map: backdropTexture,
        toneMapped: false,
        depthWrite: false,
      });
      const plane = new THREE.Mesh(backdropGeometry, backdropMaterial);
      plane.renderOrder = -10;
      const material = backdropMaterial;
      // Only write colour into the transmission pass (rendered into a render target).
      plane.onBeforeRender = (r) => {
        material.colorWrite = r.getRenderTarget() !== null;
      };
      backdrop = plane;
      scene.add(plane);
    }

    /* Layout: put the mark over the anchor word, at a size that suits the screen. */
    const placement = { width: 1 };
    const layout = () => {
      const box = host.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      renderer.setSize(box.width, box.height, false);
      camera.aspect = box.width / box.height;
      camera.updateProjectionMatrix();
      const visibleHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const worldPerPx = visibleHeight / box.height;
      const word = anchor.getBoundingClientRect();
      const cx = word.left - box.left + word.width / 2;
      const cy = word.top - box.top + word.height * 0.52;
      const markPx = Math.min(word.width * (light ? 0.44 : 0.36), box.height * 0.62 * 1.64);
      // The mark sits nearer the camera, so shrink it to keep its on-screen size.
      const depthScale = (CAMERA_Z - MARK_Z) / CAMERA_Z;
      root.position.x = (cx - box.width / 2) * worldPerPx * depthScale;
      root.position.y = -(cy - box.height / 2) * worldPerPx * depthScale;
      root.scale.setScalar((markPx * worldPerPx * depthScale) / MARK_WIDTH);
      placement.width = markPx;
      if (backdrop) {
        backdrop.scale.set(visibleHeight * camera.aspect, visibleHeight, 1);
      }
      return true;
    };

    const repaint = () => {
      if (!backdropCanvas || !backdropTexture) return;
      const resized = paintBackdrop(
        backdropCanvas,
        host,
        anchor,
        glowRef?.current ?? null,
        Math.min(renderer.getPixelRatio(), 1.5),
      );
      // The GPU copy has a fixed size: start a new one when the canvas changed size.
      if (resized) backdropTexture.dispose();
      backdropTexture.needsUpdate = true;
    };

    /* Pointer: tilt toward it; when it comes close the halves pull apart a little. */
    const pointer = { x: 0, y: 0, near: 0 };
    const eased = { x: 0, y: 0, near: 0 };
    const onPointer = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      const word = anchor.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (word.left + word.width / 2),
        event.clientY - (word.top + word.height * 0.52),
      );
      pointer.near = Math.max(0, Math.min(1, 1 - distance / (placement.width * 0.9)));
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let lastSeconds = 0;
    const render = (seconds: number, delta: number) => {
      lastSeconds = seconds;
      const still = stillRef.current;
      const k = Math.min(1, delta * 3.5);
      eased.x += ((still ? 0 : pointer.x) - eased.x) * k;
      eased.y += ((still ? 0 : pointer.y) - eased.y) * k;
      eased.near += ((still ? 0 : pointer.near) - eased.near) * k;
      const sway = still ? 0 : 1;
      tilt.rotation.y = -0.38 + sway * Math.sin(seconds * 0.45) * 0.2 + eased.x * 0.5;
      tilt.rotation.x = 0.16 + sway * Math.sin(seconds * 0.37) * 0.07 + eased.y * 0.3;
      tilt.rotation.z = sway * Math.sin(seconds * 0.29) * 0.035;
      tilt.position.y = sway * Math.sin(seconds * 0.9) * 0.45;
      const drift = (still ? 0 : driftAt(seconds)) + eased.near * 0.45;
      original.position.set(-drift * 2.3, drift * 0.9, drift * 1.6);
      copy.position.set(drift * 2.3, -drift * 0.9, -drift * 1.6);
      original.rotation.z = drift * 0.08;
      copy.rotation.z = -drift * 0.08;
      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(() => {
      if (layout()) {
        repaint();
        render(lastSeconds, 0);
      }
    });
    observer.observe(host);
    layout();

    let frame = 0;
    let last = performance.now();
    const clockStart = last;
    const loop = (now: number) => {
      if (!activeRef.current) {
        frame = 0;
        return;
      }
      render((now - clockStart) / 1000, Math.min(0.05, (now - last) / 1000));
      last = now;
      frame = requestAnimationFrame(loop);
    };
    redrawRef.current = () => render(lastSeconds, 0);
    startRef.current = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    // Reveal once the headline has settled and the fonts are in (the backdrop copies the text).
    let disposed = false;
    const timers: number[] = [];
    const reveal = () => {
      if (disposed) return;
      layout();
      repaint();
      render(lastSeconds, 0);
      host.dataset.ready = 'true';
    };
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    void fontsReady.then(() => {
      timers.push(window.setTimeout(reveal, showAfterMs));
      // The text may still be settling (late font swap); paint again a little later.
      timers.push(window.setTimeout(reveal, showAfterMs + 1200));
    });
    render(0, 0);
    if (activeRef.current) startRef.current();

    return () => {
      disposed = true;
      timers.forEach((id) => window.clearTimeout(id));
      startRef.current = null;
      redrawRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
      observer.disconnect();
      originalGeometry.dispose();
      copyGeometry.dispose();
      originalMaterial.dispose();
      copyMaterial.dispose();
      backdropGeometry.dispose();
      backdropMaterial?.dispose();
      backdropTexture?.dispose();
      envTexture.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [anchorRef, glowRef, onFail, showAfterMs]);

  useEffect(() => {
    stillRef.current = reduced;
    activeRef.current = !reduced && visible && inView;
    if (activeRef.current) startRef.current?.();
    else if (reduced) redrawRef.current?.(); // settle on the still frame
  }, [reduced, visible, inView]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={className}
      data-scene="glass-mark"
      data-running={!reduced && visible && inView}
    />
  );
}
