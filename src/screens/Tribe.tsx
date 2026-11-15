import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backend, type TribeDetail, type Tribe as TribeT, type TribeEvent, type TribeReaction } from '../backend';
import { BottomSheet } from '../components/BottomSheet';
import { Drawer } from '../components/Drawer';
import { IconTile } from '../components/IconTile';
import { ListRow } from '../components/ListRow';
import { Progress } from '../components/Progress';
import { getItem } from '../data';
import type { ShareSettings } from '../state/tribeStatus';
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
  const [sheet, setSheet] = useState<'create' | 'join' | null>(null);
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
      {detail ? <TribeBody detail={detail} me={user!.id} today={today} tribes={tribes} activeId={activeId} onSwitch={setActiveId}
        onInvite={invite} copied={copied} share={share} setShare={setShare} busy={busy} onLeave={leave}
        onJoinAnother={() => { setError(''); setSheet('join'); }} onCreate={() => { setError(''); setSheet('create'); }}
        onHighFive={async (ev, on) => {
          if (!api || !user) return;
          haptic(on ? 15 : 5);
          const mark: TribeReaction = { from_user: user.id, to_user: ev.user_id, event_id: ev.id, day: ev.day, kind: 'five' };
          const same = (r: TribeReaction) => r.from_user === user.id && r.event_id === ev.id && r.kind === 'five';
          setDetail((d) => d && ({ ...d, reactions: on ? [...d.reactions, mark] : d.reactions.filter((r) => !same(r)) }));
          await api.react(user.id, ev.user_id, { eventId: ev.id, day: ev.day }, 'five', on).catch(() => loadDetail());
        }}
        onNudge={async (to) => {
          if (!api || !user) return;
          haptic(20);
          const msg = Math.floor(Math.random() * tList('tribe.nudge.msgs').length);
          setDetail((d) => d && ({ ...d, nudges: [...d.nudges, { from_user: user.id, to_user: to, day: today, msg }] }));
          // Anything but "ok" or "already" means it didn't go: show the real state again.
          const res = await api.nudge(to, today, msg).catch(() => 'not_allowed' as const);
          if (res !== 'ok' && res !== 'already') await loadDetail();
        }} /> : <Spacer />}
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

type Ring = 'done' | 'started' | 'idle';
type MenuSheet = 'members' | 'week' | 'invite' | 'tribes' | 'settings' | 'leave';

/**
 * Tribe as a small social feed (owner decisions):
 * - top: Tribe name and a menu (☰); a row of avatars with a ring for today
 * - feed: one post per habit done, newest first. The only action is a high five, with a count (like a "like").
 *   Double-tap a post to high five it; tap the count to see who did.
 * - everything else (members and Poke, this week, invite, my Tribes, settings, leave) lives in the menu.
 * Health answers and symptoms are never shown. People who hide habit names show as "did a habit".
 */
