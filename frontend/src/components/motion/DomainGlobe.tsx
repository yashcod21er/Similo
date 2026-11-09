import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useInView, usePageVisible, usePrefersReducedMotion } from './hooks';
import { canUseWebGL } from './webgl';

/**
 * The home hero's 3D scene (WebGL, three.js): a globe of glowing points — the
 * world's domains — with orange "copycat" points that flare up and arcs that
 * travel from your brand's point to each of them. It tilts toward the pointer.
 *
 * - Loaded lazily (only the home page downloads three.js).
 * - Pauses when off-screen or in a hidden tab; one still frame with reduced motion.
 * - If WebGL is unavailable it calls `onFail`, so the page can show a 2D fallback.
 */

const RADIUS = 1.6;
const CREAM = new THREE.Color('#f6f0e6');
const ORANGE = new THREE.Color('#ee8a45');
const BRAND = new THREE.Color('#ffb070');

const POINT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aFlare;
  attribute float aSeed;
  varying float vFlare;
  varying float vPulse;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vFlare = step(0.001, aFlare);
    vPulse = vFlare * pow(0.5 + 0.5 * sin(uTime * 1.4 + aFlare * 6.2831), 5.0);
    // Points facing the camera are bright, the far side fades away.
    vDepth = smoothstep(-8.6, -5.8, mv.z);
    float size = 2.1 + aSeed * 1.6 + vFlare * (3.0 + vPulse * 9.0);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
  }
`;

const POINT_FRAGMENT = /* glsl */ `
  uniform vec3 uCream;
  uniform vec3 uOrange;
  varying float vFlare;
  varying float vPulse;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    vec3 color = mix(uCream, uOrange, vFlare);
    float alpha = soft * mix(0.18, 1.0, vDepth);
    alpha *= mix(1.0, 0.7 + vPulse * 0.9, vFlare);
    gl_FragColor = vec4(color, alpha);
  }
`;

const RIM_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const RIM_FRAGMENT = /* glsl */ `
  uniform vec3 uOrange;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 4.0);
    gl_FragColor = vec4(uOrange, rim * 0.22);
  }
`;

/** Evenly spread points on a sphere (Fibonacci lattice). */
function spherePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions.set([Math.cos(theta) * r * RADIUS, y * RADIUS, Math.sin(theta) * r * RADIUS], i * 3);
  }
  return positions;
}

/** A tiny deterministic random generator, so the globe looks the same on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function DomainGlobe({
  className,
  onFail,
}: {
  className?: string;
  onFail?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();
  const inView = useInView(hostRef, { rootMargin: '120px' });
  const activeRef = useRef(false);
  const startRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

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

    const small = window.innerWidth < 768;
    const random = seeded(7);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);
    const globe = new THREE.Group();
    globe.rotation.x = 0.32;
    scene.add(globe);

    /* Domain points, some of them copycats that flare. */
    const count = small ? 1800 : 3600;
    const positions = spherePoints(count);
    const flare = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) seed[i] = random();
    const copycats: number[] = [];
    while (copycats.length < (small ? 10 : 16)) {
      const index = Math.floor(random() * count);
      if (!copycats.includes(index)) copycats.push(index);
    }
    copycats.forEach((index, k) => (flare[index] = (k + 1) / copycats.length));

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('aFlare', new THREE.BufferAttribute(flare, 1));
    pointGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const pointMaterial = new THREE.ShaderMaterial({
      vertexShader: POINT_VERTEX,
      fragmentShader: POINT_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uCream: { value: CREAM },
        uOrange: { value: ORANGE },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    globe.add(new THREE.Points(pointGeometry, pointMaterial));

    /* A dark core hides the far side, so it reads as a solid globe. */
    const coreGeometry = new THREE.SphereGeometry(RADIUS * 0.985, 64, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0x12110f });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.renderOrder = -1;
    globe.add(core);

    /* A faint orange atmosphere at the rim. */
    const rimGeometry = new THREE.SphereGeometry(RADIUS * 1.04, 64, 64);
    const rimMaterial = new THREE.ShaderMaterial({
      vertexShader: RIM_VERTEX,
      fragmentShader: RIM_FRAGMENT,
      uniforms: { uOrange: { value: ORANGE } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    globe.add(new THREE.Mesh(rimGeometry, rimMaterial));

    /* Your brand's point and the arcs that travel to each copycat. */
    const brand = new THREE.Vector3(0.55, 0.6, 1).normalize().multiplyScalar(RADIUS);
    const brandGeometry = new THREE.SphereGeometry(0.045, 24, 24);
    const brandMaterial = new THREE.MeshBasicMaterial({ color: BRAND });
    const brandDot = new THREE.Mesh(brandGeometry, brandMaterial);
    brandDot.position.copy(brand);
    globe.add(brandDot);
    const haloGeometry = new THREE.SphereGeometry(0.13, 24, 24);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: ORANGE,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.copy(brand);
    globe.add(halo);

    const SEGMENTS = 64;
    const arcs = copycats.slice(0, small ? 6 : 9).map((index, k) => {
      const end = new THREE.Vector3().fromArray(positions, index * 3);
      const lift = brand.distanceTo(end) * 0.55 + RADIUS;
      const mid = brand.clone().add(end).normalize().multiplyScalar(lift);
      const curve = new THREE.QuadraticBezierCurve3(brand, mid, end);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(SEGMENTS));
      const material = new THREE.LineBasicMaterial({
        color: ORANGE,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      globe.add(line);
      return { line, geometry, material, offset: k / 9 };
    });

    /* Pointer tilt. */
    const target = { x: 0, y: 0 };
    const onPointer = (event: PointerEvent) => {
      target.x = (event.clientX / window.innerWidth - 0.5) * 0.5;
      target.y = (event.clientY / window.innerHeight - 0.5) * 0.3;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let spin = 0;
    const render = (seconds: number, delta: number) => {
      pointMaterial.uniforms.uTime!.value = seconds;
      spin += delta * 0.07;
      globe.rotation.y = spin + target.x;
      globe.rotation.x += (0.32 + target.y - globe.rotation.x) * 0.04;
      for (const arc of arcs) {
        // Each arc draws itself from your brand to the copycat, holds, then fades.
        const p = (seconds * 0.16 + arc.offset) % 1;
        const head = Math.min(1, p / 0.45);
        const tail = Math.max(0, (p - 0.35) / 0.45);
        arc.geometry.setDrawRange(
          Math.floor(tail * SEGMENTS),
          Math.max(2, Math.floor((head - tail) * SEGMENTS) + 1),
        );
        arc.material.opacity = 0.75 * Math.sin(Math.PI * Math.min(1, p / 0.8));
      }
      halo.scale.setScalar(1 + 0.35 * Math.sin(seconds * 2.2));
      renderer.render(scene, camera);
    };

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
    startRef.current = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    // First frame straight away (and the only one with reduced motion).
    render(3.2, 0);
    if (activeRef.current) startRef.current();

    return () => {
      startRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onPointer);
      observer.disconnect();
      pointGeometry.dispose();
      pointMaterial.dispose();
      rimGeometry.dispose();
      rimMaterial.dispose();
      brandGeometry.dispose();
      brandMaterial.dispose();
      haloGeometry.dispose();
      haloMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      for (const arc of arcs) {
        arc.geometry.dispose();
        arc.material.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onFail]);

  useEffect(() => {
    activeRef.current = !reduced && visible && inView;
    if (activeRef.current) startRef.current?.();
  }, [reduced, visible, inView]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={className}
      data-scene="domain-globe"
      data-running={!reduced && visible && inView}
    />
  );
}
