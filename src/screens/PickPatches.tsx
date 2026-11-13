import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import type { Area } from '../data/types';
import { areaScoresFromAnswers, recommend, type AnswerIndex } from '../engine';
import { t } from '../i18n';
import { PATCHES_PER_SPRINT, useOnboarding } from '../state/onboarding';
import { firstMissingQuestion, formatMinutes } from './flow';

const SPRINT_NUMBER = 1;

/** Pick patches (Figma 55:390). 4 offers from the engine, the user picks 3. */
export function PickPatches() {
  const navigate = useNavigate();
  const { state, setPicked, startSprint } = useOnboarding();
  const missing = firstMissingQuestion(state);

  const offers = useMemo(() => {
    if (missing) return [];
    const scores = areaScoresFromAnswers(state.answers as Record<Area, AnswerIndex>);
    return recommend({ items: ITEMS, symptoms: state.symptoms, scores, sprintNumber: SPRINT_NUMBER });
  }, [missing, state.answers, state.symptoms]);

  // Start with the top 3 offers picked (as in Figma). Reset if the offers changed.
  const offerIds = offers.map((o) => o.item.id);
  const validPicked = state.picked.filter((id) => offerIds.includes(id));
  useEffect(() => {
    if (offerIds.length && validPicked.length === 0) setPicked(offerIds.slice(0, PATCHES_PER_SPRINT));
    else if (validPicked.length !== state.picked.length) setPicked(validPicked);
  }, [offerIds.join(), validPicked.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  if (missing) return <Navigate to={missing} replace />;

  const toggle = (id: string) => {
    if (validPicked.includes(id)) setPicked(validPicked.filter((x) => x !== id));
    else if (validPicked.length < PATCHES_PER_SPRINT) setPicked([...validPicked, id]);
  };

  return (
    <Screen>
      <TopBar title={t('patches.topTitle')} trailing={t('patches.trailing')} onBack={() => navigate('/score')} />
      <h2 className="text-title-l text-primary">{t('patches.title')}</h2>
      <p className="text-body-s text-secondary">{t('patches.subtitle')}</p>
      {offers.map(({ item }) => (
        <PatchCard
          key={item.id}
          glyph={item.glyph}
          title={item.title}
          meta={formatMinutes(item.duration_min, t)}
          done={validPicked.includes(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}
      <Spacer />
      <Button
        block
        label={t('patches.cta', { n: SPRINT_NUMBER })}
        disabled={validPicked.length !== PATCHES_PER_SPRINT}
        onClick={() => { startSprint(validPicked); navigate('/ready'); }}
      />
    </Screen>
  );
}