function TribeBody({ detail, me, today, tribes, activeId, onSwitch, onInvite, copied, share, setShare, busy, onLeave, onJoinAnother, onCreate, onHighFive, onNudge }: {
  detail: TribeDetail; me: string; today: string; tribes: TribeT[]; activeId: string | null; onSwitch: (id: string) => void;
  onInvite: () => void; copied: boolean; share: ShareSettings; setShare: (s: Partial<ShareSettings>) => void;
  busy: boolean; onLeave: () => void; onJoinAnother: () => void; onCreate: () => void;
  onHighFive: (ev: TribeEvent, on: boolean) => void; onNudge: (to: string) => void;
}) {
  const statusOf = useMemo(() => new Map(detail.statuses.map((s) => [s.user_id, s])), [detail.statuses]);
  const nameOf = (id: string) => (id === me ? t('tribe.you') : statusOf.get(id)?.display_name || t('tribe.someone'));
  const hue = (id: string) => HUES[Math.max(0, detail.members.indexOf(id)) % HUES.length];
  const active = detail.events.filter((e) => e.kind === 'active');
  const streak = tribeStreak(active, detail.members.length, today);
  const challenge = tribeChallenge(active, detail.members.length, today);
  const board = useMemo(() => weekBoard(detail.events, detail.members, today), [detail.events, detail.members, today]);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<MenuSheet | null>(null);
  const [likesOf, setLikesOf] = useState<TribeEvent | null>(null);
  const open = (x: MenuSheet) => { setMenu(false); setSheet(x); };

  const msgs = tList('tribe.nudge.msgs');
  const nudgedMe = detail.nudges.filter((n) => n.to_user === me && n.day === today);
  const iNudged = new Set(detail.nudges.filter((n) => n.from_user === me && n.day === today).map((n) => n.to_user));
  const ringOf = (id: string): Ring => {
    const st = statusOf.get(id);
    if (!st || st.day !== today || st.done === 0) return 'idle';
    return st.done >= (st.total || 1) ? 'done' : 'started';
  };
  const people = [...detail.members].sort((a, b) => (a === me ? -1 : b === me ? 1 : (statusOf.get(b)?.done ?? 0) - (statusOf.get(a)?.done ?? 0)));
  const activeToday = people.filter((id) => ringOf(id) !== 'idle').length;
  const posts = detail.events.filter((e) => e.kind === 'habit').sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 60);
  const fivesOf = (ev: TribeEvent) => detail.reactions.filter((r) => r.event_id === ev.id && r.kind === 'five');
  const canPoke = (id: string) => id !== me && ringOf(id) === 'idle' && !!statusOf.get(id) && statusOf.get(id)!.allow_nudges !== false;

  return (
    <>
      <header className="tribe__header">
        <div className="tribe__title">
          <p className="text-mono-label text-secondary">{t('tribe.label')}</p>
          <h1 className="text-title-l text-primary">{detail.tribe.name}</h1>
        </div>
        <IconButton icon="menu" label={t('tribe.menu.title')} onClick={() => setMenu(true)} />
      </header>

      {/* Stories: one circle per person; the ring is today's progress (plain status, not a button). */}
      <section className="tribe-stories" aria-label={t('tribe.menu.members')}>
        {people.map((id) => (
          <div key={id} className="tribe-story">
            <span className={`tribe-story__ring tribe-story__ring--${ringOf(id)}`}>
              <span className={`tribe-avatar tribe-avatar--${hue(id)}`} aria-hidden="true">{initial(nameOf(id))}</span>
            </span>
            <span className="tribe-story__name text-mono-caption text-primary">{nameOf(id)}</span>
          </div>
        ))}
      </section>

      <section className="tribe-feed" aria-label={t('tribe.feedTitle')}>
        {posts.length === 0 && <p className="text-body-s text-secondary tribe-feed__empty">{t('tribe.feedEmptyHabits')}</p>}
        <AnimatePresence initial={false}>
          {posts.map((ev) => (
            <HabitPost key={ev.id} ev={ev} me={me} name={nameOf(ev.user_id)} hue={hue(ev.user_id)} fives={fivesOf(ev)}
              onHighFive={(on) => onHighFive(ev, on)} onShowLikes={() => setLikesOf(ev)} />
          ))}
        </AnimatePresence>
      </section>

      {/* Menu: everything that isn't the feed. */}
      <Drawer open={menu} onClose={() => setMenu(false)} title={t('tribe.menu.title')}>
        <ListRow icon="group" title={t('tribe.menu.members')} subtitle={t('tribe.menu.membersSub', { n: activeToday, total: detail.members.length })} onClick={() => open('members')} />
        <ListRow icon="crown" title={t('tribe.menu.week')} subtitle={t('tribe.menu.weekSub', { n: streak })} onClick={() => open('week')} />
        <ListRow icon="user_add" title={t('tribe.menu.invite')} subtitle={t('tribe.menu.inviteSub', { code: detail.tribe.code })} onClick={() => open('invite')} />
        <ListRow icon="route" title={t('tribe.menu.tribes')} subtitle={tribes.length > 1 ? t('tribe.menu.tribesSub', { n: tribes.length }) : t('tribe.menu.tribesSubOne')} onClick={() => open('tribes')} />
        <ListRow icon="settings" title={t('tribe.menu.settings')} subtitle={t('tribe.menu.settingsSub')} onClick={() => open('settings')} />
        <ListRow icon="logout" title={t('tribe.menu.leave')} subtitle={detail.tribe.name} onClick={() => open('leave')} />
      </Drawer>

      <BottomSheet open={sheet === 'members'} onClose={() => setSheet(null)} title={t('tribe.menu.members')}>
        <div className="tribe-sheet shadow-room shadow-room--sheet">
          {nudgedMe.length > 0 && (
            <section className="tribe-poked" aria-label={t('tribe.nudge.title')}>
              <span className="text-mono-label text-brand tribe-poked__title"><Icon name="bolt" size={14} />{t('tribe.nudge.title')}</span>
              {nudgedMe.map((n) => <span key={n.from_user} className="text-body-m text-primary">{t('tribe.nudge.line', { name: nameOf(n.from_user), msg: msgs[n.msg % msgs.length] })}</span>)}
            </section>
          )}
          {people.map((id) => {
            const st = statusOf.get(id);
            const fresh = st?.day === today;
            return (
              <div key={id} className="tribe-person">
                <span className={`tribe-story__ring tribe-story__ring--${ringOf(id)}`}><span className={`tribe-avatar tribe-avatar--${hue(id)}`} aria-hidden="true">{initial(nameOf(id))}</span></span>
                <span className="tribe-person__text">
                  <span className="text-body-m-strong text-primary">{nameOf(id)}</span>
                  <span className="text-body-s text-secondary">{t('tribe.memberLine', { done: fresh ? st!.done : 0, total: st?.total || 0, streak: st?.streak ?? 0 })}</span>
                </span>
                {canPoke(id) && (iNudged.has(id)
                  ? <span className="tribe-nudged text-mono-caption text-secondary"><Icon name="check" size={14} />{t('tribe.nudge.sent')}</span>
                  : <button type="button" className="tribe-nudge" onClick={() => onNudge(id)}><Icon name="bolt" size={18} /><span className="text-body-s">{t('tribe.nudge.cta')}</span></button>)}
              </div>
            );
          })}
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'week'} onClose={() => setSheet(null)} title={t('tribe.menu.week')}>
        <div className="tribe-sheet shadow-room shadow-room--sheet">
          <p className="tribe-summary__item text-body-m text-primary"><Icon name="local_fire_department" size={18} />{t('tribe.summaryStreak', { n: streak })}</p>
          <div className="tribe-week-goal">
            <span className="text-body-s text-secondary">{t('tribe.summaryWeek', { n: challenge.done, total: challenge.goal })}</span>
            <Progress value={challenge.done / Math.max(1, challenge.goal)} label={t('tribe.challenge.label')} />
          </div>
          {board.rows.every((r) => r.activeDays === 0) ? <p className="text-body-s text-secondary">{t('tribe.board.empty')}</p> : (
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
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'invite'} onClose={() => setSheet(null)} title={t('tribe.menu.invite')}>
        <p className="text-body-m text-secondary">{t('tribe.inviteBody')}</p>
        <p className="tribe-code text-mono-value text-primary">{detail.tribe.code}</p>
        <Button block label={copied ? t('tribe.copied') : t('tribe.invite')} onClick={onInvite} />
      </BottomSheet>

      <BottomSheet open={sheet === 'tribes'} onClose={() => setSheet(null)} title={t('tribe.menu.tribes')}>
        <div className="chip-wrap">
          {tribes.map((x) => <Chip key={x.id} label={x.name} selected={x.id === activeId} onToggle={() => { onSwitch(x.id); setSheet(null); }} />)}
        </div>
        <Button block variant="Secondary" label={t('tribe.another')} onClick={() => { setSheet(null); onJoinAnother(); }} />
        <Button block variant="Ghost" label={t('tribe.createCta')} onClick={() => { setSheet(null); onCreate(); }} />
      </BottomSheet>

      <BottomSheet open={sheet === 'settings'} onClose={() => setSheet(null)} title={t('tribe.settingsTitle')}>
        <GlassPanel gap={8}>
          <SettingRow icon="task_alt" label={t('tribe.sharePatches')} on={share.patches} onChange={(v) => setShare({ patches: v })} />
          <SettingRow icon="insights" label={t('tribe.shareScore')} on={share.score} onChange={(v) => setShare({ score: v })} />
          <SettingRow icon="bolt" label={t('tribe.allowNudges')} on={share.nudges} onChange={(v) => setShare({ nudges: v })} />
        </GlassPanel>
        <p className="text-body-s text-secondary">{t('tribe.namesNote')}</p>
        <p className="text-body-s text-secondary">{t('tribe.privacy')}</p>
      </BottomSheet>

      <BottomSheet open={sheet === 'leave'} onClose={() => setSheet(null)} title={t('tribe.leaveTitle', { name: detail.tribe.name })}>
        <p className="text-body-m text-secondary">{t('tribe.leaveBody')}</p>
        <Button block label={t('tribe.leave')} busy={busy} onClick={() => { setSheet(null); onLeave(); }} />
        <Button block variant="Ghost" label={t('common.back')} onClick={() => setSheet(null)} />
      </BottomSheet>

      <BottomSheet open={!!likesOf} onClose={() => setLikesOf(null)} title={t('tribe.likesTitle')}>
        <div className="tribe-sheet">
          {likesOf && fivesOf(likesOf).map((r) => (
            <div key={r.from_user} className="tribe-person">
              <span className={`tribe-avatar tribe-avatar--${hue(r.from_user)}`} aria-hidden="true">{initial(nameOf(r.from_user))}</span>
              <span className="text-body-m text-primary">{nameOf(r.from_user)}</span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

const DOUBLE_TAP_MS = 300;

/**
 * One habit post. The hand is the only action, with a count beside it (like a "like").
 * Double-tap the post to high five it (a big hand pops in the middle). Own posts: count only.
 */
function HabitPost({ ev, me, name, hue, fives, onHighFive, onShowLikes }: {
  ev: TribeEvent; me: string; name: string; hue: string; fives: TribeReaction[];
  onHighFive: (on: boolean) => void; onShowLikes: () => void;
}) {
  const own = ev.user_id === me;
  const mine = fives.some((r) => r.from_user === me);
  const item = typeof ev.payload.item_id === 'string' ? getItem(ev.payload.item_id) : undefined;
  const ago = timeAgo(ev.created_at);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const onTap = () => {
    if (own) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      setBurst((b) => b + 1);
      if (!mine) onHighFive(true);
    } else lastTap.current = now;
  };
  const count = fives.length;

  return (
    <motion.article layout className="tribe-post glass-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="tribe-post__head">
        <span className={`tribe-avatar tribe-avatar--${hue}`} aria-hidden="true">{initial(name)}</span>
        <span className="tribe-post__who">
          <span className="text-body-m-strong text-primary">{name}</span>
          <span className="text-mono-caption text-secondary">{ago.unit === 'now' ? t('tribe.ago.now') : t(`tribe.ago.${ago.unit}`, { n: ago.n })}</span>
        </span>
      </div>
      {/* Double-tap area (the habit itself). */}
      <div className="tribe-post__body" onPointerUp={onTap}>
        {item ? <IconTile glyph={item.glyph} size="M" /> : <span className="tribe-post__private"><Icon name="task_alt" size={22} /></span>}
        <span className="text-title-s text-primary">{item ? item.title : t('tribe.post.private')}</span>
        <AnimatePresence>
          {burst > 0 && (
            <motion.span key={burst} className="tribe-post__burst" aria-hidden="true"
              initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: [0.2, 1.25, 1], opacity: [0, 1, 1] }} exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.45 }} onAnimationComplete={() => setTimeout(() => setBurst(0), 250)}>
              <Icon name="high_five" size={56} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="tribe-post__actions">
        {own ? (
          <span className="tribe-hi tribe-hi--static" aria-hidden="true"><Icon name="high_five" size={22} /></span>
        ) : (
          <motion.button type="button" className={`tribe-hi${mine ? ' tribe-hi--on' : ''}`} aria-pressed={mine} aria-label={t('tribe.hiFive')} whileTap={{ scale: 0.85 }} onClick={() => onHighFive(!mine)}>
            <motion.span key={String(mine)} initial={{ scale: mine ? 0.5 : 1, rotate: mine ? -20 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={motionTokens.pop}><Icon name="high_five" size={24} /></motion.span>
          </motion.button>
        )}
        {count > 0
          ? <button type="button" className="tribe-hi-count text-body-s text-primary" onClick={onShowLikes}>{count === 1 ? t('tribe.oneHiFive') : t('tribe.hiFives', { n: count })}</button>
          : <span className="text-body-s text-secondary">{own ? t('tribe.noHiFivesYet') : t('tribe.beFirst')}</span>}
      </div>
    </motion.article>
  );
}

const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

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
