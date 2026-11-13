import { SegmentedProgress } from './SegmentedProgress';
import './ScoreRow.css';

/**
 * ScoreRow (from Figma "By area" rows on Starting score 55:355)
 * Mono label left, mono value right, 5 segments below (one per score point, rounded).
 * Optional `delta` (added in code): change since the start, shown as a small +/− pill.
 */
export function ScoreRow({ label, score, delta }: { label: string; score: number; delta?: number }) {
  return (
    <div className="score-row">
      <div className="score-row__head">
        <span className="text-mono-label text-secondary">{label}</span>
        <span className="score-row__values">
          {delta !== undefined && Math.abs(delta) >= 0.05 && <ScoreDelta delta={delta} />}
          <span className="text-mono-value text-primary">{score.toFixed(1)}</span>
        </span>
      </div>
      <SegmentedProgress total={5} filled={Math.round(score)} label={`${label} ${score.toFixed(1)} / 5`} />
    </div>
  );
}

/** Small pill with the change in score, e.g. "+1.7" (green) or "−0.3" (neutral). */
export function ScoreDelta({ delta }: { delta: number }) {
  const up = delta > 0;
  return (
    <span className={`score-delta text-mono-label${up ? ' score-delta--up' : ''}`}>
      {up ? '+' : '−'}{Math.abs(delta).toFixed(1)}
    </span>
  );
}
