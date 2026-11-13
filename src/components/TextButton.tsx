import './TextButton.css';

/**
 * TextButton (from Figma "Switch" row: "Create account" / "Log in")
 * Body/M Strong in text/brand, no background. 44px touch height.
 */
export function TextButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button type="button" className="text-button text-body-m-strong" onClick={onClick}>{label}</button>
  );
}
