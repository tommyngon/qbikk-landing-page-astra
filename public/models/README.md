# Future hero asset

This is the drop-in folder for `hero-object.glb`. No final asset is required for
Phase 1; the site currently displays procedural geometry.

Supply the file here and tell the lead task: **“Integrate hero-object.glb for Phase 2.”**
The lead owns all code changes. You do not need to write Blender or Three.js code.

A GLB is the packaged object exported from Blender. React Three Fiber places it
inside the existing page and controls its camera, lighting, and interaction.
In Phase 2 the lead will use `useGLTF` to load it and `useAnimations` to preserve
its clips, play `Idle` when motion is enabled, and stop animation for reduced motion.
The existing procedural object stays available during loading or asset failure.

The final shape and modeling approach require your approval. File placement alone
does not enable an unreviewed asset. No model is loaded or fetched in Phase 1.
