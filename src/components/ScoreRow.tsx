import { SegmentedProgress } from './SegmentedProgress';
import './ScoreRow.css';

/**
 * ScoreRow (from Figma "By area" rows on Starting score 55:355)
 * Mono label left, mono value right, 5 segments below (one per score point, rounded).
 */
export function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="score-row">
      <div className="score-row__head">
        <span className="text-mono-label text-secondary">{label}</span>
        <span className="text-mono-value text-primary">{score.toFixed(1)}</span>
      </div>
      <SegmentedProgress total={5} filled={Math.round(score)} label={`${label} ${score.toFixed(1)} / 5`} />
    </div>
  );
}
