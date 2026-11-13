import './StepList.css';

/**
 * StepList (from Figma Notifications blocked 2032:3464)
 * Numbered steps: "01" in Mono/Value brand, step text in Body/M Strong.
 */
export function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="step-list">
      {steps.map((s, i) => (
        <li key={s} className="step-list__item">
          <span className="text-mono-value text-brand">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-body-m-strong text-primary">{s}</span>
        </li>
      ))}
    </ol>
  );
}
