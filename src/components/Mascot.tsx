import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from '../styles/motion';

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
  /** Hero use: pops in, then floats gently up and down. */
  animated?: boolean;
};

/** Mascot artwork (image). Decorative by default. */
export function Mascot({ name, size, alt = '', animated = false }: MascotProps) {
  const reduce = useReducedMotion();
  const img = <img src={urls[name]} alt={alt} width={size} style={{ inlineSize: size, blockSize: 'auto' }} draggable={false} />;
  if (!animated || reduce) return img;
  return (
    <motion.div initial={{ scale: 0.6, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ ...motionTokens.pop, delay: 0.05 }}>
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }}>
        {img}
      </motion.div>
    </motion.div>
  );
}
