/**
 * Tiny smooth-scroll helper used by both the navbar and footer.
 *
 * Behaviour:
 *  - On the home page:  smooth-scrolls to the element with the matching id.
 *  - On any other page: navigates back to '/' and scrolls once the home
 *    page mounts (the hash is preserved in the URL so the browser fires a
 *    hashchange when HomePage mounts).
 *
 * The 80px offset accounts for the fixed navbar so anchored content lands
 * just under it instead of hidden behind.
 */

import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router-dom';

const NAVBAR_OFFSET = 80;

export function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, '');
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
  return true;
}

/**
 * Click handler factory for `<a href="#section">` style links.
 * - On '/' it intercepts the click and uses smooth scroll.
 * - On other routes, it lets react-router navigate to `/#section`,
 *   then scrolls once HomePage mounts (see `useScrollOnLoad`).
 */
export function makeAnchorClickHandler(
  hash: string,
  navigate: NavigateFunction,
  onAfterClick?: () => void,
) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onAfterClick?.();
    if (window.location.pathname === '/') {
      scrollToHash(hash);
      // Update the URL so deep-linking still works (no jump).
      window.history.replaceState(null, '', hash);
    } else {
      navigate(`/${hash}`);
    }
  };
}
