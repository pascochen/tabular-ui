# DemoActions

The demo's own controls, in one row at the foot of the sidebar, above the visitor: **About this demo**, **Skip to the end** and **Start over**.

`AboutDemoButton` opens a dialog saying who the visitor is playing, what is fictional (the company), what is scripted (the people and the agents) and what is real (the interface), with links to Storybook and to the AI components on tabularui.com. While the sidebar is collapsed, the top nav holds it too.

Skip is disabled at the end, not hidden, so the row doesn't shift under the pointer. Start over goes back to landing from any point.

App-local: only the public demo needs it.

## Decisions

| Decision | Why |
|---|---|
| No banner | It sat in the top nav until 2026-11-04, with a `Demo` badge and "You're Daisuke Onodera…". The owner's call: it said too much. The tab title says it's a demo, the System note says the people are scripted on the first post, and the sidebar footer and the panel's "(you)" say who you are. The line is now in About's dialog |
| The top nav shows only while the sidebar is collapsed | With the banner gone, a pinned sidebar left it empty: 1200px of band at 1440. `App.tsx` hides it on `AppShell`'s `data-sidebar`. Main gains 49px, and the page, panel and sidebar headers share one rule at y=49. Collapsed, the band holds the toggle, which AppShell's peek depends on |
| About stays on screen at every width | Its dialog holds the demo's only links out. The sidebar starts collapsed under 1280px, so About is in the top nav there. Skip and Start over are behind the toggle: Skip saves about 16 seconds once the visitor has decided, and a reload does what Start over does |
| One row, not three | The row costs 32px with its gap, against 96px or more for three labelled rows. At 1280×720 the nav hides 49px, up from 17px. Three rows would hide 113px, nearly all of Direct messages. At 1280×800 and up, nothing is hidden |
| Skip and Start over are `IconButton`s | The row is 207px wide, and About needs 120px of it. Each has its full name as `aria-label` |
| About's left padding is `--pad-sidebar-item` here | It replaces `Button`'s 6px beside an icon, so About's icon starts at x=25 with the nav's and the avatar's. In the top nav it keeps `Button`'s own |
| The announcers sit outside `AppShell` | They were in the top nav. A hidden element's live region says nothing |
| Neutral throughout | Being a demo is context, not a state of the data (§0 rule 1) |
| Links use `buttonVariants` on a real `<a>` | They navigate. `Button render={<a/>}` would announce them as buttons (failure log) |
| "Start over", not "Replay" | In the user tests (2026-11-02), testers expected Replay to start an animation. It returns to landing, and the label now says so |

## Not tested with users

Moving About to the foot of the sidebar, and the "You're…" line into a dialog, haven't been in front of testers. Between 640px and 1023px nothing on screen on load says "(you)", as on a phone. Watch for both in the next round.
