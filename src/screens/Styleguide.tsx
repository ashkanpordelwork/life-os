import { useEffect, useState, type ReactNode } from 'react';
import { AnswerRow } from '../components/AnswerRow';
import { Button } from '../components/Button';
import { CheckCircle } from '../components/CheckCircle';
import { Chip } from '../components/Chip';
import { EvidenceBadge, type EvidenceLevel } from '../components/EvidenceBadge';
import { GlassPanel } from '../components/GlassPanel';
import { HabitCard } from '../components/HabitCard';
import { HeatCell, type HeatLevel } from '../components/HeatCell';
import { Icon, iconNames, type IconName } from '../components/Icon';
import { IconTile, glyphNames } from '../components/IconTile';
import { ListRow } from '../components/ListRow';
import { Mascot, mascotNames, type MascotName } from '../components/Mascot';
import { MetaChip } from '../components/MetaChip';
import { NavBar } from '../components/NavBar';
import { NavItem } from '../components/NavItem';
import { PatchCard } from '../components/PatchCard';
import { Progress } from '../components/Progress';
import { ScoreRow } from '../components/ScoreRow';
import { SegmentedProgress } from '../components/SegmentedProgress';
import { SprintDot } from '../components/SprintDot';
import { StatChip } from '../components/StatChip';
import { StatTile } from '../components/StatTile';
import { Tag, type AreaVariant } from '../components/Tag';
import { Toggle } from '../components/Toggle';
import { TopBar } from '../components/TopBar';
import { VersionTab } from '../components/VersionTab';
import { t } from '../i18n';
import './Styleguide.css';

// ---------- token lists (must match src/styles/tokens.css) ----------
const SEMANTIC = [
  'bg-app', 'bg-subtle', 'surface-card', 'surface-glass',
  'text-primary', 'text-secondary', 'text-on-action', 'text-brand', 'text-disabled',
  'border-default', 'border-glass', 'border-focus',
  'action-primary', 'action-primary-pressed', 'action-secondary', 'action-disabled',
  'status-success', 'status-success-bg', 'status-danger', 'status-danger-bg', 'status-gold', 'status-gold-bg',
  'area-move', 'area-move-bg', 'area-nutrition', 'area-nutrition-bg', 'area-sleep', 'area-sleep-bg', 'area-mind', 'area-mind-bg',
  'heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4',
  'brand-soft', 'brand-main', 'progress-track',
].map((n) => `--color-${n}`);

const PRIMITIVES = [
  ...[50, 100, 200, 300, 400, 500, 600, 700, 800].map((n) => `--orange-${n}`),
  ...[0, 50, 100, 200, 300, 400, 500, 700, 900].map((n) => `--neutral-${n}`),
  '--green-100', '--green-600', '--indigo-50', '--indigo-100', '--indigo-600', '--indigo-800',
  '--teal-100', '--teal-700', '--red-100', '--red-600', '--yellow-100', '--yellow-700',
  '--white-a30', '--white-a60', '--white-a70',
];

const SPACES = [4, 8, 12, 16, 20, 24, 32, 40];
const RADII = ['sm', 'md', 'lg', 'xl', 'pill'];
const TEXT_STYLES: [string, string, string][] = [
  ['Display/XL', 'text-display-xl', 'Manrope ExtraBold 64/68, −2%'],
  ['Display', 'text-display', 'Manrope ExtraBold 32/40, −1%'],
  ['Title/L', 'text-title-l', 'Manrope Bold 24/30, −0.5%'],
  ['Title/M', 'text-title-m', 'Manrope Bold 20/26'],
  ['Title/S', 'text-title-s', 'Manrope SemiBold 16/22'],
  ['Body/M', 'text-body-m', 'Manrope Regular 16/24'],
  ['Body/M Strong', 'text-body-m-strong', 'Manrope SemiBold 16/24'],
  ['Body/S', 'text-body-s', 'Manrope Regular 14/20'],
  ['Caption', 'text-caption', 'Manrope Medium 12/16'],
  ['Label', 'text-label', 'Manrope SemiBold 12/16, 4%, uppercase'],
  ['Number', 'text-number', 'Manrope ExtraBold 28/32, −0.5%'],
  ['Mono/Label', 'text-mono-label', 'JetBrains Mono Medium 12/16, 4%, uppercase'],
  ['Mono/Caption', 'text-mono-caption', 'JetBrains Mono Medium 12/16'],
  ['Mono/Value', 'text-mono-value', 'JetBrains Mono Bold 24/28, −2%'],
];

