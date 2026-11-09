let cached: boolean | undefined;

/**
 * True when the browser can create a WebGL context. Checked once with a throwaway canvas (the
 * context is released straight away), so 3D scenes can fall back quietly instead of letting
 * three.js log errors when WebGL is disabled or blocked.
 */
export function canUseWebGL(): boolean {
  if (cached !== undefined) return cached;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    cached = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
