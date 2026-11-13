import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { CheckCircle } from '../components/CheckCircle';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Screen, Spacer } from '../components/Screen';
import { StepList } from '../components/StepList';
import { TextButton } from '../components/TextButton';
import { TopBar } from '../components/TopBar';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import './library.css';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const back = (navigate: (to: string) => void) => () => navigate('/library');

/** Plays 40 Hz binaural beats in headphones (book FM01: 5 min before or during work). No sound file. */
function useBinaural() {
  const ctx = useRef<AudioContext | null>(null);
  const stop = () => { ctx.current?.close().catch(() => {}); ctx.current = null; };
  const start = () => {
    stop();
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const c = new Ctx();
      // Left 200 Hz, right 240 Hz: the brain hears the 40 Hz difference.
      [[200, -1], [240, 1]].forEach(([f, pan]) => {
        const o = c.createOscillator(); const g = c.createGain(); const p = c.createStereoPanner();
        o.frequency.value = f; g.gain.value = 0.06; p.pan.value = pan;
        o.connect(g).connect(p).connect(c.destination); o.start();
      });
      ctx.current = c;
    } catch { /* no audio */ }
  };
  useEffect(() => stop, []);
  return { start, stop };
}

/** Counts up while running. */
function useStopwatch() {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [startedAt]);
  return { running: startedAt !== null, seconds: startedAt ? Math.floor((now - startedAt) / 1000) : 0, start: () => { setStartedAt(Date.now()); setNow(Date.now()); }, stop: () => setStartedAt(null) };
}

/**
 * Focus session (FM01 + FM05, designed in code). Get ready (book's foundational tools), optional 40 Hz beats,
 * then a work clock with a micro-rest button. "Work fasted" is left out when "Skipping meals" was picked (R14).
 */
