import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backend, REACTIONS, type ReactionKind, type TribeDetail, type Tribe as TribeT, type TribeEvent, type TribeReaction, type TribeStatus } from '../backend';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { SettingRow } from '../components/SettingRow';
import { TextField } from '../components/TextField';
import { addDays, timeAgo, tribeChallenge, tribeStreak, weekBoard } from '../engine';
import { Confetti } from '../components/Confetti';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import './tribe.css';

const PENDING_KEY = 'lifeos.tribe.pendingCode';
const LAST_KEY = 'lifeos.tribe.last';
const HUES = ['move', 'nutrition', 'sleep', 'mind'] as const;
const inviteLink = (code: string) => `${location.origin}${location.pathname}#/tribe/join/${code}`;

/**
 * Tribe (designed in code, owner decisions): cooperative, free, a tab in the nav.
 * Members see each other's day, streak, patches, Sprint theme and score (each user can hide patches and score).
 * The only interaction is a high five. A day counts for the Tribe when at least half the members were active.
 */
export function Tribe() {
  const { user, today, tribesEnabled, tribeCount, refreshTribes, share, setShare } = useSession();
  const api = backend.tribes;
  const [tribes, setTribes] = useState<TribeT[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(() => { try { return localStorage.getItem(LAST_KEY); } catch { return null; } });
  const [detail, setDetail] = useState<TribeDetail | null>(null);
  const [sheet, setSheet] = useState<'create' | 'join' | 'settings' | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState(() => { try { return localStorage.getItem(PENDING_KEY) ?? ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadTribes = useCallback(async () => {
    if (!api || !user) return;
    const list = await api.myTribes(user.id).catch(() => [] as TribeT[]);
    setTribes(list);
    setActiveId((cur) => (cur && list.some((x) => x.id === cur) ? cur : list[0]?.id ?? null));
  }, [api, user]);

  const loadDetail = useCallback(async () => {
    if (!api || !activeId) { setDetail(null); return; }
    try { setDetail(await api.detail(activeId, addDays(today, -13))); } catch { /* keep the last one */ }
  }, [api, activeId, today]);

  useEffect(() => { loadTribes(); }, [loadTribes, tribeCount]);
  useEffect(() => { loadDetail(); try { if (activeId) localStorage.setItem(LAST_KEY, activeId); } catch { /* ignore */ } }, [loadDetail, activeId]);
  // Fresh data when coming back to the app, and every minute while open.
  useEffect(() => {
    const onFocus = () => loadDetail();
    window.addEventListener('focus', onFocus);
    const id = setInterval(loadDetail, 60_000);
    return () => { window.removeEventListener('focus', onFocus); clearInterval(id); };
  }, [loadDetail]);
  // An invite link was opened: offer to join.
  useEffect(() => { if (code && tribes !== null) setSheet('join'); }, [tribes]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = async (tribe: TribeT | null, joined: boolean) => {
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    if (!tribe) { setError(t('tribe.wrongCode')); setBusy(false); return; }
    if (joined && user) api?.logEvent(user.id, 'joined', today, { tribe: tribe.name }).catch(() => {});
    haptic(20);
    setActiveId(tribe.id);
    setSheet(null); setName(''); setCode(''); setError(''); setBusy(false);
    await refreshTribes();
    await loadTribes();
  };
  const create = async () => { if (!api) return; setBusy(true); try { await done(await api.create(name), false); } catch { setError(t('tribe.failed')); setBusy(false); } };
  const join = async () => { if (!api) return; setBusy(true); try { await done(await api.join(code), true); } catch { setError(t('tribe.failed')); setBusy(false); } };
  const leave = async () => {
    if (!api || !user || !activeId) return;
    setBusy(true);
    await api.leave(user.id, activeId).catch(() => {});
    setSheet(null); setBusy(false); setActiveId(null);
    await refreshTribes(); await loadTribes();
  };
  const invite = async () => {
    if (!detail) return;
    const url = inviteLink(detail.tribe.code);
    const text = t('tribe.inviteText', { name: detail.tribe.name, code: detail.tribe.code });
    try {
      if (navigator.share) await navigator.share({ title: 'Life OS', text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  // Not available in test mode (no shared database).
  if (!tribesEnabled) {
    return (
      <Screen>
        <TribeEmpty title={t('tribe.localTitle')} body={t('tribe.localBody')} />
        <Spacer />
        <AppNav active="tribe" />
      </Screen>
    );
  }

  const sheets = (
    <>
      <BottomSheet open={sheet === 'create'} onClose={() => setSheet(null)} title={t('tribe.createTitle')}>
        <TextField label={t('tribe.nameLabel')} icon="group" value={name} maxLength={40} placeholder={t('tribe.namePlaceholder')} onChange={(e) => setName(e.target.value)} error={error || undefined} />
        <Button block label={t('tribe.create')} busy={busy} disabled={!name.trim()} onClick={create} />
      </BottomSheet>
      <BottomSheet open={sheet === 'join'} onClose={() => { setSheet(null); setError(''); }} title={t('tribe.joinTitle')}>
        <TextField label={t('tribe.codeLabel')} icon="lock" value={code} maxLength={6} autoCapitalize="characters" placeholder="ABC234" onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }} error={error || undefined} />
        <Button block label={t('tribe.join')} busy={busy} disabled={code.trim().length !== 6} onClick={join} />
      </BottomSheet>
      <BottomSheet open={sheet === 'settings'} onClose={() => setSheet(null)} title={t('tribe.settingsTitle')}>
        <GlassPanel gap={8}>
          <SettingRow icon="task_alt" label={t('tribe.sharePatches')} on={share.patches} onChange={(v) => setShare({ patches: v })} />
          <SettingRow icon="insights" label={t('tribe.shareScore')} on={share.score} onChange={(v) => setShare({ score: v })} />
          <SettingRow icon="bolt" label={t('tribe.allowNudges')} on={share.nudges} onChange={(v) => setShare({ nudges: v })} />
        </GlassPanel>
        <p className="text-body-s text-secondary">{t('tribe.nudgesNote')}</p>
        <p className="text-body-s text-secondary">{t('tribe.privacy')}</p>
        <Button block variant="Secondary" label={t('tribe.another')} onClick={() => setSheet('join')} />
        <Button block variant="Ghost" label={t('tribe.leave')} busy={busy} onClick={leave} />
      </BottomSheet>
    </>
  );

  if (tribes === null) return <Screen><Spacer /><AppNav active="tribe" /></Screen>;

  if (tribes.length === 0) {
    return (
      <Screen>
        <TribeEmpty title={t('tribe.emptyTitle')} body={t('tribe.emptyBody')} />
        <Button block label={t('tribe.createCta')} onClick={() => { setError(''); setSheet('create'); }} />
        <Button block variant="Ghost" label={t('tribe.joinCta')} onClick={() => { setError(''); setSheet('join'); }} />
        <Spacer />
        <AppNav active="tribe" />
        {sheets}
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="tribe__header">
        <div className="tribe__title">
          <p className="text-mono-label text-secondary">{t('tribe.label')}</p>
          <h1 className="text-title-l text-primary">{detail?.tribe.name ?? ''}</h1>
        </div>
        <IconButton icon="settings" label={t('tribe.settingsTitle')} onClick={() => setSheet('settings')} />
      </header>
      {tribes.length > 1 && (
        <div className="chip-wrap">
          {tribes.map((x) => <Chip key={x.id} label={x.name} selected={x.id === activeId} onToggle={() => setActiveId(x.id)} />)}
        </div>
      )}
      {detail && <TribeBody detail={detail} me={user!.id} today={today} onInvite={invite} copied={copied}
        onReact={async (to, target, kind, on) => {
          if (!api || !user) return;
          haptic(on ? 15 : 5);
          const mark: TribeReaction = { from_user: user.id, to_user: to, event_id: target.eventId ?? null, day: target.day, kind };
          const same = (r: TribeReaction) => r.from_user === mark.from_user && r.to_user === to && r.event_id === mark.event_id && r.day === mark.day && r.kind === kind;
          setDetail((d) => d && ({ ...d, reactions: on ? [...d.reactions, mark] : d.reactions.filter((r) => !same(r)) }));
          await api.react(user.id, to, target, kind, on).catch(() => loadDetail());
        }}
        onNudge={async (to) => {
          if (!api || !user) return;
          haptic(20);
          const msg = Math.floor(Math.random() * tList('tribe.nudge.msgs').length);
          setDetail((d) => d && ({ ...d, nudges: [...d.nudges, { from_user: user.id, to_user: to, day: today, msg }] }));
          // Anything but "ok" or "already" means it didn't go: show the real state again.
          const res = await api.nudge(to, today, msg).catch(() => 'not_allowed' as const);
          if (res !== 'ok' && res !== 'already') await loadDetail();
        }} />}
      <Spacer />
      <AppNav active="tribe" />
      {sheets}
    </Screen>
  );
}

function TribeEmpty({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Spacer />
      <div className="hero"><Mascot name="core-welcome" size={220} animated /></div>
      <p className="text-mono-label text-brand text-center">{t('tribe.label')}</p>
      <h1 className="text-title-l text-primary text-center">{title}</h1>
      <p className="text-body-m text-secondary text-center">{body}</p>
    </>
  );
}

type ReactTarget = { eventId?: number; day: string };

function TribeBody({ detail, me, today, onInvite, copied, onReact, onNudge }: {
  detail: TribeDetail; me: string; today: string; onInvite: () => void; copied: boolean;
  onReact: (to: string, target: ReactTarget, kind: ReactionKind, on: boolean) => void;
  onNudge: (to: string) => void;
}) {
  const statusOf = useMemo(() => new Map(detail.statuses.map((s) => [s.user_id, s])), [detail.statuses]);
  const nameOf = (id: string) => (id === me ? t('tribe.you') : statusOf.get(id)?.display_name || t('tribe.someone'));
  const hue = (id: string) => HUES[Math.max(0, detail.members.indexOf(id)) % HUES.length];
  const active = detail.events.filter((e) => e.kind === 'active');
  const streak = tribeStreak(active, detail.members.length, today);
  const challenge = tribeChallenge(active, detail.members.length, today);
  // Celebrate once per Tribe per week when the challenge is reached.
  const cheerKey = `lifeos.tribeCheer.${detail.tribe.id}.${today.slice(0, 7)}-${Math.floor(Number(today.slice(8)) / 7)}`;
  const [cheer, setCheer] = useState(false);
  useEffect(() => {
    if (!challenge.reached) return;
    try { if (localStorage.getItem(cheerKey) !== '1') { localStorage.setItem(cheerKey, '1'); setCheer(true); haptic(40); } } catch { /* ignore */ }
  }, [challenge.reached, cheerKey]);
  const activeToday = new Set(active.filter((e) => e.day === today).map((e) => e.user_id)).size;
  const need = Math.ceil(detail.members.length / 2);
  // Members: me first, then by today's progress.
  const members = [...detail.members].sort((a, b) => (a === me ? -1 : b === me ? 1 : (statusOf.get(b)?.done ?? 0) - (statusOf.get(a)?.done ?? 0)));
  const feed = detail.events.filter((e) => e.kind !== 'active' || e.day === today).slice(0, 30);
  const board = useMemo(() => weekBoard(detail.events, detail.members, today), [detail.events, detail.members, today]);
  const msgs = tList('tribe.nudge.msgs');
  const nudgedMe = detail.nudges.filter((n) => n.to_user === me && n.day === today);
  const iNudged = new Set(detail.nudges.filter((n) => n.from_user === me && n.day === today).map((n) => n.to_user));
  const appear = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...motionTokens.page, delay: i * motionTokens.stagger } });

  return (
    <>
      {/* Pokes from friends today: a flat note, not a card (nothing here is tappable). */}
      {nudgedMe.length > 0 && (
        <motion.section {...appear(0)} className="tribe-poked" aria-label={t('tribe.nudge.title')}>
          <span className="text-mono-label text-brand tribe-poked__title"><Icon name="bolt" size={14} />{t('tribe.nudge.title')}</span>
          {nudgedMe.map((n) => (
            <span key={n.from_user} className="text-body-m text-primary">{t('tribe.nudge.line', { name: nameOf(n.from_user), msg: msgs[n.msg % msgs.length] })}</span>
          ))}
        </motion.section>
      )}
      <motion.section {...appear(0)} className="tribe-streak" aria-label={t('tribe.streakLabel')}>
        <span className="tribe-streak__flame"><Icon name="local_fire_department" size={28} /></span>
        <div className="tribe-streak__text">
          <span className="text-display-xl">{streak}</span>
          <span className="text-body-s">{t('tribe.streakBody', { n: activeToday, total: detail.members.length, need })}</span>
        </div>
      </motion.section>

      <motion.section {...appear(1)} className={`tribe-challenge glass-card${challenge.reached ? ' tribe-challenge--done' : ''}`} aria-labelledby="tribe-challenge">
        <div className="tribe-challenge__head">
          <span className="text-mono-label text-brand">{t('tribe.challenge.label')}</span>
          <span className="text-mono-caption text-secondary">{t('tribe.challenge.last', { n: challenge.lastDone, total: challenge.lastGoal })}</span>
        </div>
        <h2 id="tribe-challenge" className="text-title-s text-primary">
          {challenge.reached ? t('tribe.challenge.done') : t('tribe.challenge.title', { goal: challenge.goal })}
        </h2>
        <div className="tribe-challenge__bar" role="progressbar" aria-valuemin={0} aria-valuemax={challenge.goal} aria-valuenow={challenge.done} aria-label={t('tribe.challenge.label')}>
          <motion.span className="tribe-challenge__fill" initial={{ inlineSize: '0%' }} animate={{ inlineSize: `${Math.min(100, (challenge.done / challenge.goal) * 100)}%` }} transition={{ ...motionTokens.page, delay: 0.2 }} />
        </div>
        <span className="text-body-s text-secondary">{t(challenge.reached ? 'tribe.challenge.progressDone' : 'tribe.challenge.progress', { n: challenge.done, total: challenge.goal, left: Math.max(0, challenge.goal - challenge.done) })}</span>
        {cheer && <Confetti count={30} />}
      </motion.section>

      <motion.div {...appear(1)} className="tribe__invite">
        <span className="text-body-s text-secondary">{t('tribe.members', { n: detail.members.length })} · {t('tribe.code')} <strong className="text-mono-value text-primary">{detail.tribe.code}</strong></span>
        <Button variant="Secondary" label={copied ? t('tribe.copied') : t('tribe.invite')} onClick={onInvite} />
      </motion.div>

      <motion.section {...appear(2)} className="tribe__section" aria-labelledby="tribe-today">
        <h2 id="tribe-today" className="text-title-m text-primary">{t('tribe.todayTitle')}</h2>
        <GlassPanel gap={14}>
          {members.map((id) => (
            <MemberRow key={id} id={id} me={me} today={today} name={nameOf(id)} hue={hue(id)} status={statusOf.get(id)}
              reactions={detail.reactions.filter((r) => r.to_user === id && r.day === today && r.event_id === null)}
              nudged={iNudged.has(id)} onReact={(k, on) => onReact(id, { day: today }, k, on)} onNudge={() => onNudge(id)} />
          ))}
        </GlassPanel>
      </motion.section>

      <motion.section {...appear(3)} className="tribe__section" aria-labelledby="tribe-board">
        <h2 id="tribe-board" className="text-title-m text-primary">{t('tribe.board.title')}</h2>
        {board.rows.every((r) => r.activeDays === 0) ? (
          <p className="text-body-s text-secondary">{t('tribe.board.empty')}</p>
        ) : (
          <GlassPanel gap={14}>
            {board.rows.map((r, i) => (
              <div key={r.user_id} className="tribe-rank">
                <span className="tribe-rank__n text-mono-value text-secondary">{i + 1}</span>
                <span className={`tribe-avatar tribe-avatar--${hue(r.user_id)}`} aria-hidden="true">{initial(nameOf(r.user_id))}</span>
                <span className="tribe-rank__name text-body-m-strong text-primary">{nameOf(r.user_id)}</span>
                {r.crown && <span className="tribe-rank__crown" aria-label={t('tribe.board.leading')}><Icon name="crown" size={18} /></span>}
                <span className="text-mono-caption text-secondary">{r.activeDays === 0 ? t('tribe.board.none') : r.activeDays === 1 ? t('tribe.board.one') : t('tribe.board.days', { n: r.activeDays })}</span>
              </div>
            ))}
          </GlassPanel>
        )}
        {board.titles.length > 0 && (
          <ul className="tribe-titles" aria-label={t('tribe.board.titlesTitle')}>
            {board.titles.map((x) => (
              <li key={x.kind} className="tribe-title text-body-s text-secondary">
                <Icon name={x.kind === 'earlyBird' ? 'sunrise' : x.kind === 'finisher' ? 'task_alt' : 'trending_up'} size={16} />
                <span><strong className="text-primary">{t(`tribe.board.titles.${x.kind}.name`)}</strong> · {nameOf(x.user_id)} · {t(`tribe.board.titles.${x.kind}.body`)}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.section {...appear(4)} className="tribe__section" aria-labelledby="tribe-feed">
        <h2 id="tribe-feed" className="text-title-m text-primary">{t('tribe.feedTitle')}</h2>
        {feed.length === 0 && <p className="text-body-s text-secondary">{t('tribe.feedEmpty')}</p>}
        <AnimatePresence initial={false}>
          {feed.map((ev) => {
            const reacts = detail.reactions.filter((r) => r.event_id === ev.id);
            const ago = timeAgo(ev.created_at);
            return (
              <motion.div key={ev.id} layout className="tribe-event glass-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <span className={`tribe-avatar tribe-avatar--${hue(ev.user_id)}`} aria-hidden="true">{initial(nameOf(ev.user_id))}</span>
                <span className="tribe-event__text">
                  <span className="text-body-m text-primary">{eventText(ev, nameOf(ev.user_id))}</span>
                  <span className="text-mono-caption text-secondary">{ago.unit === 'now' ? t('tribe.ago.now') : t(`tribe.ago.${ago.unit}`, { n: ago.n })}</span>
                </span>
                <ReactionBar reactions={reacts} me={me} own={ev.user_id === me} onToggle={(k, on) => onReact(ev.user_id, { eventId: ev.id, day: ev.day }, k, on)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.section>
    </>
  );
}

const REACTION_ICON = { five: 'high_five', fire: 'local_fire_department', power: 'bolt' } as const;

/**
 * Reactions on a post or a day: three buttons (high five, fire, power) on other people's things,
 * only the counts on your own (nothing to tap there).
 */
function ReactionBar({ reactions, me, own, onToggle }: { reactions: TribeReaction[]; me: string; own: boolean; onToggle: (kind: ReactionKind, on: boolean) => void }) {
  const count = (k: ReactionKind) => reactions.filter((r) => r.kind === k).length;
  const mine = (k: ReactionKind) => reactions.some((r) => r.kind === k && r.from_user === me);
  if (own) {
    const shown = REACTIONS.filter((k) => count(k) > 0);
    if (!shown.length) return null;
    return (
      <span className="tribe-reacts">
        {shown.map((k) => (
          <span key={k} className="tribe-five tribe-five--count" aria-label={`${t(`tribe.react.${k}`)}: ${count(k)}`}><Icon name={REACTION_ICON[k]} size={20} /><span className="text-mono-caption">{count(k)}</span></span>
        ))}
      </span>
    );
  }
  return (
    <span className="tribe-reacts" role="group" aria-label={t('tribe.react.five')}>
      {REACTIONS.map((k) => (
        <motion.button key={k} type="button" className={`tribe-five${mine(k) ? ' tribe-five--on' : ''}`} aria-pressed={mine(k)} aria-label={t(`tribe.react.${k}`)} whileTap={{ scale: 0.85 }} onClick={() => onToggle(k, !mine(k))}>
          <motion.span key={String(mine(k))} initial={{ scale: mine(k) ? 0.5 : 1, rotate: mine(k) ? -20 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={motionTokens.pop}><Icon name={REACTION_ICON[k]} size={20} /></motion.span>
          {count(k) > 0 && <span className="text-mono-caption">{count(k)}</span>}
        </motion.button>
      ))}
    </span>
  );
}

function MemberRow({ id, me, today, name, hue, status, reactions, nudged, onReact, onNudge }: {
  id: string; me: string; today: string; name: string; hue: string; status?: TribeStatus;
  reactions: TribeReaction[]; nudged: boolean; onReact: (kind: ReactionKind, on: boolean) => void; onNudge: () => void;
}) {
  const fresh = status?.day === today;
  const done = fresh ? status!.done : 0;
  // Nudge only people who haven't started, who allow it, and who aren't you.
  const canNudge = id !== me && !!status && status.allow_nudges !== false && done === 0;
  const total = status?.total || 3;
  return (
    <div className="tribe-member">
      <span className={`tribe-avatar tribe-avatar--${hue}`} aria-hidden="true">{initial(name)}</span>
      <div className="tribe-member__mid">
        <div className="tribe-member__head">
          <span className="text-body-m-strong text-primary">{name}</span>
          <span className="tribe-member__chips">
            <span className="text-mono-caption text-secondary tribe-member__streak"><Icon name="local_fire_department" size={14} />{status?.streak ?? 0}</span>
            {status?.score != null && <span className="text-mono-caption text-secondary">{status.score.toFixed(1)}</span>}
          </span>
        </div>
        <div className="tribe-member__progress">
          <SegmentedProgress variant="today" total={total} filled={done} label={t('tribe.doneOf', { n: done, total })} />
          <span className="text-mono-caption text-primary">{done}/{total}</span>
        </div>
        {status?.sprint_number != null && (
          <span className="text-body-s text-secondary">
            {[t('tribe.weekN', { n: status.sprint_number }), status.sprint_theme, status.patch_titles?.join(', ')].filter(Boolean).join(' · ')}
          </span>
        )}
        {!status && id !== me && <span className="text-body-s text-secondary">{t('tribe.noStatus')}</span>}
        <div className="tribe-member__actions">
          <ReactionBar reactions={reactions} me={me} own={id === me} onToggle={onReact} />
          {canNudge && (nudged
            ? <span className="tribe-nudged text-mono-caption text-secondary"><Icon name="check" size={14} />{t('tribe.nudge.sent')}</span>
            : <motion.button type="button" className="tribe-nudge" whileTap={{ scale: 0.92 }} onClick={onNudge}><Icon name="bolt" size={18} /><span className="text-body-s">{t('tribe.nudge.cta')}</span></motion.button>)}
        </div>
      </div>
    </div>
  );
}

const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

function eventText(ev: TribeEvent, name: string): string {
  if (ev.kind === 'active') return t('tribe.ev.active', { name });
  if (ev.kind === 'all_done') return t('tribe.ev.allDone', { name });
  if (ev.kind === 'joined') return t('tribe.ev.joined', { name });
  const n = String(ev.payload.number ?? '').padStart(2, '0');
  return ev.payload.theme ? t('tribe.ev.releaseTheme', { name, n, theme: String(ev.payload.theme) }) : t('tribe.ev.release', { name, n });
}

/** Opened from an invite link: remember the code, then go to the Tribe tab (or log in first). */
export function TribeJoinLink() {
  const navigate = useNavigate();
  const { code } = useParams();
  const { ready, user } = useSession();
  useEffect(() => {
    if (!ready) return;
    try { if (code) localStorage.setItem(PENDING_KEY, code.toUpperCase().slice(0, 6)); } catch { /* ignore */ }
    navigate(user ? '/tribe' : '/', { replace: true });
  }, [ready, user, code, navigate]);
  return null;
}
