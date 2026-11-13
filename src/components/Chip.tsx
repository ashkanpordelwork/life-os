import './Chip.css';

type ChipProps = {
  label: string;
  /** Figma property `Selected` */
  selected?: boolean;
  onToggle?: () => void;
};

/**
 * Chip (Figma 44:25)
 * Filter / symptom picker. Selected state also changes the border, not only the colour.
 */
export function Chip({ label, selected = false, onToggle }: ChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={`chip${selected ? ' chip--selected' : ''}`} onClick={onToggle}>
      <span className="text-body-s">{label}</span>
    </button>
  );
}
