import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { fromMinutes, toMinutes } from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import './library.css';

/** Book NU03: complete protein per 150 kcal (g). */
const CPC: { key: string; g: number }[] = [
  { key: 'shellfish', g: 29 }, { key: 'chicken', g: 28 }, { key: 'leanMeat', g: 25 }, { key: 'tofu', g: 15 },
  { key: 'egg', g: 13 }, { key: 'bacon', g: 10 }, { key: 'pbToast', g: 6.5 }, { key: 'beansRice', g: 6 },
];
const KEY = 'lifeos.weight.v1';
const LB_PER_KG = 2.2; // book: kg = lb ÷ 2.2

/**
 * Nutrition tools (NU02c water formula + NU03b protein quality, designed in code).
 * Weight stays on this phone only. All numbers from the book.
 */
export function NutritionTool() {
  const navigate = useNavigate();
  const { wake } = useSession();
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [kg, setKg] = useState<number>(() => { try { return Number(localStorage.getItem(KEY)) || 70; } catch { return 70; } });
  const setWeight = (v: number) => {
    const next = Math.max(30, Math.min(250, Math.round(v * 10) / 10));
    setKg(next);
    try { localStorage.setItem(KEY, String(next)); } catch { /* ignore */ }
  };
  const shown = unit === 'kg' ? Math.round(kg) : Math.round(kg * LB_PER_KG);
  const step = (d: number) => { haptic(6); setWeight(unit === 'kg' ? kg + d : (shown + d) / LB_PER_KG); };

  const protein = [Math.round(kg * 1.6), Math.round(kg * 2.2)];
  const mlPerBout = Math.round(kg * 2); // Galpin: ~2 ml per kg every 15–20 min
  const until = fromMinutes(toMinutes(wake) + 600);
  const max = CPC[0].g;
  const appear = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...motionTokens.page, delay: i * motionTokens.stagger } });

  return (
    <Screen>
      <TopBar title={t('nutrition.title')} onBack={() => navigate('/library')} />
      <motion.div {...appear(0)}>
        <GlassPanel gap={8}>
          <span className="text-mono-label text-secondary">{t('nutrition.weight')}</span>
          <div className="nutri__weight">
            <motion.button type="button" className="nutri__step text-title-m" aria-label={t('nutrition.less')} whileTap={{ scale: 0.9 }} onClick={() => step(-1)}>−</motion.button>
            <span className="text-display-xl text-primary nutri__value" aria-live="polite">{shown}<span className="text-title-m text-secondary"> {unit}</span></span>
            <motion.button type="button" className="nutri__step text-title-m" aria-label={t('nutrition.more')} whileTap={{ scale: 0.9 }} onClick={() => step(1)}>+</motion.button>
          </div>
          <div className="chip-wrap nutri__units">
            <Chip label="kg" selected={unit === 'kg'} onToggle={() => setUnit('kg')} />
            <Chip label="lb" selected={unit === 'lb'} onToggle={() => setUnit('lb')} />
          </div>
          <span className="text-body-s text-secondary">{t('nutrition.private')}</span>
        </GlassPanel>
      </motion.div>

      <motion.section {...appear(1)} className="insights__section" aria-labelledby="nu-protein">
        <h2 id="nu-protein" className="text-title-m text-primary">{t('nutrition.proteinTitle')}</h2>
        <GlassPanel gap={8}>
          <span className="text-display-xl text-primary">{protein[0]}–{protein[1]} g</span>
          <span className="text-body-s text-secondary">{t('nutrition.proteinBody')}</span>
        </GlassPanel>
      </motion.section>

      <motion.section {...appear(2)} className="insights__section" aria-labelledby="nu-water">
        <h2 id="nu-water" className="text-title-m text-primary">{t('nutrition.waterTitle')}</h2>
        <GlassPanel gap={14}>
          <div className="nutri__row"><span className="text-body-m text-primary">{t('nutrition.waterWake')}</span><span className="text-mono-value text-primary">500–700 ml</span></div>
          <div className="nutri__row"><span className="text-body-m text-primary">{t('nutrition.waterDay', { time: until })}</span><span className="text-mono-value text-primary">2.4 L</span></div>
          <div className="nutri__row"><span className="text-body-m text-primary">{t('nutrition.waterSport')}</span><span className="text-mono-value text-primary">{mlPerBout} ml</span></div>
          <span className="text-body-s text-secondary">{t('nutrition.waterNote')}</span>
        </GlassPanel>
      </motion.section>

      <motion.section {...appear(3)} className="insights__section" aria-labelledby="nu-cpc">
        <h2 id="nu-cpc" className="text-title-m text-primary">{t('nutrition.cpcTitle')}</h2>
        <GlassPanel gap={8}>
          <span className="text-body-s text-secondary">{t('nutrition.cpcBody')}</span>
          {CPC.map((c, i) => (
            <div key={c.key} className="nutri__cpc">
              <div className="nutri__row"><span className="text-body-s text-primary">{t(`nutrition.foods.${c.key}`)}</span><span className="text-mono-caption text-primary">{c.g} g</span></div>
              <span className="nutri__track"><motion.span className="nutri__bar" initial={{ inlineSize: '0%' }} animate={{ inlineSize: `${(c.g / max) * 100}%` }} transition={{ ...motionTokens.page, delay: 0.2 + i * 0.04 }} /></span>
            </div>
          ))}
        </GlassPanel>
      </motion.section>
      <Spacer />
    </Screen>
  );
}
