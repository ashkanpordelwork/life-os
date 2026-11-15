import type { NavigateFunction } from 'react-router-dom';

/**
 * Go back to wherever the tool was opened from (a habit, the Library, Today's travel banner).
 * Opened directly (no history inside the app): go to Today.
 */
export function toolBack(navigate: NavigateFunction) {
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  if (idx > 0) navigate(-1);
  else navigate('/today');
}
