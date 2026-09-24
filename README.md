# QBIKK — standalone landing page

The current page is `index.html`: inline CSS and JavaScript, native WebGL, no framework and no build step. Keep the `assets` folder alongside it.

## Open locally

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. The existing development server at http://127.0.0.1:5173 also serves this file; it is optional. Google Fonts loads Geist, Geist Mono and Instrument Serif; system fallbacks work if fonts are unavailable.

## Deliverables

- `index.html`: complete page, theme persistence, shader, scripted demo and waitlist placeholder dialog.
- `assets/qbikk-wordmark.png`: transparent alpha mask extracted from the supplied black wordmark. CSS recolors it through the theme's ink token.
- `assets/qbikk-icon.png`: 180×180 icon extracted from the supplied rounded-square Q artwork, with transparent outer corners.

The older `src/` React implementation and its recognition tests are historical and are not loaded by this page.

## Interaction

Tap the microphone or press Space outside a control to cycle through five scripted scenes. Tapping during listening finishes the current scene. Each word drives a synthetic voice envelope; the cube shifts from listening to a processing sweep to a brief bloom. Memory chips show the scripted result. The final scene recalls Maria's budget from the first scene.

No microphone is requested, no audio is recorded, and no AI service is connected. Transcript, reminder, contact and recall results are examples only. Nothing is scheduled or saved. Theme choice is stored locally when browser storage permits it.

The waitlist button currently opens an honest “Waitlist opening soon” dialog. It does not collect addresses. Replace that destination when a signup URL is provided.

## Rendering and accessibility

The cube is a fragment-shader volume, with a soft rounded-box shell, moving internal currents, face-based blue/teal/green/orange hues, grain and domain-warped gel motion. DPR is capped at 1.5; rendering pauses in hidden tabs. Reduced-motion runs cube motion at 35% speed and removes CSS transitions/animations. If WebGL is unavailable, the canvas hides and the rest of the page remains functional.

The page occupies one viewport; below 620px height it allows scrolling. Controls have focus indicators and accessible names. Scripted text and results have live announcements. Light/dark mode initializes before first paint.

No automated tests or production build were run for this iteration. The rendered composition was reviewed visually.
