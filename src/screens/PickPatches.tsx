import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import { flagsFromHealth } from '../data/safetyRules';
import type { Area, ChecklistItem, NeedTag } from '../data/types';
import { areaScoresFromAnswers, recommend, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { MAX_PATCHES, MIN_PATCHES, PATCHES_PER_SPRINT, useOnboarding } from '../state/onboarding';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '../components/Icon';
import { motionTokens } from '../styles/motion';
import { useSession } from '../state/session';
import { firstMissingQuestion, cardMeta } from './flow';

/** Owner decision: show 6 offers (Figma shows 4). The top 3 start picked. */
const OFFERS = 6;
const SPRINT_NUMBER = 1;

/** Pick patches (Figma 55:390). Offers from the engine; the user picks 3 (default) to 5 (owner decision). */
export function PickPatches() {
  const navigate = useNavigate();
  const { state, setPicked, startSprint } = useOnboarding();
  const [info, setInfo] = useState<ChecklistItem | null>(null);
  const session = useSession();
  const missing = firstMissingQuestion(state);

  const offers = useMemo(() => {
    if (missing) return [];
    const scores = areaScoresFromAnswers(state.answers as Record<Area, AnswerIndex>);
    return recommend({ items: ITEMS, symptoms: state.symptoms, scores, sprintNumber: SPRINT_NUMBER, flags: flagsFromHealth(state.health), count: OFFERS });
  }, [missing, state.answers, state.symptoms, state.health]);

  // Start with the top 3 offers picked (as in Figma). Reset if the offers changed.
  const offerIds = offers.map((o) => o.item.id);
  const validPicked = state.picked.filter((id) => offerIds.includes(id));
  useEffect(() => {
    if (offerIds.length && validPicked.length === 0) setPicked(offerIds.slice(0, PATCHES_PER_SPRINT));
    else if (validPicked.length !== state.picked.length) setPicked(validPicked);
  }, [offerIds.join(), validPicked.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (missing) return <Navigate to={missing} replace />;

  // Which of the user's own answers this habit is for, e.g. "For: Always tired".
  const forTag = (needs: NeedTag[]) => {
    const hit = needs.find((n) => state.symptoms.includes(n));
    return hit ? t('patches.forTag', { what: t(`symptoms.${hit}`) }) : undefined;
  };

  const toggle = (id: string) => {
    if (validPicked.includes(id)) setPicked(validPicked.filter((x) => x !== id));
    else if (validPicked.length < MAX_PATCHES) setPicked([...validPicked, id]);
  };

  return (
    <Screen>
      <TopBar title={t('patches.topTitle')} trailing={t('patches.trailingRange', { n: validPicked.length, max: MAX_PATCHES })} onBack={() => navigate('/score')} />
      <h2 className="text-title-l text-primary">{t('patches.title')}</h2>
      <p className="text-body-s text-secondary">{t('patches.subtitle')}</p>
      {offers.map(({ item }) => (
        <PatchCard
          key={item.id}
          glyph={item.glyph}
          title={item.title}
          meta={cardMeta(item, t)}
          note={item.science_note}
          tag={forTag(item.needs)}
          done={validPicked.includes(item.id)}
          onOpen={() => setInfo(item)}
          onToggle={() => toggle(item.id)}
          checkLabel={t('patches.pick', { title: item.title })}
        />
      ))}
      <AnimatePresence initial={false}>
        {validPicked.length > PATCHES_PER_SPRINT && (
          <motion.p
            key="more"
            className="text-body-s text-secondary pick__hint"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: motionTokens.page }}
            exit={{ opacity: 0, transition: motionTokens.pageExit }}
          >
            <Icon name="info" size={16} /> {t('patches.moreHint')}
          </motion.p>
        )}
      </AnimatePresence>
      <p className="text-body-s text-secondary">{t('patches.tapHint')}</p>
      <Spacer />
      <BottomSheet open={!!info} onClose={() => setInfo(null)} eyebrow={info ? t(`areas.${info.area}`).toUpperCase() : undefined} title={info?.title ?? ''}>
        {info && (
          <div className="pick__info shadow-room shadow-room--sheet">
            <p className="text-body-m text-primary">{info.science_note}</p>
            {(['tiny', 'standard', 'stretch'] as const).map((v) => (
              <div key={v} className="pick__version">
                <span className="text-mono-label text-secondary">{t(`patch.versions.${v}`)} · {info.versions[v].time}</span>
                <span className="text-body-s text-primary">{info.versions[v].text}</span>
              </div>
            ))}
            <Button block label={validPicked.includes(info.id) ? t('patches.unpick') : t('patches.pickThis')} onClick={() => { toggle(info.id); setInfo(null); }} />
          </div>
        )}
      </BottomSheet>
      <Button
        block
        label={t('patches.cta', { n: SPRINT_NUMBER })}
        disabled={validPicked.length < MIN_PATCHES || validPicked.length > MAX_PATCHES}
        onClick={async () => {
          const sprint = startSprint(validPicked);
          if (session.user) await session.saveSprint(sprint);
          navigate('/ready');
        }}
      />
    </Screen>
  );
}
