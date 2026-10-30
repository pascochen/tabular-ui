import { restartClock } from './clock';
import { useClose } from './close-context';

/**
 * Starts the demo over from landing: the clock back to 14:00, the close state
 * back to its landing rows, and `?at=end` dropped from the URL so a reload
 * doesn't jump to the end again. The view stays where the visitor is.
 */
export function useReplay() {
  const { dispatch } = useClose();
  return () => {
    restartClock();
    dispatch({ type: 'reset' });
    const params = new URLSearchParams(window.location.search);
    if (params.has('at')) {
      params.delete('at');
      const search = params.toString();
      window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
    }
  };
}
