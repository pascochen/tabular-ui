import { useEffect, type RefObject } from 'react';

import { isPhoneWidth } from './viewport';

/**
 * A link to an exception, opened fresh or reached by Back, at any width. The
 * browser looks for the fragment as the page loads, before React has rendered
 * the message, and doesn't look again, so the channel stayed at its top. A link
 * followed inside the channel never comes here: the browser handles that one.
 */
export function useExceptionLink() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    let cancelled = false;
    // After the fonts: the swap rewraps the thread and moves the message.
    void document.fonts.ready.then(() => {
      if (!cancelled) document.getElementById(id)?.scrollIntoView();
    });
    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * On a phone, the channel opens scrolled just far enough that the whole decision
 * clears the composer: at 375×812 its second answer lands under it. By the least
 * that does it, so the thread above stays. It never moves a page the visitor
 * has already scrolled or a link has placed, and it does nothing once the
 * decision is answered.
 */
export function useDecisionInView(composer: RefObject<HTMLElement | null>) {
  useEffect(() => {
    // A link to an exception has said where to land (`useExceptionLink`).
    if (!isPhoneWidth() || window.location.hash) return;
    let cancelled = false;
    // After the fonts: the swap rewraps the thread and moves the question.
    void document.fonts.ready.then(() => {
      const bar = composer.current;
      const scroller = bar?.closest('[data-slot="app-shell-main-body"]');
      const question = document.querySelector('[data-slot="question"][data-state="waiting"]');
      if (cancelled || !bar || !scroller || !question || scroller.scrollTop !== 0) return;
      // A pinned sidebar squeezes main to 135px, where the question runs thousands
      // of pixels tall. A scroll measured there lands at the channel's foot on collapse.
      if (scroller.getBoundingClientRect().width < window.innerWidth) return;
      const { top, bottom } = question.getBoundingClientRect();
      const under = bottom - bar.getBoundingClientRect().top;
      // Never past the question's own top, on a screen too short to hold it.
      const room = top - scroller.getBoundingClientRect().top;
      if (under > 0) scroller.scrollTop = Math.min(under, room);
    });
    return () => {
      cancelled = true;
    };
  }, [composer]);
}
