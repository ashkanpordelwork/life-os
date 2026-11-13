import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { Mascot, type MascotName } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { TextButton } from '../components/TextButton';
import { t } from '../i18n';
import { haptic, motionTokens } from '../styles/motion';
import './onboarding.css';

const SLIDES: { key: string; mascot: MascotName }[] = [
  { key: 'sprint', mascot: 'core-pointing' },
  { key: 'patch', mascot: 'morning-morning-light' },
  { key: 'release', mascot: 'milestone-release-shipped' },
  { key: 'levels', mascot: 'milestone-small-win' },
];

/**
 * Intro (designed in code, owner decision): what Sprint, Patch, Release and Levels mean.
 * Swipe or tap Next. Skip goes straight to the questions.
 */
export function Intro() {
  const navigate = useNavigate();
  const [[i, dir], setI] = useState<[number, number]>([0, 1]);
  const last = i === SLIDES.length - 1;
  const go = (n: number) => {
    if (n < 0) { navigate('/'); return; }
    if (n >= SLIDES.length) { navigate('/symptoms'); return; }
    haptic(8);
    setI([n, n > i ? 1 : -1]);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(i + 1);
    else if ((info.offset.x > 60 || info.velocity.x > 400) && i > 0) go(i - 1);
  };
  const s = SLIDES[i];

  return (
    <Screen>
      <div className="intro__top">
        <IconButton icon="arrow_back" label={t('common.back')} onClick={() => go(i - 1)} />
        {!last && <TextButton label={t('intro.skip')} onClick={() => navigate('/symptoms')} />}
      </div>
      <Spacer />
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={s.key}
          className="intro__slide"
          custom={dir}
          initial={{ opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0, transition: motionTokens.page }}
          exit={{ opacity: 0, x: dir * -60, transition: motionTokens.pageExit }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
        >
          <div className="hero"><Mascot name={s.mascot} size={220} animated /></div>
          <p className="text-mono-label text-brand text-center">{t(`intro.${s.key}.label`)}</p>
          <h1 className="text-title-l text-primary text-center">{t(`intro.${s.key}.title`)}</h1>
          <p className="text-body-m text-secondary text-center">{t(`intro.${s.key}.body`)}</p>
        </motion.div>
      </AnimatePresence>
      <Spacer />
      <div className="intro__dots"><SegmentedProgress total={SLIDES.length} filled={i + 1} label={t('common.step', { n: i + 1, total: SLIDES.length })} /></div>
      <Button block label={last ? t('intro.start') : t('intro.next')} onClick={() => go(i + 1)} />
    </Screen>
  );
}
