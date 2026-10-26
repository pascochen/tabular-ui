import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The one player behind every live specimen (docs/site.md §6).
 *
 * A specimen is a list of frames rendered with real components; the last is its
 * rest frame, the decision it exists to show.
 * - The prerendered HTML is the rest frame: visitors without JavaScript, link
 *   previews and reduced motion all see the decision.
 * - A specimen below the first screen rewinds while still out of view, so no one
 *   sees it jump back, and plays once when half of it has scrolled in.
 * - A specimen already on screen when the page loads stays at rest (D6).
 * - A sequence runs 5 seconds or less, so it needs no pause control (WCAG 2.2.2).
 * - Reduced motion: the rest frame only; Replay jumps to it.
 */

const MAX_SEQUENCE_MS = 5000;
const STEP_MS = 900;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A polite announcement, made once and emptied after it has been read (as AgentReasoning does). */
export function useAnnouncer() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const announce = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { announce, message };
}

export function usePlayback({ frames, autoplay = true }: { frames: number; autoplay?: boolean }) {
  const rest = frames - 1;
  const [frame, setFrame] = useState(rest);
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDone = useRef<(() => void) | undefined>(undefined);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /** Plays from the first frame to rest; `done` runs once the rest frame is reached. */
  const play = useCallback(
    (done?: () => void) => {
      stop();
      onDone.current = done;
      if (prefersReducedMotion() || rest === 0) {
        setFrame(rest);
        setPlaying(false);
        done?.();
        return;
      }
      const step = Math.min(STEP_MS, MAX_SEQUENCE_MS / rest);
      setFrame(0);
      setPlaying(true);
      for (let f = 1; f <= rest; f++) {
        timers.current.push(
          setTimeout(() => {
            setFrame(f);
            if (f === rest) {
              setPlaying(false);
              onDone.current?.();
            }
          }, f * step),
        );
      }
    },
    [rest, stop],
  );

  useEffect(() => {
    const el = ref.current;
    if (!autoplay || !el || prefersReducedMotion() || rest === 0) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return; // on screen at load: stays at rest
    setFrame(0); // out of view: rewind where no one sees it
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          play();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplay, play, rest]);

  useEffect(() => stop, [stop]);

  return { ref, frame, rest, playing, play };
}
