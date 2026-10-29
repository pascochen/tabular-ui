import { expect, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { CodeView } from '../../../packages/ui/src/components/product/CodeView';

/**
 * CodeView — the tab stop before the first measure.
 *
 * A view that overflows is a focusable region, so a keyboard user can scroll
 * it (WCAG 2.1.1). Overflow is measured in a layout effect, which a server or
 * a prerender never runs: until 2026-10-29 the HTML shipped with no tab stop,
 * and on a prerendered page a long line was out of keyboard reach until React
 * hydrated (tabularui.com's Getting started). The stories only ever see the
 * hydrated view, so this renders the component as a server does. The Fits and
 * Overflow stories check that the measure then removes or keeps the stop.
 */
test('server-rendered, a CodeView is a named focusable region until it measures', () => {
  const html = renderToStaticMarkup(createElement(CodeView, { language: 'sql', children: 'select 1' }));
  expect(html).toMatch(/^<div[^>]* tabindex="0"/);
  expect(html).toMatch(/^<div[^>]* role="region"/);
  expect(html).toMatch(/^<div[^>]* aria-label="SQL code"/);
});
