# QBikk hero asset handoff

## What the references suggest

The first recording shows a white QBikk landing page with a large, upright black smartphone as the main visual. It has a sparse, dark screen carrying the QBikk mark, and a small set of finish swatches below. Scrolling moves through concise product-story sections and finishes at a dark waitlist panel. The second recording is a separate visual direction for a calm, human-centered collaborative board: soft cream surfaces, vivid green notes, and a compact product UI. Neither recording establishes a need for a detailed custom 3D environment.

**Phase 1 uses a procedural placeholder.** The final hero shape and modeling approach remain undecided until the user reviews and approves a concrete design. Do not treat the smartphone seen in the first recording as an approved product model brief. It is a visual reference only. The second recording is a separate visual direction for a calm, human-centered collaborative board; it likewise does not decide the final hero object. A custom model should be commissioned only if the chosen design gains meaningful visual value from 3D.

## Modeling decision (pending user approval)

No final silhouette, proportions, part list, or material palette is approved yet. Once a design is approved, replace this section with its specific Blender brief. Until then, keep the integration independent of the object's identity, use neutral `Hero_*` node names, and avoid modeling decisions based solely on the phone in the inspiration recording.

## Materials and textures

- Use glTF Principled BSDF-compatible PBR materials only. Final colors and material properties await design approval. Keep materials few and easy for React to override where a user-controlled variant is expected.
- No baked lighting, Blender-only shader nodes, procedural texture dependencies, or external texture paths. Keep changeable text/UI outside the model (HTML or a Three.js overlay); do not bake small QBikk lettering into a texture.
- If a surface detail truly needs a texture, pack it into the GLB, use a small power-of-two image (512–1024 px), and prefer WebP/KTX2 in the web pipeline when supported. The base hero needs no texture maps.

## Camera and lighting assumptions

- The web scene owns the camera and lighting. Export the hero object alone, without Blender cameras, lights, floor, background, or world. The approved shape should fit a 35–50 mm equivalent perspective and read clearly at desktop and mobile sizes. No camera-facing billboard.
- Use a clean white/off-white page backdrop with a soft key and fill in React Three Fiber. Ambient occlusion/contact shadow should be subtle and inexpensive. The model should read under a simple environment map plus one key light; avoid mirror-like highlights that only work in the Blender studio setup.
- Let the site place and scale the model responsively; the model must not include a shadow-catching floor plane. Its orientation and origin must be documented at handoff.

## Animation and naming contract

Keep the GLB static unless the browser benefits from an authored motion. Scroll-driven movement belongs in React Three Fiber so it can follow actual scroll position and reverse smoothly. Phase 2 starts when `hero-object.glb` is supplied; final interaction can then be matched to that asset and the approved page design.

If authored clips are required, provide:

- `Idle`: optional 0–2 s loop for a very slight float (about 1–2% of the object's height) and restrained yaw sway (under 3 degrees). Do not animate material values. The browser may instead create this subtle idle procedurally.
- Do not add a `Reveal` or variant-specific clips unless the approved design and implementation explicitly require them. UI-controlled color/material changes belong in React.

Use one root named `Hero_Root` and descriptive neutral mesh names such as `Hero_Body` and `Hero_Detail_*`. Keep clips in the GLB animation list with exact names and no unintended NLA actions. Phase 1 procedural placeholder does not require a clip.

## Interaction expected in the page

- If the approved design benefits from motion, scroll progress may drive a small change in yaw and position while the model remains visually anchored in the hero column; transition to later product sections should not trap scroll or require a scroll-jacking canvas.
- Pointer movement may add a subtle parallax tilt (maximum about 4 degrees each axis). Drag-to-orbit is not part of the landing page interaction.
- Any variant selector remains HTML UI and updates the relevant material/variant only. Keyboard focus and touch activation must work. On touch devices, disable pointer-follow motion and use scroll only.
- Respect `prefers-reduced-motion`: show a stable approved hero pose and disable float, parallax, and scroll-linked movement.

## GLB export requirements

1. Apply object transforms; use meters, +Z up, centered XY, base at Z=0. Document the approved object's forward axis and origin in the handoff. Keep scale consistent and do not require a magic runtime scale factor.
2. Export selected hero meshes to binary glTF (`.glb`), glTF 2.0. Include mesh, normals, UVs only if used, PBR materials, and named animation clips only if explicitly requested. Exclude cameras/lights, hidden objects, unused materials, and Blender extras.
3. Triangulate on export or ensure triangulation is stable. Use smooth normals on curved edges and hard edges where appropriate. No modifiers or dependencies should remain unapplied unless supported in glTF.
4. Pack all required images into the GLB. Do not use Draco or meshopt unless the web loader is configured to decode it. Deliver an uncompressed GLB first; run the repository's established optimizer after integration if one exists.
5. Open the exported GLB in a clean viewer and verify orientation, dimensions, materials, clip names, and that the front/back are correctly oriented. Keep a Blender `.blend` source alongside the delivery for future revisions; the web app consumes only the GLB.

## Performance budget

- Target **under 2 MB** for the hero GLB (prefer under 1 MB), **under 25k triangles**, and at most 6 draw calls/materials. No dense micro-detail, transparent layers, or multiple 4K maps.
- Keep the mobile scene to one model, one key light plus ambient/environment lighting, and a capped device-pixel ratio (around 1.5–2). Pause rendering when offscreen or the tab is hidden; fall back to the static Phase 1 procedural placeholder when WebGL is unavailable or reduced-performance mode is selected.
- Use lazy loading for the canvas/model and avoid blocking first paint. Set a sensible canvas resolution on mobile and avoid real-time shadows unless profiling shows they fit the frame budget.

## Exact handoff: `public/models/hero-object.glb`

From the repository root, the Blender artist should:

1. Create `public/models/` if it does not already exist.
2. Export the final binary glTF to **`public/models/hero-object.glb`** (exact lowercase filename and path).
3. Include the `.blend` source and a small preview render in the handoff folder for review, but do not put those files in the runtime URL path unless the application explicitly needs them.
4. Send the model scale/orientation note, exported clip names (or “static, no clips”), triangle count, file size, and any texture/decoder requirements with the handoff.

The React Three Fiber integration should load `/models/hero-object.glb` (public-root URL, no `/public` prefix), normalize only if necessary, and retain the procedural Phase 1 placeholder while loading and as the failure fallback. Treat the model as a neutral GLB swap-in: consume its root, meshes, PBR materials, and optional `Idle` clip without assuming it is a phone. Phase 2 begins when the approved `hero-object.glb` is supplied; integrate and review its silhouette and materials at desktop and mobile sizes then.
