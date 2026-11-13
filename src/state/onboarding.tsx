import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Area, NeedTag, Sprint } from '../data/types';
import type { AnswerIndex } from '../engine';

/** Onboarding answers. Kept in localStorage only (no login, no database in this phase). */
export interface OnboardingState {
  symptoms: NeedTag[];
  answers: Partial<Record<Area, AnswerIndex>>;
  picked: string[];
  sprint: Sprint | null;
}

export const MAX_SYMPTOMS = 3;
export const PATCHES_PER_SPRINT = 3;

const STORAGE_KEY = 'lifeos.onboarding.v1';
const EMPTY: OnboardingState = { symptoms: [], answers: {}, picked: [], sprint: null };

function load(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function save(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage blocked: the app still works for this visit.
  }
}

interface OnboardingApi {
  state: OnboardingState;
  toggleSymptom: (tag: NeedTag) => void;
  setAnswer: (area: Area, answer: AnswerIndex) => void;
  setPicked: (ids: string[]) => void;
  /** Saves the new Sprint in the draft and returns it. */
  startSprint: (patchIds: string[]) => Sprint;
}

const Ctx = createContext<OnboardingApi | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(load);

  useEffect(() => save(state), [state]);

  const toggleSymptom = useCallback((tag: NeedTag) => {
    setState((s) => {
      if (s.symptoms.includes(tag)) return { ...s, symptoms: s.symptoms.filter((x) => x !== tag) };
      if (s.symptoms.length >= MAX_SYMPTOMS) return s;
      return { ...s, symptoms: [...s.symptoms, tag] };
    });
  }, []);

  const setAnswer = useCallback((area: Area, answer: AnswerIndex) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [area]: answer } }));
  }, []);

  const setPicked = useCallback((ids: string[]) => setState((s) => ({ ...s, picked: ids })), []);

  const startSprint = useCallback((patchIds: string[]) => {
    const sprint: Sprint = { number: 1, theme: null, length_days: 14, patch_ids: patchIds, started_at: new Date().toISOString() };
    setState((s) => ({ ...s, picked: patchIds, sprint }));
    return sprint;
  }, []);

  const api = useMemo(() => ({ state, toggleSymptom, setAnswer, setPicked, startSprint }), [state, toggleSymptom, setAnswer, setPicked, startSprint]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useOnboarding(): OnboardingApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return api;
}
