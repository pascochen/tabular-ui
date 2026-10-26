import palette from '../../../docs/palette.json';
import themeCss from 'tabular-ui/theme.css?raw';

import { makeTokens } from './tokens-parse';

/**
 * The Foundations pages read every value from the token sources at build time
 * (docs/site.md §5), never from a copy: theme.css as the package ships it, and
 * docs/palette.json, which generate-palette.mjs writes beside palette.css.
 * A token renamed or a step moved changes the page with it, or fails the build.
 */
export const {
  tokenStep,
  stepLabel,
  contrast,
  onCanvas,
  roles,
  rampNames,
  rampSteps,
  themeToken,
  themeTokensWith,
  px,
} = makeTokens(themeCss, palette);

export type Role = (typeof roles)[number];
export type { RampStep } from './tokens-parse';
