import { motion } from 'motion/react';
import { HeatCell, type HeatLevel } from './HeatCell';
import { motionTokens } from '../styles/motion';
import './glass.css';
import './WeekStrip.css';

export interface WeekDay { letter: string; level: HeatLevel; label: string }

/**
 * WeekStrip (from Figma Done 56:393, "This week")
 * Glass card with a title and 7 days (HeatCell + day letter). Cells pop in one by one.
 */
export function WeekStrip({ title, days }: { title: string; days: WeekDay[] }) {
  return (
    <section className="week-strip glass-card">
      <p className="text-mono-label text-secondary">{title}</p>
      <div className="week-strip__days">
        {days.map((d, i) => (
          <div key={i} className="week-strip__day">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...motionTokens.pop, delay: 0.3 + i * motionTokens.stagger }} style={{ display: 'flex' }}>
              <HeatCell level={d.level} label={d.label} />
            </motion.span>
            <span className="text-mono-caption text-secondary" aria-hidden="true">{d.letter}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
