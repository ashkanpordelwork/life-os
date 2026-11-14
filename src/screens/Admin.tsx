import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { backend, type AdminStats, type AdminTribe, type AdminUser } from '../backend';
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

type Tab = 'stats' | 'users' | 'tribes' | 'message';

/**
 * Admin dashboard (/admin, designed in code). Only for accounts with is_admin in the database.
 * Admins see counts, people's activity (last active, days, plan) and can give or take Pro by email.
 * Health answers, symptoms and score answers are never loaded here.
 */
export function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useSession();
  const [tab, setTab] = useState<Tab>('stats');
  if (!isAdmin || !backend.admin) return <Navigate to="/today" replace />;

  return (
    <Screen>
      <TopBar title={t('admin.title')} onBack={() => navigate('/you')} />
      <div className="chip-wrap" role="tablist">
        {(['stats', 'users', 'tribes', 'message'] as const).map((k) => (
          <Chip key={k} label={t(`admin.tabs.${k}`)} selected={tab === k} onToggle={() => setTab(k)} />
        ))}
      </div>
      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionTokens.page} className="admin__body">
        {tab === 'stats' && <Stats />}
        {tab === 'users' && <Users />}
        {tab === 'tribes' && <Tribes />}
        {tab === 'message' && <Message />}
      </motion.div>
      <Spacer />
    </Screen>
  );
}

function Stats() {
  const [s, setS] = useState<AdminStats | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { backend.admin!.stats().then(setS).catch(() => setErr(true)); }, []);
  if (err) return <p className="text-body-s text-secondary">{t('admin.error')}</p>;
  if (!s) return <p className="text-body-s text-secondary">{t('admin.loading')}</p>;
  const plans = ['founder', 'pro', 'free'] as const;
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
            <span className="text-mono-value text-primary">{s.plans[p] ?? 0}</span>
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
  const load = async (search: string) => { try { setList(await backend.admin!.users(search)); } catch { setList([]); } };
  useEffect(() => { load(''); }, []);
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
          icon={u.founder ? 'verified_user' : u.plan === 'pro' ? 'trending_up' : 'person'}
          title={u.name || u.email}
          subtitle={`${u.email} · ${t(u.founder ? 'admin.plan.founder' : `admin.plan.${u.plan === 'pro' ? 'pro' : 'free'}`)} · ${u.last_active ? t('admin.lastActive', { date: u.last_active }) : t('admin.neverActive')} · ${t('admin.days', { n: u.active_days })}`}
          onClick={() => { setMsg(''); setOpen(u); }}
        />
      ))}

      <BottomSheet open={!!open} onClose={() => setOpen(null)} eyebrow={open?.email} title={open?.name || t('admin.noName')}>
        {open && (
          <>
            <GlassPanel gap={8}>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.joined')}</span><span className="text-body-m text-primary">{open.created_at.slice(0, 10)}</span></div>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.plan.label')}</span><span className="text-body-m text-primary">{t(open.founder ? 'admin.plan.founder' : `admin.plan.${open.plan === 'pro' ? 'pro' : 'free'}`)}</span></div>
              <div className="admin__row"><span className="text-body-s text-secondary">{t('admin.days', { n: open.active_days })}</span><span className="text-body-m text-primary">{open.last_active ?? t('admin.neverActive')}</span></div>
            </GlassPanel>
            <p className="text-body-s text-secondary">{t('admin.privacy')}</p>
            {open.founder ? (
              <p className="text-body-s text-secondary">{t('admin.founderNote')}</p>
            ) : open.plan === 'pro' ? (
              <Button block variant="Secondary" label={t('admin.revoke')} busy={busy} onClick={() => setPlan('free')} />
            ) : (
              <Button block label={t('admin.grant')} busy={busy} onClick={() => setPlan('pro')} />
            )}
            {msg && <p className="text-body-s text-primary" role="status">{msg}</p>}
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