export function FocusSession() {
  const navigate = useNavigate();
  const { profile } = useSession();
  const [checked, setChecked] = useState<number[]>([]);
  const [beats, setBeats] = useState(false);
  const [rest, setRest] = useState<number | null>(null);
  const audio = useBinaural();
  const clock = useStopwatch();
  const meals = profile?.symptoms.includes('meals');
  const prep = tList(meals ? 'focus.prepNoFast' : 'focus.prep');

  useEffect(() => {
    if (rest === null) return;
    if (rest <= 0) { setRest(null); haptic(20); return; }
    const id = setTimeout(() => setRest(rest - 1), 1000);
    return () => clearTimeout(id);
  }, [rest]);

  const toggleBeats = () => { if (beats) audio.stop(); else audio.start(); setBeats(!beats); };
  const end = () => { clock.stop(); audio.stop(); setBeats(false); };

  return (
    <Screen>
      <TopBar title={t('focus.title')} onBack={() => { end(); back(navigate)(); }} />
      {!clock.running ? (
        <>
          <p className="text-body-s text-secondary">{t('focus.intro')}</p>
          <GlassPanel gap={8}>
            {prep.map((p, i) => {
              const on = checked.includes(i);
              return (
                <button key={p} type="button" className="focus__check" aria-pressed={on} onClick={() => { haptic(8); setChecked(on ? checked.filter((x) => x !== i) : [...checked, i]); }}>
                  <CheckCircle done={on} />
                  <span className="text-body-m text-primary">{p}</span>
                </button>
              );
            })}
          </GlassPanel>
          <GlassPanel gap={8}>
            <span className="text-body-m-strong text-primary">{t('focus.beatsTitle')}</span>
            <span className="text-body-s text-secondary">{t('focus.beatsBody')}</span>
            <div><Chip label={beats ? t('focus.beatsOn') : t('focus.beatsOff')} selected={beats} onToggle={toggleBeats} /></div>
          </GlassPanel>
          <Spacer />
          <Button block label={t('focus.start')} onClick={() => { haptic(15); clock.start(); }} />
        </>
      ) : (
        <>
          <div className="tool__stage">
            <motion.div className="tool__breath" animate={{ scale: rest !== null ? 0.75 : [0.92, 1, 0.92] }} transition={rest !== null ? motionTokens.page : { duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
            <AnimatePresence mode="wait">
              <motion.div key={rest !== null ? 'rest' : 'work'} className="focus__center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="tool__time text-display-xl text-primary" role="timer">{rest !== null ? `${rest}` : mmss(clock.seconds)}</p>
                <p className="text-body-s text-secondary text-center">{rest !== null ? t('focus.resting') : t('focus.working')}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="text-body-s text-secondary text-center">{t('focus.restHint')}</p>
          <Spacer />
          <Button block label={t('focus.microRest')} disabled={rest !== null} onClick={() => { haptic(10); setRest(10); }} />
          <Button block variant="Ghost" label={t('focus.end')} onClick={end} />
        </>
      )}
    </Screen>
  );
}

const WOOP_KEY = 'lifeos.woop.v1';
type Woop = { wish: string; outcome: string; obstacle: string; plan: string; at: string };
const FIELDS = ['wish', 'outcome', 'obstacle', 'plan'] as const;

/** WOOP (FM02, designed in code). Four short steps; saved on this phone only. */
export function WoopTool() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Woop[]>(() => { try { return JSON.parse(localStorage.getItem(WOOP_KEY) ?? '[]'); } catch { return []; } });
  const writing = step < FIELDS.length;
  const f = FIELDS[Math.min(step, FIELDS.length - 1)];

  const save = () => {
    const next = [{ wish: draft.wish ?? '', outcome: draft.outcome ?? '', obstacle: draft.obstacle ?? '', plan: draft.plan ?? '', at: new Date().toISOString() }, ...saved];
    setSaved(next);
    try { localStorage.setItem(WOOP_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setStep(FIELDS.length);
    haptic(20);
  };

  return (
    <Screen>
      <TopBar title={t('woop.title')} trailing={writing ? t('common.step', { n: step + 1, total: FIELDS.length }) : undefined} onBack={() => (writing && step > 0 ? setStep(step - 1) : back(navigate)())} />
      {writing ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={f} className="woop__step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: motionTokens.page }} exit={{ opacity: 0, x: -20, transition: motionTokens.pageExit }}>
            <p className="text-mono-label text-brand">{t(`woop.${f}.letter`)}</p>
            <h2 className="text-title-l text-primary">{t(`woop.${f}.title`)}</h2>
            <p className="text-body-s text-secondary">{t(`woop.${f}.hint`)}</p>
            <label className="visually-hidden" htmlFor={`woop-${f}`}>{t(`woop.${f}.title`)}</label>
            <textarea id={`woop-${f}`} className="woop__area text-body-m" rows={5} value={draft[f] ?? ''} placeholder={t(`woop.${f}.placeholder`)} onChange={(e) => setDraft({ ...draft, [f]: e.target.value })} />
            <Button block label={step === FIELDS.length - 1 ? t('woop.save') : t('common.continue')} disabled={!(draft[f] ?? '').trim()} onClick={() => (step === FIELDS.length - 1 ? save() : setStep(step + 1))} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          <p className="text-body-s text-secondary">{t('woop.savedIntro')}</p>
          {saved.map((w) => (
            <GlassPanel key={w.at} gap={8}>
              <span className="text-body-m-strong text-primary">{w.wish}</span>
              <span className="text-body-s text-secondary">{t('woop.ifThen')} {w.plan}</span>
            </GlassPanel>
          ))}
          <Spacer />
          <Button block label={t('woop.new')} onClick={() => { setDraft({}); setStep(0); }} />
        </>
      )}
      {writing && saved.length > 0 && step === 0 && <TextButton label={t('woop.seeSaved', { n: saved.length })} onClick={() => setStep(FIELDS.length)} />}
    </Screen>
  );
}

/** Leeway around the book's targets so the zone is a band, not a single point (app choice). */
const TOLERANCE = 0.05;

/** 85% rule (FM03, designed in code). Tally hits and misses; the book's sweet spot is 15% errors (thinking) up to 30% (movement). */
export function ErrorZone() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<'think' | 'move'>('think');
  const [hit, setHit] = useState(0);
  const [miss, setMiss] = useState(0);
  const total = hit + miss;
  const err = total ? miss / total : 0;
  const lo = 0.15;
  const hi = kind === 'think' ? 0.15 : 0.3;
  const zone = total < 5 ? 'start' : err < lo - TOLERANCE ? 'easy' : err > hi + TOLERANCE ? 'hard' : 'right';
  return (
    <Screen>
      <TopBar title={t('errors85.title')} onBack={back(navigate)} />
      <p className="text-body-s text-secondary">{t('errors85.intro')}</p>
      <div className="chip-wrap" role="radiogroup" aria-label={t('errors85.kind')}>
        <Chip label={t('errors85.think')} selected={kind === 'think'} onToggle={() => setKind('think')} />
        <Chip label={t('errors85.move')} selected={kind === 'move'} onToggle={() => setKind('move')} />
      </div>
      <GlassPanel gap={14}>
        <div className="errors__head">
          <span className="text-display-xl text-primary">{Math.round(err * 100)}%</span>
          <span className="text-body-s text-secondary">{t('errors85.errors', { n: miss, total })}</span>
        </div>
        <div className="errors__bar" aria-hidden="true">
          <span className="errors__zone" style={{ insetInlineStart: `${(lo - TOLERANCE) * 100}%`, inlineSize: `${(hi - lo + 2 * TOLERANCE) * 100}%` }} />
          <motion.span className="errors__dot" animate={{ insetInlineStart: `${Math.min(100, err * 100)}%` }} transition={motionTokens.press} />
        </div>
        <p className="text-body-m text-primary" role="status">{t(`errors85.zone.${zone}`, { p: Math.round(hi * 100) })}</p>
      </GlassPanel>
      <Spacer />
      <div className="errors__buttons">
        <Button block label={t('errors85.hit')} onClick={() => { haptic(8); setHit(hit + 1); }} />
        <Button block variant="Secondary" label={t('errors85.miss')} onClick={() => { haptic(20); setMiss(miss + 1); }} />
      </div>
      {total > 0 && <TextButton label={t('errors85.reset')} onClick={() => { setHit(0); setMiss(0); }} />}
    </Screen>
  );
}

/** Self-test (FM06, designed in code). 1–5 min, eyes closed, recall without notes. */
export function SelfTest() {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(3);
  const [left, setLeft] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) { setLeft(null); setDone(true); haptic(150); return; }
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <Screen>
      <TopBar title={t('selfTest.title')} onBack={back(navigate)} />
      {left === null && !done && (
        <div className="chip-wrap" role="radiogroup" aria-label={t('nsdr.length')}>
          {[1, 3, 5].map((n) => <Chip key={n} label={t('time.minutes', { n })} selected={minutes === n} onToggle={() => setMinutes(n)} />)}
        </div>
      )}
      <div className="tool__stage">
        <motion.div className="tool__breath" animate={{ scale: left !== null ? [0.9, 1, 0.9] : 0.9 }} transition={left !== null ? { duration: 8, repeat: Infinity } : { duration: 0.3 }} />
        <p className="tool__time text-display-xl text-primary" role="timer">{mmss(left ?? (done ? 0 : minutes * 60))}</p>
      </div>
      {done ? <p className="text-title-m text-primary text-center" role="status">{t('selfTest.done')}</p> : <GlassPanel gap={8}><StepList steps={tList('selfTest.steps')} /></GlassPanel>}
      <Spacer />
      {left === null ? <Button block label={done ? t('nsdr.again') : t('nsdr.start')} onClick={() => { setDone(false); setLeft(minutes * 60); }} /> : <Button block variant="Ghost" label={t('nsdr.stop')} onClick={() => setLeft(null)} />}
    </Screen>
  );
}