// ---------- helpers ----------
function useTokenValue(name: string) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim()), [name]);
  return value;
}

function Swatch({ name }: { name: string }) {
  const value = useTokenValue(name);
  return (
    <div className="sg-swatch">
      <span className="sg-swatch__chip" style={{ background: `var(${name})` }} />
      <code className="text-mono-caption text-primary">{name}</code>
      <span className="text-mono-caption text-secondary">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sg-section">
      <h2 className="text-title-m text-primary">{title}</h2>
      {children}
    </section>
  );
}

function Spec({ name, node, desc, children }: { name: string; node?: string; desc: string; children: ReactNode }) {
  return (
    <article className="sg-spec">
      <header>
        <h3 className="text-title-s text-primary">
          {name} {node && <span className="text-mono-caption text-secondary">Figma {node}</span>}
        </h3>
        <p className="text-body-s text-secondary">{desc}</p>
      </header>
      <div className="sg-demo">{children}</div>
    </article>
  );
}

function Variant({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <figure className={`sg-variant${wide ? ' sg-variant--wide' : ''}`}>
      {children}
      <figcaption className="text-mono-caption text-secondary">{label}</figcaption>
    </figure>
  );
}

// ---------- page ----------
export function Styleguide() {
  const [chips, setChips] = useState([false, true]);
  const [answer, setAnswer] = useState(1);
  const [toggle, setToggle] = useState(true);
  const [version, setVersion] = useState(0);
  const [patchDone, setPatchDone] = useState(false);
  const [habitDone, setHabitDone] = useState(false);
  const [nav, setNav] = useState(0);

  const areas: AreaVariant[] = ['Move', 'Nutrition', 'Sleep', 'Mind'];
  const levels: EvidenceLevel[] = ['Strong', 'Moderate', 'Low', 'Uncertain'];
  const navItems: { label: string; icon: IconName }[] = [
    { label: 'Today', icon: 'home' }, { label: 'Roadmap', icon: 'route' },
    { label: 'Progress', icon: 'monitoring' }, { label: 'You', icon: 'person' },
  ];

  return (
    <div className="sg">
      <header className="sg-header">
        <h1 className="text-display text-primary">{t('styleguide.title')}</h1>
        <p className="text-body-m text-secondary">{t('styleguide.intro')}</p>
      </header>

      <Section title={t('styleguide.colors')}>
        <div className="sg-grid">{SEMANTIC.map((n) => <Swatch key={n} name={n} />)}</div>
      </Section>

      <Section title={t('styleguide.primitives')}>
        <div className="sg-grid">{PRIMITIVES.map((n) => <Swatch key={n} name={n} />)}</div>
      </Section>

      <Section title={t('styleguide.spacing')}>
        <div className="sg-stack">
          {SPACES.map((s) => (
            <div key={s} className="sg-row">
              <code className="text-mono-caption text-primary sg-row__name">--space-{s}</code>
              <span className="sg-space" style={{ inlineSize: `var(--space-${s})` }} />
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.radius')}>
        <div className="sg-wrap">
          {RADII.map((r) => (
            <Variant key={r} label={`--radius-${r}`}>
              <span className="sg-radius" style={{ borderRadius: `var(--radius-${r})` }} />
            </Variant>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.sizes')}>
        <div className="sg-wrap">
          <Variant label="--size-touch (44)"><span className="sg-size" style={{ inlineSize: 'var(--size-touch)', blockSize: 'var(--size-touch)' }} /></Variant>
          <Variant label="--size-icon (24)"><span className="sg-size" style={{ inlineSize: 'var(--size-icon)', blockSize: 'var(--size-icon)' }} /></Variant>
        </div>
      </Section>

      <Section title={t('styleguide.effects')}>
        <div className="sg-wrap sg-wrap--tinted">
          <Variant label="Shadow/Card"><span className="sg-effect" style={{ boxShadow: 'var(--shadow-card)' }} /></Variant>
          <Variant label="Shadow/Button"><span className="sg-effect" style={{ boxShadow: 'var(--shadow-button)' }} /></Variant>
          <Variant label="Shadow/Floating"><span className="sg-effect" style={{ boxShadow: 'var(--shadow-floating)' }} /></Variant>
          <Variant label="Glass/Card"><span className="sg-effect glass-card" /></Variant>
          <Variant label="Glass/Floating"><span className="sg-effect glass-floating" /></Variant>
        </div>
      </Section>

      <Section title={t('styleguide.paints')}>
        <div className="sg-wrap">
          <Variant label="Gradient/Hero"><span className="sg-paint" style={{ background: 'var(--gradient-hero)' }} /></Variant>
          <Variant label="Gradient/Soft"><span className="sg-paint" style={{ background: 'var(--gradient-soft)' }} /></Variant>
          <Variant label="Glass/Fill"><span className="sg-paint" style={{ background: 'var(--glass-fill)' }} /></Variant>
          <Variant label="--gradient-screen"><span className="sg-paint" style={{ background: 'var(--gradient-screen)' }} /></Variant>
        </div>
      </Section>

      <Section title={t('styleguide.text')}>
        <div className="sg-stack">
          {TEXT_STYLES.map(([name, cls, spec]) => (
            <div key={name} className="sg-text">
              <span className={`${cls} text-primary`}>{name}</span>
              <code className="text-mono-caption text-secondary">.{cls} · {spec}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.icons')}>
        <div className="sg-wrap">
          {iconNames.map((n) => (
            <Variant key={n} label={n}><span className="text-primary"><Icon name={n as IconName} size={24} /></span></Variant>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.components')}>
        <Spec name="Button" node="44:20" desc="Primary action = Primary. Use Secondary for alternatives, Ghost for low-emphasis. Height 48 (touch target >= 44). White-on-orange text passes 4.5:1 only on the Primary fill. Pressed = hold the button.">
          {(['Primary', 'Secondary', 'Ghost'] as const).map((v) => (
            <div key={v} className="sg-wrap">
              <Variant label={`${v} / Default`}><Button variant={v} label="Button" /></Variant>
              <Variant label={`${v} / Disabled`}><Button variant={v} label="Button" disabled /></Variant>
            </div>
          ))}
        </Spec>

        <Spec name="Chip" node="44:25" desc="Filter / symptom picker. Selected state also changes the border, not only the colour.">
          <div className="sg-wrap">
            {chips.map((on, i) => (
              <Variant key={i} label={`Selected=${on ? 'True' : 'False'}`}>
                <Chip label="Chip" selected={on} onToggle={() => setChips(chips.map((c, j) => (j === i ? !c : c)))} />
              </Variant>
            ))}
          </div>
        </Spec>

        <Spec name="Tag" node="44:38" desc="Area label. Text is always ink; the dot carries the area colour and the label carries the meaning.">
          <div className="sg-wrap">{areas.map((a) => <Variant key={a} label={`Area=${a}`}><Tag area={a} /></Variant>)}</div>
        </Spec>

        <Spec name="EvidenceBadge" node="44:51" desc="Shows how strong the published evidence is for a habit. Never present Low/Uncertain as proven.">
          <div className="sg-wrap">{levels.map((l) => <Variant key={l} label={`Level=${l}`}><EvidenceBadge level={l} /></Variant>)}</div>
        </Spec>

        <Spec name="HeatCell" node="44:57" desc="One day in the contribution graph. 0 = nothing, 4 = all active habits done. Detail view always shows the count, not only colour.">
          <div className="sg-wrap">{([0, 1, 2, 3, 4] as HeatLevel[]).map((l) => <Variant key={l} label={`Level=${l}`}><HeatCell level={l} /></Variant>)}</div>
        </Spec>

        <Spec name="Progress" node="44:58" desc="Set `value` (0 to 1) to show progress.">
          <div className="sg-stack sg-narrow"><Progress value={0.5} label="50%" /><Progress value={0.2} label="20%" /></div>
        </Spec>

        <Spec name="SprintDot" node="44:68" desc="Roadmap sprint marker. Set the number.">
          <div className="sg-wrap">
            <Variant label="Status=Done"><SprintDot status="Done" number={3} /></Variant>
            <Variant label="Status=Current"><SprintDot status="Current" number={4} /></Variant>
            <Variant label="Status=Upcoming"><SprintDot status="Upcoming" number={5} /></Variant>
          </div>
        </Spec>

        <Spec name="NavItem" node="45:16" desc="Bottom navigation item. Always icon + label. Glyph is text/brand when active, text/secondary when not.">
          <div className="sg-wrap">
            <Variant label="Active=False"><NavItem label="Today" icon="home" /></Variant>
            <Variant label="Active=True"><NavItem label="Today" icon="home" active /></Variant>
          </div>
        </Spec>

        <Spec name="NavBar" node="45:17" desc="Floating glass bottom navigation, max 4 items.">
          <div className="sg-phone">
            <NavBar>{navItems.map((n, i) => <NavItem key={n.label} label={n.label} icon={n.icon} active={nav === i} onClick={() => setNav(i)} />)}</NavBar>
          </div>
        </Spec>

        <Spec name="HabitCard" node="45:67" desc="One patch for today. Check target is 44x44. Swap the Tag per area; edit Title and Meta. Top: Todo (tap), bottom: Done.">
          <div className="sg-stack sg-phone">
            <HabitCard area="Move" title="Daily steps" meta="45 min · All day" done={habitDone} onToggle={() => setHabitDone(!habitDone)} />
            <HabitCard area="Nutrition" title="Water on waking" meta="1 min · After waking" done />
          </div>
        </Spec>

        <Spec name="ListRow" node="45:68" desc="Generic tappable row (library items, settings). Min height 64.">
          <div className="sg-phone"><ListRow icon="bolt" title="Morning light, 10 min" subtitle="Sleep · first hour awake" /></div>
        </Spec>

        <Spec name="StatTile" node="45:79" desc="Large stat block: a label and one value (e.g. score, days). Use on Progress and Score screens. For compact stats in the Today header use StatChip instead.">
          <div className="sg-wrap sg-wrap--tinted"><StatTile value="12" label="Day streak" /></div>
        </Spec>

        <Spec name="AnswerRow" node="53:177" desc="Single-choice answer for the starting-score questions. Selected state changes fill, border and radio, not colour alone.">
          <div className="sg-stack sg-phone" role="radiogroup" aria-label="Answer">
            {['0 days', '1–2 days'].map((l, i) => <AnswerRow key={l} label={l} selected={answer === i} onSelect={() => setAnswer(i)} />)}
          </div>
        </Spec>

        <Spec name="Toggle" node="2014:1459" desc="On/off switch for a single setting (reminders, notifications). Use only for instant changes; never for choices that need a Save button. Track uses action/primary when On, border/default when Off. Min touch area 44.">
          <div className="sg-wrap">
            <Variant label="State=Off"><Toggle on={false} label="Off" /></Variant>
            <Variant label={`State=${toggle ? 'On' : 'Off'} (tap)`}><Toggle on={toggle} label="Demo" onChange={setToggle} /></Variant>
          </div>
        </Spec>

        <Spec name="IconTile" node="61:1034" desc="Glyph tile in its area colour. Glyph: Move, Walk, Nutrition, Water, Sleep, Light, Coffee, Mind, Breathe. Size M = 48, L = 72.">
          <div className="sg-wrap">
            {glyphNames.map((g) => (
              <Variant key={g} label={g}><span className="sg-pair"><IconTile glyph={g} size="M" /><IconTile glyph={g} size="L" /></span></Variant>
            ))}
          </div>
        </Spec>

        <Spec name="PatchCard" node="61:1060" desc="Icon-led patch row. Set the glyph on the nested IconTile. Keep Title short (2-3 words); details live on the patch screen. Top: Todo (tap), bottom: Done.">
          <div className="sg-stack sg-phone">
            <PatchCard glyph="Light" title="Morning light" meta="10 min" done={patchDone} onToggle={() => setPatchDone(!patchDone)} />
            <PatchCard glyph="Water" title="Water on waking" meta="1 min" done />
          </div>
        </Spec>

        <Spec name="StatChip" node="61:1061" desc="Icon + number + one-word mono label.">
          <div className="sg-wrap sg-wrap--tinted"><StatChip icon="local_fire_department" value="12" label="Streak" /></div>
        </Spec>

        <Spec name="MetaChip" node="61:1067" desc="Small fact chip: icon + mono value (duration, cue, evidence).">
          <div className="sg-wrap">
            <MetaChip icon="timer" label="2 min" />
            <MetaChip icon="event" label="After meeting" />
            <MetaChip icon="science" label="Low evidence" />
          </div>
        </Spec>

        <Spec name="VersionTab" node="61:1084" desc="Pick Tiny / Standard / Stretch. Selected state changes fill, border and text colour.">
          <div className="sg-tabs sg-phone" role="tablist">
            {([['bolt', 'Tiny', '20 s'], ['tune', 'Standard', '2 min'], ['trending_up', 'Stretch', '5 min']] as const).map(([icon, label, time], i) => (
              <VersionTab key={label} icon={icon} label={label} time={time} selected={version === i} onSelect={() => setVersion(i)} />
            ))}
          </div>
        </Spec>

        <Spec name="TopBar" node="2055:3095" desc="Navigation bar for pushed screens. Back button left, title centered, optional trailing text (step counter or id) right.">
          <div className="sg-phone sg-wrap--tinted"><TopBar title="Title" trailing="1 / 4" onBack={() => undefined} /></div>
        </Spec>
      </Section>

      <Section title={t('styleguide.layout')}>
        <Spec name="Screen + Spacer" desc="Screen: full-height column with the screen gradient, 16px side padding and 16px gap. Spacer takes the free space (pushes the main button to the bottom). Used by every onboarding screen.">
          <div className="sg-phone sg-screen-demo">
            <span className="text-caption text-secondary">Content</span>
            <span className="sg-spacer-demo text-mono-caption text-secondary">Spacer</span>
            <Button block label="Main action" />
          </div>
        </Spec>
        <Spec name="SegmentedProgress" desc="Row of 4px bars. Onboarding steps (6), area score (5), Sprint days (14).">
          <div className="sg-stack sg-phone">
            <SegmentedProgress total={6} filled={2} />
            <SegmentedProgress total={5} filled={3} />
            <SegmentedProgress total={14} filled={0} />
          </div>
        </Spec>
        <Spec name="GlassPanel + ScoreRow" desc="Glass panel (Glass/Card), 16px padding, radius 20. ScoreRow: mono label, mono value, 5 segments.">
          <div className="sg-phone sg-wrap--tinted">
            <GlassPanel gap={14}>
              <ScoreRow label="Movement" score={2.0} />
              <ScoreRow label="Sleep" score={2.5} />
            </GlassPanel>
          </div>
        </Spec>
        <Spec name="CheckCircle" desc="The 44x44 check target inside HabitCard and PatchCard.">
          <div className="sg-wrap"><Variant label="Todo"><CheckCircle done={false} /></Variant><Variant label="Done"><CheckCircle done /></Variant></div>
        </Spec>
      </Section>

      <Section title={t('styleguide.mascots')}>
        <div className="sg-wrap">
          {mascotNames.map((m) => <Variant key={m} label={m}><Mascot name={m as MascotName} size={120} /></Variant>)}
        </div>
      </Section>
    </div>
  );
}
