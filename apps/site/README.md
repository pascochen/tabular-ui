# tabularui.com

The public site for Tabular UI: what the agent components are for, each one shown working with Kasane's data, and how to install them. React Router in framework mode, prerendered to static HTML, deployed to Vercel. The spec is [`docs/site.md`](../../docs/site.md); this file is how to work on it.

The site imports `tabular-ui` as any app would, from the built package. It never imports from `packages/ui/src`, and it never changes the library to make a page work: a gap in a component is raised as its own decision (`docs/site.md` §8).

## Run it

From the repository root:

| Command | What it does |
|---|---|
| `pnpm dev:site` | The dev server, with the package rebuilding on change |
| `pnpm build:ui && pnpm build:site` | Build the package, then prerender every route into `apps/site/build/client`, the files Vercel serves |
| `pnpm test:site` | The Playwright suite against that build: page checks and axe on every route, metadata, links, forced colours, reduced motion, the specimens. Build first. |
| `node apps/site/scripts/check-links.mjs` | Request every link to another site, Storybook story ids included. Off the PR gate: run it before a release. |
| `node apps/site/scripts/og-image.mjs` | Rewrite `public/og.png`, the social image, when the wordmark or the palette changes |
| `python3 -I apps/site/scripts/serif-trim.py` | Rewrite the site's trimmed serif in `src/fonts/` when `@fontsource-variable/source-serif-4` changes. Needs fontTools and brotli; the script's header says how to install them out of the repository. A test fails until it's run. |

**Lighthouse,** before a release, at mobile settings, against the build served as Vercel serves it (compressed):

```bash
node apps/site/tests/serve.mjs apps/site/build/client 8199
```

```bash
pnpm dlx lighthouse@12 http://localhost:8199/ --only-categories=performance,accessibility --chrome-flags="--headless=new" --view
```

Run each page several times and take the median: a single run varies by a point or two. The bar is 95 for Performance and Accessibility on Home and a component page (§12). Request every file once before the first run (the server compresses each file on its first request, and that run once scored a false 100), and write the Chrome and Lighthouse versions next to the scores: they're in the report's `environment.hostUserAgent` and `lighthouseVersion`. The same build scored 95 on 2026-10-27 and 86 on 2026-10-29, and without the versions nobody could say why.

The **VoiceOver** pass is manual, by the owner: [`docs/site-voiceover.md`](../../docs/site-voiceover.md).

## Where the content comes from

Nothing the site shows is typed twice. Each kind of content is read from the file that owns it:

| Content | Source |
|---|---|
| Copy the owner writes: page leads, principles, link labels | `src/content.ts` |
| The 15 components: names, moments, decisions, when to use them | `src/component-list.ts` |
| Whether a component is built | The shadcn registry, `packages/ui/registry.json` |
| Each built component's usage snippet | The first `tsx` block in its README, `packages/ui/src/components/product/<Name>/README.md` |
| Getting started's commands | `packages/ui/README.md`, by `##` section |
| Colour, type and spacing values | `tabular-ui/theme.css` and `docs/palette.json`, parsed at build time (`src/tokens-parse.ts`) |
| Every Kasane figure, ID, file name and date | `data/kasane.json`, written by `apps/demo`'s `export-fixtures` script. `tests/data.spec.ts` fails if `src/` types a figure. |

## Pages, metadata and links

- Routes are in `src/routes.ts`, and each module in `src/routes/`. A new page also goes in `tests/routes.ts`, so every check covers it, and in the sitemap (`src/routes/sitemap.ts`).
- **Every route's `meta` goes through `pageMeta()`** in `src/lib/meta.ts`: title, description, canonical URL (no trailing slash) and the Open Graph and Twitter tags. The 404 uses `notFoundMeta`, with no canonical and `noindex`.
- **Hydration starts after the first paint.** `buildEnd` in `react-router.config.ts` strips React Router's module preloads from every prerendered page and starts its module script once the page has loaded and painted (`src/lib/defer-hydration.ts`). A page must read and navigate without JavaScript; only its buttons wait. The axe tests check each page with the scripts blocked as well as hydrated.
- **Links are plain `<a>`**, never React Router's `<Link>`: every page is prerendered, and a full load moves focus and announces the title without any code. A test fails on any client-side link.
- A link inside a sentence is `textLink`; a link that stands alone is `standaloneLink`; the nav's are ghost buttons (`src/lib/styles.ts`). ↗ (`ExternalMark`) marks a link to another site, and only those.

## When a to-build component ships

Once the library has the component and it's in the registry (`pnpm build:registry`), its card on Home turns from dashed to built, and a page and a sitemap entry appear on the next build, because both read the registry. Then, in this order:

1. **The copy.** In `src/component-list.ts`, give its entry `useWhen` and `avoidWhen`, two lines each, for the owner to approve. The build fails on a built component without them.
2. **The specimen.** Add it to `src/specimens.tsx` and to the `specimens` map in `src/component-grid.tsx`, with Kasane data from `src/data.ts`. If it plays, use `Specimen` and `ReplayButton` from `src/playback.tsx`: the card holds its height, a live region announces the result once, and reduced motion shows the rest frame.
3. **The before and after.** Add its pair to `pairs` in `src/specimens.tsx`. The page throws without one.
4. **Its README's first `tsx` block** is the page's usage snippet. Check it reads well there.
5. **The tests.** Add `/components/<name>` to `componentPages` in `tests/routes.ts`. The page checks, axe, metadata, links and the sitemap check then cover it.
6. **The spec.** Note it in `docs/site.md`, and in the PR, a screenshot of the card and the page at 1440 and 390.

If it carries a principle, add it to that principle's `carriedBy` in `src/content.ts`, and its page shows "The rules it follows".
