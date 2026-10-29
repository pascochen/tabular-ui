/**
 * Hydration starts after the page has painted (docs/site.md §12). React Router
 * writes 21 `modulepreload` links into every page's head and a module script
 * that imports them at the end of the body, so on a phone's connection about
 * 200 KB of JavaScript downloads alongside the CSS and the fonts the first paint
 * needs. The page is prerendered and its links are plain `<a>`, so it reads and
 * navigates without JavaScript; only its buttons wait for hydration.
 *
 * `react-router.config.ts` runs this on every prerendered page at the end of
 * the build. It drops the preloads and replaces the module script with a loader
 * that adds the same script once the page has loaded, its fonts are ready and a
 * frame has painted. It throws on markup it doesn't recognise, so a React
 * Router upgrade that changes the markup fails the build instead of shipping a
 * page that never hydrates, or one that quietly preloads again.
 */

const modulePreload = /<link rel="modulepreload"[^>]*>/g;
const moduleScript = /<script type="module"[^>]*>([\s\S]*?)<\/script>/g;

/** True for a page React Router hydrates: it carries the router's context. */
export function hydrates(html: string): boolean {
  return html.includes('window.__reactRouterContext');
}

export function deferHydration(html: string): string {
  const scripts = [...html.matchAll(moduleScript)];
  if (scripts.length !== 1)
    throw new Error(`Expected one module script in a prerendered page, found ${scripts.length}`);
  const [script, code] = scripts[0];
  if (!code.includes('window.__reactRouterRouteModules'))
    throw new Error('The module script no longer sets window.__reactRouterRouteModules: check the React Router markup');
  // A JSON string is a valid JavaScript string; escaping every < keeps the
  // script's text from closing the inline <script> it sits in.
  const source = JSON.stringify(code).replace(/</g, '\\u003c');
  const loader =
    '<script>(function(){' +
    `function hydrate(){var s=document.createElement('script');s.type='module';s.textContent=${source};document.body.appendChild(s)}` +
    'function afterPaint(){document.fonts.ready.then(function(){requestAnimationFrame(function(){setTimeout(hydrate)})})}' +
    "if(document.readyState==='complete')afterPaint();else addEventListener('load',afterPaint,{once:true})" +
    '})()</script>';
  const deferred = html.replace(modulePreload, '').replace(script, () => loader);
  if (deferred.includes('rel="modulepreload"'))
    throw new Error('A modulepreload link survived: check the React Router markup');
  return deferred;
}
