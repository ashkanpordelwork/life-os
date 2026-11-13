// Mascot poses exported as SVG from the Figma `Components` page (Mascot Components frame).
const files = import.meta.glob('../assets/mascots/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const urls: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  urls[path.split('/').pop()!.replace('.svg', '')] = url;
}

export const mascotNames = Object.keys(urls).sort();

export type MascotName =
  | 'core-welcome' | 'core-thinking' | 'core-pointing' | 'core-curious'
  | 'morning-morning-light' | 'morning-breathing' | 'morning-drinking-water'
  | 'body-walking' | 'body-eating' | 'body-neck-and-wrist-stretch' | 'body-coffee-cut-off'
  | 'body-wind-down' | 'body-waking-up-a' | 'body-waking-up-b'
  | 'milestone-small-win' | 'milestone-all-done' | 'milestone-crouching' | 'milestone-release-shipped'
  | 'milestone-welcome-back' | 'rest-rest-day' | 'rest-busy-day'
  | 'state-hurrying' | 'state-reminder' | 'state-empty' | 'state-error-or-offline' | 'state-waiting'
  | 'safety-safety' | 'safety-talk-to-a-doctor'
  | 'face-great' | 'face-good' | 'face-okay'
  | 'sheet-front' | 'sheet-side' | 'sheet-back' | 'sheet-avatar-24px' | 'sheet-palette';

type MascotProps = {
  name: MascotName;
  /** Rendered width in px. Height follows the artwork ratio. */
  size: number;
  alt?: string;
};

/** Mascot artwork (image). Decorative by default. */
export function Mascot({ name, size, alt = '' }: MascotProps) {
  return <img src={urls[name]} alt={alt} width={size} style={{ inlineSize: size, blockSize: 'auto' }} />;
}
