import { Icon } from './Icon';
import './AnswerRow.css';

type AnswerRowProps = {
  label: string;
  /** Figma property `State`: Off | On */
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * AnswerRow (Figma 53:177)
 * Single-choice answer for the starting-score questions.
 * Selected state changes fill, border and radio, not colour alone.
 * Put several inside an element with role="radiogroup".
 */
export function AnswerRow({ label, selected = false, onSelect }: AnswerRowProps) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={`answer-row${selected ? ' answer-row--on' : ''}`} onClick={onSelect}>
      <span className="answer-row__label text-body-m-strong">{label}</span>
      <span className="answer-row__radio" aria-hidden="true">{selected && <Icon name="check" size={16} />}</span>
    </button>
  );
}
