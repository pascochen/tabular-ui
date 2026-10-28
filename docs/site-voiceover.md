# tabularui.com: VoiceOver script

The manual pass `docs/site.md` §11 asks for, on Home, one component page and Color. The automated checks (axe at WCAG 2.2 AA on every route, headings, landmarks, focus, forced colours, links) run on every PR; this is what they can't hear.

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

**When you're done,** turn VoiceOver off with Command-F5, and send the step numbers that differed, with what you heard.
