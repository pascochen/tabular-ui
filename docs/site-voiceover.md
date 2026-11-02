# tabularui.com: VoiceOver script

The manual pass `docs/site.md` §11 asks for, on Home, one component page and Color, plus steps 11 to 16 for D12's links on Color. The automated checks (axe at WCAG 2.2 AA on every route, headings, landmarks, focus, forced colours, links) run on every PR; this is what they can't hear.

**Setup.** macOS, Safari, the production site (`https://tabularui.com`) or a preview. Turn VoiceOver on with Command-F5. VO means Control-Option. Turn on VoiceOver's caption panel (VO-Command-F8, Visuals) if you want to read what it says as well as hear it.

Each step says what to do, then what you should hear. Write down anything that differs, with the step number.

| # | Do | Expect to hear |
|---|---|---|
| 1 | Open `https://tabularui.com`. Wait for the page to load. | The page title, "Tabular UI". |
| 2 | Press Tab once. Then press VO-Space. | "Skip to content, link". After VO-Space, VoiceOver moves into the main content and starts reading at the hero heading. |
| 3 | Press VO-U, then Left or Right Arrow until the Landmarks list. Press Escape. | A banner, a navigation named "Main", a main, a navigation named "Components by moment", and a content information landmark (the footer). Nothing else, and no unnamed navigation. |
| 4 | Press VO-U again and open the Headings list. Press Escape. | One heading level 1, "A design system for the human in the loop". Then "15 components" at level 2, the five moments at level 3 (Asking, Thinking, Showing, Waiting, Recording), and a level 4 heading per component. No level is skipped. |
| 5 | Move with VO-Right Arrow through the hero to its two buttons and the specimen. | "Demo (soon), dimmed, button": dimmed, so you know it can't be used yet. Then "Browse components, link". In the specimen, "Question: Did we pay any invoice twice?", then the answer, then "Replay the hero’s run, button". |
| 6 | Press VO-Space on Replay. Wait until the specimen stops. | Focus stays on Replay. When the run finishes, one short announcement of the result, said once, not word by word. |
| 7 | Press VO-U, Landmarks, choose "Components by moment". Move with VO-Right Arrow. Press VO-Space on "Agent plan". | Each moment name is read as text, not as a link ("Asking", then its components as links). After VO-Space, VoiceOver moves to the Agent plan card. |
| 8 | Open `/components/agent-block`. Press Tab until "All 10 components". Press VO-Space, then Down Arrow through the list, then Escape. | "All 10 components, menu button" (or "pop-up button"). In the menu, the ten components in run order, with Agent block marked as checked or current. Escape closes it and returns to the button. |
| 9 | On the same page, Tab to "Copy command" and press VO-Space. Then Tab to the end of the page. | "Copy command, button". After VO-Space, "Copied", said once. At the end, "Previous, Attachment row, link" and "Next, Chat thread, link", each with its direction in its name. |
| 10 | Open `/foundations/color`. Press VO-U, Links list, then Escape. Then read the Interactive role with VO-Right Arrow. | The Foundations links "Color", "Typography" and "Density", with Color as the current page. In the role row, "Light", then each token's name and step read as text (`text-interactive`, "sage-700, 6.23:1"). The swatches themselves are silent: they're decoration, and their names and figures sit beside them. |

## The bordered Foundations links (D12, 2026-11-02)

The links on Color changed from an underline to the bordered look, and they must still be plain links. Run this on the PR's preview until it merges, then on `https://tabularui.com`. The automated checks confirm the links are `<a>` elements with `aria-current`; only this confirms what you hear.

| # | Do | Expect to hear |
|---|---|---|
| 11 | Open `/foundations/color`. Press VO-U, then Left or Right Arrow until the Landmarks list. Press Escape. | A navigation named "Foundations", beside the "Main" navigation and the others from step 3. |
| 12 | Move with VO-Right Arrow from the start of the main content, through the "Foundations" label and the three links. | "Foundations", then a list of 3 items, then "Color, current page, link", "Typography, link" and "Density, link". You should not hear "tab", "selected", "tab group" or "button" on any of them. |
| 13 | Press VO-U, Links list, then Escape. | The same three links by name, with Color marked as the current page. Each name appears once for these links. Color may also appear in the footer's Foundations column. |
| 14 | Press Tab until focus reaches Color, then Tab through Typography and Density, looking at the screen as well. | Each link is read when it takes focus. On screen, Color's ring is a paper line inside the ink box, and the other two have a dark ring inside their border. No ring is hidden by a neighbouring border. |
| 15 | Tab back to Typography and press VO-Space. | A new page loads and its title is announced. Then, as in step 12, "Typography, current page, link". Color is now just "Color, link". |
| 16 | In Safari's Develop menu, choose Disable JavaScript, and reload `/foundations/color`. Press VO-Space on Density. Then turn JavaScript back on. | Steps 11 and 12 sound the same with JavaScript off, and Density loads. This is the case tabs would have broken. |

**When you're done,** turn VoiceOver off with Command-F5, and send the step numbers that differed, with what you heard.
