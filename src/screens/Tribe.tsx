import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backend, type ReactionKind, type TribeDetail, type Tribe as TribeT, type TribeEvent, type TribeReaction } from '../backend';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Mascot } from '../components/Mascot';
import { Screen, Spacer } from '../components/Screen';
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
type Ring = 'done' | 'started' | 'idle';

const MORE_KINDS: ReactionKind[] = ['fire', 'power'];

/**
 * The Tribe as a small social feed (owner decision): a row of avatars with a ring for today,
 * then one feed of posts. The main action is "Cheer" (high five); "more" opens fire and power.
 * "Poke" is the only nudge. The weekly board sits under its own tab. Nothing shows health answers.
 */
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
  const [tab, setTab] = useState<'feed' | 'week'>('feed');
  const [more, setMore] = useState<{ to: string; target: ReactTarget } | null>(null);

  const msgs = tList('tribe.nudge.msgs');
  const nudgedMe = detail.nudges.filter((n) => n.to_user === me && n.day === today);
  const iNudged = new Set(detail.nudges.filter((n) => n.from_user === me && n.day === today).map((n) => n.to_user));
  const board = useMemo(() => weekBoard(detail.events, detail.members, today), [detail.events, detail.members, today]);
  const appear = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...motionTokens.page, delay: i * motionTokens.stagger } });

  // Today's ring per person: done (all habits), started (some), idle (not yet).
  const ringOf = (id: string): Ring => {
    const st = statusOf.get(id);
    if (!st || st.day !== today || st.done === 0) return 'idle';
    return st.done >= (st.total || 1) ? 'done' : 'started';
  };
  const activeToday = new Set(active.filter((e) => e.day === today).map((e) => e.user_id));
  // Members first, then by today's progress.
  const people = [...detail.members].sort((a, b) => (a === me ? -1 : b === me ? 1 : (statusOf.get(b)?.done ?? 0) - (statusOf.get(a)?.done ?? 0)));
  const notStarted = people.filter((id) => !activeToday.has(id));
  const events = detail.events.filter((e) => e.kind !== 'active' || e.day === today).slice(0, 30);
  const reactsOf = (eventId: number | null, to: string, day: string) =>
    detail.reactions.filter((r) => r.to_user === to && r.day === day && r.event_id === eventId);
  const canPoke = (id: string) => id !== me && !!statusOf.get(id) && statusOf.get(id)!.allow_nudges !== false;

  return (
    <>
      {/* Story row: one circle per person. Ring = today's progress. */}
      <motion.section {...appear(0)} className="tribe-stories" aria-label={t('tribe.todayTitle')}>
        {people.map((id) => {
          const ring = ringOf(id);
          const st = statusOf.get(id);
          return (
            <div key={id} className={`tribe-story tribe-story--${ring}`}>
              <span className={`tribe-story__ring tribe-story__ring--${ring}`}>
                <span className={`tribe-avatar tribe-avatar--${hue(id)}`} aria-hidden="true">{initial(nameOf(id))}</span>
              </span>
              <span className="tribe-story__name text-mono-caption text-primary">{nameOf(id)}</span>
              <span className="tribe-story__count text-mono-caption text-secondary">{st && st.day === today ? `${st.done}/${st.total || 1}` : '0/—'}</span>
            </div>
          );
        })}
      </motion.section>

      {/* One quiet summary line: streak and this week's goal. */}
      <motion.section {...appear(1)} className="tribe-summary" aria-label={t('tribe.streakLabel')}>
        <span className="tribe-summary__item"><Icon name="local_fire_department" size={16} /><span className="text-body-s text-primary">{t('tribe.summaryStreak', { n: streak })}</span></span>
        <span className="tribe-summary__item"><Icon name="trending_up" size={16} /><span className="text-body-s text-primary">{t('tribe.summaryWeek', { n: challenge.done, total: challenge.goal })}</span></span>
        {cheer && <Confetti count={30} />}
      </motion.section>

      <motion.div {...appear(1)} className="tribe__invite">
        <span className="text-body-s text-secondary">{t('tribe.members', { n: detail.members.length })} · {t('tribe.code')} <strong className="text-mono-value text-primary">{detail.tribe.code}</strong></span>
        <Button variant="Secondary" label={copied ? t('tribe.copied') : t('tribe.invite')} onClick={onInvite} />
      </motion.div>

      {nudgedMe.length > 0 && (
        <motion.section {...appear(2)} className="tribe-poked" aria-label={t('tribe.nudge.title')}>
          <span className="text-mono-label text-brand tribe-poked__title"><Icon name="bolt" size={14} />{t('tribe.nudge.title')}</span>
          {nudgedMe.map((n) => (
            <span key={n.from_user} className="text-body-m text-primary">{t('tribe.nudge.line', { name: nameOf(n.from_user), msg: msgs[n.msg % msgs.length] })}</span>
          ))}
        </motion.section>
      )}

      <div className="chip-wrap" role="tablist">
        <Chip label={t('tribe.tabFeed')} selected={tab === 'feed'} onToggle={() => setTab('feed')} />
        <Chip label={t('tribe.tabWeek')} selected={tab === 'week'} onToggle={() => setTab('week')} />
      </div>

      {tab === 'feed' && (
        <motion.section {...appear(3)} className="tribe-feed" aria-label={t('tribe.feedTitle')}>
          {notStarted.map((id) => (
            <article key={`wait-${id}`} className="tribe-post tribe-post--quiet">
              <div className="tribe-post__head">
                <span className={`tribe-avatar tribe-avatar--${hue(id)}`} aria-hidden="true">{initial(nameOf(id))}</span>
                <span className="tribe-post__who">
                  <span className="text-body-m text-primary">{id === me ? t('tribe.waitingYou') : t('tribe.waiting', { name: nameOf(id) })}</span>
                  <span className="text-mono-caption text-secondary">{t('tribe.notStartedHint')}</span>
                </span>
              </div>
              {canPoke(id) && (iNudged.has(id)
                ? <span className="tribe-nudged text-mono-caption text-secondary"><Icon name="check" size={14} />{t('tribe.nudge.sent')}</span>
                : <button type="button" className="tribe-nudge" onClick={() => onNudge(id)}><Icon name="bolt" size={18} /><span className="text-body-s">{t('tribe.nudge.cta')}</span></button>)}
            </article>
          ))}

          {events.length === 0 && notStarted.length === 0 && <p className="text-body-s text-secondary">{t('tribe.feedEmpty')}</p>}

          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const ago = timeAgo(ev.created_at);
              const reacts = reactsOf(ev.id, ev.user_id, ev.day);
              return (
                <motion.article key={ev.id} layout className="tribe-post glass-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="tribe-post__head">
                    <span className={`tribe-avatar tribe-avatar--${hue(ev.user_id)}`} aria-hidden="true">{initial(nameOf(ev.user_id))}</span>
                    <span className="tribe-post__who">
                      <span className="text-body-m-strong text-primary">{eventText(ev, nameOf(ev.user_id))}</span>
                      <span className="text-mono-caption text-secondary">{ago.unit === 'now' ? t('tribe.ago.now') : t(`tribe.ago.${ago.unit}`, { n: ago.n })}</span>
                    </span>
                  </div>
                  <CheerRow reactions={reacts} me={me} own={ev.user_id === me}
                    onCheer={() => { const on = !reacts.some((r) => r.kind === 'five' && r.from_user === me); onReact(ev.user_id, { eventId: ev.id, day: ev.day }, 'five', on); }}
                    onMore={() => setMore({ to: ev.user_id, target: { eventId: ev.id, day: ev.day } })} />
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.section>
      )}

      {tab === 'week' && (
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
      )}

      <BottomSheet open={!!more} onClose={() => setMore(null)} title={t('tribe.moreTitle')}>
        {more && (
          <div className="tribe-more">
            {MORE_KINDS.map((k) => {
              const on = reactsOf(more.target.eventId ?? null, more.to, more.target.day).some((r) => r.kind === k && r.from_user === me);
              return (
                <Button key={k} block variant={on ? 'Secondary' : 'Ghost'} label={`${t(`tribe.react.${k}`)}${on ? ' ✓' : ''}`}
                  onClick={() => onReact(more.to, more.target, k, !on)} />
              );
            })}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

/** Under each post: one "Cheer" button with the count, and "more" for fire and power. Your own posts only show counts. */
function CheerRow({ reactions, me, own, onCheer, onMore }: {
  reactions: TribeReaction[]; me: string; own: boolean; onCheer: () => void; onMore: () => void;
}) {
  const total = reactions.length;
  const mine = reactions.some((r) => r.kind === 'five' && r.from_user === me);
  if (own) {
    return <p className="tribe-post__stats text-mono-caption text-secondary">{total === 0 ? t('tribe.noCheers') : t('tribe.cheers', { n: total })}</p>;
  }
  return (
    <div className="tribe-post__actions">
      <motion.button type="button" className={`tribe-cheer${mine ? ' tribe-cheer--on' : ''}`} aria-pressed={mine} whileTap={{ scale: 0.92 }} onClick={onCheer}>
        <motion.span key={String(mine)} initial={{ scale: mine ? 0.6 : 1 }} animate={{ scale: 1 }} transition={motionTokens.pop}><Icon name="high_five" size={18} /></motion.span>
        <span className="text-body-s">{t('tribe.cheer')}</span>
        {total > 0 && <span className="text-mono-caption">{total}</span>}
      </motion.button>
      <button type="button" className="tribe-more-btn" aria-label={t('tribe.moreTitle')} onClick={onMore}><Icon name="more" size={20} /></button>
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
