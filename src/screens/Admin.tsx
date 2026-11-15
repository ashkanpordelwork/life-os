import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { backend, type AdminProRequest, type AdminStats, type AdminTribe, type AdminUser, type AdminUserInfo } from '../backend';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { ListRow } from '../components/ListRow';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { getItem } from '../data';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import './admin.css';

type Tab = 'requests' | 'stats' | 'users' | 'tribes' | 'message';

/**
 * Admin dashboard (/admin, designed in code). Only for accounts with is_admin in the database.
 * Admins see counts, people's activity (last active, days, plan) and can give or take Pro by email.
 * Health answers, symptoms and score answers are never loaded here.
 */
export function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useSession();
  const [tab, setTab] = useState<Tab>('requests');
  if (!isAdmin || !backend.admin) return <Navigate to="/today" replace />;

  return (
    <Screen>
      <TopBar title={t('admin.title')} onBack={() => navigate('/you')} />
      <div className="chip-wrap" role="tablist">
        {(['requests', 'stats', 'users', 'tribes', 'message'] as const).map((k) => (
          <Chip key={k} label={t(`admin.tabs.${k}`)} selected={tab === k} onToggle={() => setTab(k)} />
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionTokens.page} className="admin__body">
        {tab === 'requests' && <Requests />}
        {tab === 'stats' && <Stats />}
        {tab === 'users' && <Users />}
        {tab === 'tribes' && <Tribes />}
        {tab === 'message' && <Message />}
      </motion.div>
      <Spacer />
    </Screen>
  );
}

/** Pro requests: approve or decline. The user gets a push with the answer. */
function Requests() {
  const [list, setList] = useState<AdminProRequest[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const load = async () => { try { setList(await backend.admin!.proRequests()); setErr(false); } catch { setList([]); setErr(true); } };
  useEffect(() => { load(); }, []);
  const decide = async (r: AdminProRequest, approve: boolean) => {
    setBusy(r.id + (approve ? ':y' : ':n'));
    try { await backend.admin!.decidePro(r.id, approve); setList((l) => (l ?? []).filter((x) => x.id !== r.id)); } catch { setErr(true); }
    setBusy(null);
  };
  if (list === null) return <p className="text-body-s text-secondary">{t('admin.loading')}</p>;
  return (
    <>
      {err && <p className="text-body-s text-secondary">{t('admin.requestsError')}</p>}
      {!err && list.length === 0 && <p className="text-body-s text-secondary">{t('admin.noRequests')}</p>}
      {list.map((r) => (
        <div key={r.id} className="admin__tribe glass-card">
          <div className="admin__tribe-head">
            <span className="text-body-m-strong text-primary">{r.name || t('admin.noName')}</span>
            <span className="text-mono-caption text-secondary">{r.email}</span>
          </div>
          <span className="text-body-s text-secondary">{t('admin.asked', { date: new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })}</span>
          <div className="admin__decide">
            <Button block variant="Secondary" label={t('admin.decline')} busy={busy === r.id + ':n'} disabled={!!busy} onClick={() => decide(r, false)} />
            <Button block label={t('admin.approve')} busy={busy === r.id + ':y'} disabled={!!busy} onClick={() => decide(r, true)} />
          </div>
        </div>
      ))}
    </>
  );
}

function Stats() {
  const [s, setS] = useState<AdminStats | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { backend.admin!.stats().then(setS).catch(() => setErr(true)); }, []);
  if (err) return <p className="text-body-s text-secondary">{t('admin.error')}</p>;
  if (!s) return <p className="text-body-s text-secondary">{t('admin.loading')}</p>;
  // Old founders count as Pro (owner decision: no founder status any more).
  const plans = ['pro', 'free'] as const;
  const planCount = (p: 'pro' | 'free') => (p === 'pro' ? (s.plans.pro ?? 0) + (s.plans.founder ?? 0) : s.plans.free ?? 0);
  return (
    <>
      <div className="admin__grid">
        <StatChip fill icon="person" value={s.users} label={t('admin.users')} />
        <StatChip fill icon="route" value={s.new_7d} label={t('admin.new7')} />
        <StatChip fill icon="monitoring" value={s.active_today} label={t('admin.activeToday')} />
        <StatChip fill icon="calendar_today" value={s.active_7d} label={t('admin.active7')} />
        <StatChip fill icon="trending_up" value={s.retention7 == null ? '–' : `${s.retention7}%`} label={t('admin.retention')} />
        <StatChip fill icon="group" value={s.tribes} label={t('admin.tribes')} />
      </div>
      <GlassPanel gap={8}>
        <span className="text-mono-label text-secondary">{t('admin.plans')}</span>
        {plans.map((p) => (
          <div key={p} className="admin__row">
            <span className="text-body-m text-primary">{t(`admin.plan.${p}`)}</span>
            <span className="text-mono-value text-primary">{planCount(p)}</span>
          </div>
        ))}
      </GlassPanel>
      <GlassPanel gap={8}>
        <span className="text-mono-label text-secondary">{t('admin.topPatches')}</span>
        {s.top_patches.length === 0 && <span className="text-body-s text-secondary">{t('admin.none')}</span>}
        {s.top_patches.map((p) => (
          <div key={p.id} className="admin__row">
            <span className="text-body-m text-primary">{getItem(p.id)?.title ?? p.id}</span>
            <span className="text-mono-value text-primary">{p.n}</span>
          </div>
        ))}
      </GlassPanel>
    </>
  );
}

function Users() {
  const [q, setQ] = useState('');
  const [list, setList] = useState<AdminUser[] | null>(null);
  const [open, setOpen] = useState<AdminUser | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<AdminUserInfo | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'progress' | 'delete'; user: AdminUser } | null>(null);
  const [typed, setTyped] = useState('');
  const load = async (search: string) => { try { setList(await backend.admin!.users(search)); } catch { setList([]); } };
  useEffect(() => { load(''); }, []);
  // Account facts for the person whose sheet is open.
  useEffect(() => {
    setInfo(null);
    if (!open) return;
    let alive = true;
    backend.admin!.userInfo(open.id).then((i) => { if (alive) setInfo(i); }).catch(() => {});
    return () => { alive = false; };
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Run an account action and show the result line. */
  const run = async (fn: () => Promise<string | void>, okText: string) => {
    setBusy(true); setMsg('');
    try { const extra = await fn(); setMsg(extra || okText); } catch (e) { setMsg(e instanceof Error && e.message === 'admin' ? t('admin.account.isAdmin') : t('admin.error')); }
    setBusy(false);
  };
  const copyLink = () => run(async () => {
    const link = await backend.admin!.resetLink(open!.email);
    try { await navigator.clipboard.writeText(link); } catch { return t('admin.account.linkShown', { link }); }
  }, t('admin.account.linkCopied'));
  const toggleSuspend = () => run(async () => {
    await backend.admin!.suspend(open!.id, !info?.suspended);
    setInfo(await backend.admin!.userInfo(open!.id));
  }, t(info?.suspended ? 'admin.account.unsuspended' : 'admin.account.suspended'));
  const doConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'progress') await backend.admin!.resetProgress(confirm.user.id);
      else { await backend.admin!.deleteUser(confirm.user.id); await load(q.trim()); }
      setMsg(t(confirm.kind === 'progress' ? 'admin.account.progressDone' : 'admin.account.deleteDone'));
    } catch (e) { setMsg(e instanceof Error && e.message === 'admin' ? t('admin.account.isAdmin') : t('admin.error')); }
    setBusy(false); setConfirm(null); setTyped('');
  };
  useEffect(() => { const id = setTimeout(() => load(q.trim()), 300); return () => clearTimeout(id); }, [q]);

  const setPlan = async (plan: 'free' | 'pro') => {
    if (!open) return;
    setBusy(true);
    try {
      const res = await backend.admin!.setPlan(open.email, plan);
      setMsg(t(res === 'ok' ? 'admin.planDone' : 'admin.notFound'));
      if (res === 'ok') { await load(q.trim()); setOpen({ ...open, plan }); }
    } catch { setMsg(t('admin.error')); }
    setBusy(false);
  };

  return (
    <>
      <TextField label={t('admin.search')} icon="mail" value={q} placeholder={t('admin.searchPlaceholder')} onChange={(e) => setQ(e.target.value)} />
      {list === null && <p className="text-body-s text-secondary">{t('admin.loading')}</p>}
      {list?.length === 0 && <p className="text-body-s text-secondary">{t('admin.none')}</p>}
      {list?.map((u) => (
        <ListRow
          key={u.id}
          icon={u.founder || u.plan === 'pro' ? 'verified_user' : 'person'}
          title={u.name || u.email}
          subtitle={`${u.email} · ${t(`admin.plan.${u.founder || u.plan === 'pro' ? 'pro' : 'free'}`)} · ${u.last_active ? t('admin.lastActive', { date: u.last_active }) : t('admin.neverActive')} · ${t('admin.days', { n: u.active_days })}`}
          onClick={() => { setMsg(''); setOpen(u); }}
        />
      ))}

      <BottomSheet open={!!open} onClose={() => setOpen(null)} eyebrow={open?.email} title={open?.name || t('admin.noName')}>
        {open && (
          <>
            <GlassPanel gap={8}>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.joined')}</span><span className="text-body-m text-primary">{open.created_at.slice(0, 10)}</span></div>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.plan.label')}</span><span className="text-body-m text-primary">{t(`admin.plan.${open.founder || open.plan === 'pro' ? 'pro' : 'free'}`)}</span></div>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.days', { n: open.active_days })}</span><span className="text-body-m text-primary">{open.last_active ?? t('admin.neverActive')}</span></div>
            </GlassPanel>
            <p className="text-body-s text-secondary">{t('admin.privacy')}</p>
            {open.founder || open.plan === 'pro' ? (
              <Button block variant="Secondary" label={t('admin.revoke')} busy={busy} onClick={() => setPlan('free')} />
            ) : (
              <Button block label={t('admin.grant')} busy={busy} onClick={() => setPlan('pro')} />
            )}
            {/* Account: reset, suspend, delete. Passwords are never shown or set here: they pick their own. */}
            <section className="admin__account" aria-labelledby="admin-account">
              <h3 id="admin-account" className="text-mono-label text-secondary">{t('admin.account.title')}</h3>
              <div className="admin__facts">
                <span className="text-body-s text-secondary">{t('admin.account.email')}</span>
                <span className="text-body-s text-primary">{info ? t(info.confirmed ? 'admin.account.confirmed' : 'admin.account.unconfirmed') : '…'}</span>
                <span className="text-body-s text-secondary">{t('admin.account.lastSignIn')}</span>
                <span className="text-body-s text-primary">{info ? (info.last_sign_in_at ? info.last_sign_in_at.slice(0, 10) : t('admin.neverActive')) : '…'}</span>
                <span className="text-body-s text-secondary">{t('admin.account.status')}</span>
                <span className="text-body-s text-primary">{info ? t(info.suspended ? 'admin.account.statusSuspended' : 'admin.account.statusActive') : '…'}</span>
              </div>
              <p className="text-body-s text-secondary">{t('admin.account.passwordNote')}</p>
              <Button block variant="Secondary" label={t('admin.account.sendReset')} busy={busy} onClick={() => run(() => backend.admin!.sendReset(open.email), t('admin.account.resetSent'))} />
              <Button block variant="Secondary" label={t('admin.account.copyLink')} busy={busy} onClick={copyLink} />
              {info && !info.is_admin && (
                <>
                  <Button block variant="Secondary" label={t(info.suspended ? 'admin.account.unsuspend' : 'admin.account.suspend')} busy={busy} onClick={toggleSuspend} />
                  <Button block variant="Secondary" label={t('admin.account.resetProgress')} onClick={() => { setConfirm({ kind: 'progress', user: open }); setOpen(null); }} />
                  <Button block variant="Ghost" label={t('admin.account.delete')} onClick={() => { setTyped(''); setConfirm({ kind: 'delete', user: open }); setOpen(null); }} />
                </>
              )}
              {msg && <p className="text-body-s text-primary admin__msg" role="status">{msg}</p>}
            </section>
          </>
        )}
      </BottomSheet>

      <BottomSheet open={!!confirm} onClose={() => { setConfirm(null); setTyped(''); }} eyebrow={confirm?.user.email} title={confirm ? t(confirm.kind === 'delete' ? 'admin.account.deleteTitle' : 'admin.account.progressTitle') : ''}>
        {confirm && (
          <>
            <p className="text-body-m text-secondary">{t(confirm.kind === 'delete' ? 'admin.account.deleteBody' : 'admin.account.progressBody')}</p>
            {confirm.kind === 'delete' && (
              <TextField label={t('admin.account.typeEmail', { email: confirm.user.email })} icon="mail" value={typed} placeholder={confirm.user.email} onChange={(e) => setTyped(e.target.value)} />
            )}
            <Button block label={t(confirm.kind === 'delete' ? 'admin.account.deleteConfirm' : 'admin.account.progressConfirm')} busy={busy}
              disabled={confirm.kind === 'delete' && typed.trim().toLowerCase() !== confirm.user.email.toLowerCase()} onClick={doConfirm} />
            <Button block variant="Ghost" label={t('common.back')} onClick={() => { setConfirm(null); setTyped(''); }} />
          </>
        )}
      </BottomSheet>
    </>
  );
}

