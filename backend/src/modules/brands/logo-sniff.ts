/**
 * Logo uploads: the file type is decided by the file's first bytes ("magic
 * bytes"), never by its name or the Content-Type the browser sent, because both
 * are chosen by the client and are trivial to fake.
 *
 * Only three raster formats are accepted. SVG is refused on purpose: it is a
 * document that can contain scripts and links, so serving it back is risky.
 * GIF and everything else are refused too.
 */
export const LOGO_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type LogoContentType = (typeof LOGO_CONTENT_TYPES)[number];

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function ascii(text: string): number[] {
  return [...text].map((char) => char.charCodeAt(0));
}

/** The image type the bytes really are, or null when it is not PNG, JPEG or WebP. */
export function sniffLogoType(bytes: Uint8Array): LogoContentType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png';
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg';
  // WebP: "RIFF" <4-byte size> "WEBP"
  if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8)) {
    return 'image/webp';
  }
  return null;
}

const MAX_FILE_NAME_LENGTH = 100;

/**
 * The uploaded file's name, made safe to display: no folder path, no control or
 * invisible formatting characters (such as right-to-left overrides that can
 * disguise "gpj.exe" as "exe.jpg"), single spaces, at most 100 characters.
 * It is only ever shown as text; it is never used as a path or in a header.
 */
export function sanitizeFileName(name: string | undefined): string {
  const base = (name ?? '').split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .normalize('NFC')
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const short = [...cleaned].slice(0, MAX_FILE_NAME_LENGTH).join('').trim();
  return short || 'logo';
}
