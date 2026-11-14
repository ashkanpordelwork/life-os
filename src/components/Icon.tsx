import { HugeiconsIcon } from '@hugeicons/react';
import {
  Analytics01Icon, ArrowLeft02Icon, ArrowRight01Icon, Calendar01Icon, Calendar03Icon, ChartLineData01Icon,
  Coffee02Icon, DropletIcon, Dumbbell01Icon, FastWindIcon, Fire02Icon, FlashIcon, Home01Icon,
  InformationCircleIcon, LockIcon, Mail01Icon, Moon02Icon, Notification01Icon, Restaurant01Icon, Route01Icon,
  SecurityCheckIcon, SlidersHorizontalIcon, Sun03Icon, TaskDone01Icon, TestTube01Icon, Tick02Icon, Timer02Icon,
  TrendingUpIcon, UserIcon, WalkingIcon, Yoga02Icon, UserGroupIcon, Airplane01Icon, Medicine02Icon, HourglassIcon, Beach02Icon, Clapping01Icon, Share08Icon, Copy01Icon, Settings02Icon,
} from '@hugeicons/core-free-icons';
import './Icon.css';

/**
 * Icons from Hugeicons (free "Stroke Rounded" set, MIT). Owner decision: the code is the source of truth
 * for icons (Figma still shows Material Symbols). Names are kept from the old Material set so no screen changes.
 */
const icons = {
  air: FastWindIcon,
  arrow_back: ArrowLeft02Icon,
  bedtime: Moon02Icon,
  bolt: FlashIcon,
  calendar_today: Calendar03Icon,
  check: Tick02Icon,
  chevron_right: ArrowRight01Icon,
  directions_walk: WalkingIcon,
  event: Calendar01Icon,
  fitness_center: Dumbbell01Icon,
  home: Home01Icon,
  info: InformationCircleIcon,
  insights: Analytics01Icon,
  lock: LockIcon,
  mail: Mail01Icon,
  notifications: Notification01Icon,
  local_cafe: Coffee02Icon,
  local_fire_department: Fire02Icon,
  monitoring: ChartLineData01Icon,
  person: UserIcon,
  restaurant: Restaurant01Icon,
  route: Route01Icon,
  science: TestTube01Icon,
  self_improvement: Yoga02Icon,
  sunny: Sun03Icon,
  task_alt: TaskDone01Icon,
  timer: Timer02Icon,
  trending_up: TrendingUpIcon,
  tune: SlidersHorizontalIcon,
  verified_user: SecurityCheckIcon,
  water_drop: DropletIcon,
  group: UserGroupIcon,
  high_five: Clapping01Icon,
  share: Share08Icon,
  copy: Copy01Icon,
  settings: Settings02Icon,
  airplane: Airplane01Icon,
  medicine: Medicine02Icon,
  hourglass: HourglassIcon,
  beach: Beach02Icon,
} as const;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons).sort() as IconName[];

type IconProps = {
  name: IconName;
  /** Size in px. Figma uses 16, 18, 20, 24 and 36. */
  size?: number;
  className?: string;
};

/** Hugeicons stroke at 24 px; thinner lines look heavier when small, so it scales a little. */
const strokeFor = (size: number) => (size <= 18 ? 1.75 : 1.5);

/**
 * Icon. The glyph takes the current text colour (`color`), so a parent sets the colour
 * with a semantic token, e.g. `color: var(--color-text-brand)`. Decorative (hidden from screen readers).
 */
export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color="currentColor"
      strokeWidth={strokeFor(size)}
      className={className ? `icon ${className}` : 'icon'}
      aria-hidden="true"
      focusable="false"
    />
  );
}