function Tribes() {
  const [list, setList] = useState<AdminTribe[] | null>(null);
  const [del, setDel] = useState<AdminTribe | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { try { setList(await backend.admin!.tribes()); } catch { setList([]); } };
  useEffect(() => { load(); }, []);
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    await backend.admin!.deleteTribe(del.id).catch(() => {});
    setDel(null); setBusy(false);
    await load();
  };
  if (list === null) return <p className="text-body-s text-secondary">{t('admin.loading')}</p>;
  if (list.length === 0) return <p className="text-body-s text-secondary">{t('admin.noTribes')}</p>;
  return (
    <>
      {list.map((tr) => (
        <div key={tr.id} className="admin__tribe glass-card">
          <div className="admin__tribe-head">
            <span className="text-body-m-strong text-primary">{tr.name}</span>
            <span className="text-mono-caption text-secondary">{t('admin.members', { n: tr.members })} · {tr.code}</span>
          </div>
          <span className="text-body-s text-secondary">{t('admin.created', { date: tr.created_at.slice(0, 10) })}</span>
          <Button block variant="Ghost" label={t('admin.deleteTribe')} onClick={() => setDel(tr)} />
        </div>
      ))}
      <BottomSheet open={!!del} onClose={() => setDel(null)} title={t('admin.deleteTitle')}>
        <p className="text-body-m text-secondary">{t('admin.deleteBody', { name: del?.name ?? '' })}</p>
        <Button block label={t('admin.deleteConfirm')} busy={busy} onClick={remove} />
        <Button block variant="Ghost" label={t('common.back')} onClick={() => setDel(null)} />
      </BottomSheet>
    </>
  );
}

function Message() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const send = async () => {
    setBusy(true); setDone(false);
    try { await backend.admin!.publish(title, body); setDone(true); setTitle(''); setBody(''); } catch { /* shown below */ }
    setBusy(false);
  };
  return (
    <>
      <p className="text-body-s text-secondary">{t('admin.messageIntro')}</p>
      <TextField label={t('admin.msgTitle')} icon="notifications" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
      <label className="admin__area-label text-mono-label text-secondary" htmlFor="admin-body">{t('admin.msgBody')}</label>
      <textarea id="admin-body" className="admin__area text-body-m" rows={4} maxLength={400} value={body} onChange={(e) => setBody(e.target.value)} />
      <Button block label={t('admin.send')} busy={busy} disabled={!title.trim() || !body.trim()} onClick={send} />
      {done && <p className="text-body-s text-primary" role="status">{t('admin.sent')}</p>}
    </>
  );
}
