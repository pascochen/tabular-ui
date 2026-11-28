# Five-moments demo — interview playback (2026-11-27)

Method: Interview me to sharpen an idea (UX + AI library).

## The sharpened idea

Replace the Kasane demo (`apps/demo`) with a page of five separate, interactive scenes, one for each moment of an agent run: Asking, Thinking, Showing, Waiting, Recording. Only one scene is on screen at a time, picked from a bar across the top (layout B). Each scene waits for the visitor: a pulsing dot marks what to click next, and clicking plays the agent's response. Each component in a scene is labelled with its name, and each name links to its Storybook page. The page is mainly for designers, then engineers and recruiters. It succeeds when they leave thinking the agent components feel intuitive, smooth and minimal.

## What we uncovered

- **Audience:** mainly designers, then engineers and recruiters.
- **Success:** "the agentic component feels intuitive. Smooth and minimalistic." It has to feel that way to someone using the agent and to someone imagining building with it.
- **What's on show is the interaction, not the copy:** how the agent works through visuals and symbols. The wording is not what's being judged.
- **Why replace the current demo:** it holds a bit of everything (chat, channels, tasks). Visitors are looking for components to build their own apps, and a whole made-up product can bias them toward copying it.
- **The visitor sets the pace:** nothing moves until they act. A pulsing dot nudges them.
- **Five independent scenes:** a visitor can jump straight to any moment.
- **One moment on screen:** the two panes in the wireframes were two moments in a row, not a pair.
- **From the demo to building:** component names labelled on the scene, each linking to Storybook.

## Still open

1. **Words in the scenes.** The copy isn't being judged, but a scene still needs a question and an answer. Do we reuse Kasane's data, use neutral placeholders, or keep it to the minimum? The agent-voice rules apply whichever we pick.
2. **The pulsing dot.** `StatusDot` already means "waits on the viewer" (solid ochre). Do we reuse it? A pulse is new motion: what does it do under reduced motion, and is it the only cue (rule: colour is never used alone)?
3. **End of a scene.** What does the visitor see once the action has played: replay, reset, or a pointer to the next moment?
4. **Labels vs. minimal.** Names on every component could clutter the scene. Are they always shown, or revealed on demand?
5. **Which components in which moment.** The site's Home already groups 15 components by moment. Does the demo use the same mapping?
6. **Overlap with the site.** Home's Components section is already grouped by moment. What does this page give that it doesn't?
7. **Phone.** Does a scene have to work at phone width? Recruiters often open links on a phone.
8. **Replacing `apps/demo`.** Its URL, the links to it from the site, the Kasane data and `og.png` in `public/`.

## Conclusion

- One scene at a time, five independent moments, a top bar to switch between them.
- Paced by the visitor: nudge, click, watch the agent respond.
- Interaction is the subject. Copy is minimal.
- Component names on the scene link to Storybook.
- Open questions to settle next: the words in the scenes, the nudge mark and its motion, the end of a scene, how the labels show, the overlap with Home, phone width.
