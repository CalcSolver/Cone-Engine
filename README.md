# PolyEngine 3D Pro Studio (v4.0)

A multi-project low-poly WebGL studio with isolated object keyframing and integrated 3D gizmo controls for Vercel deployment.

## Upgrades in v4.0
- **Right-Click Camera Orbiting & Left-Click Mesh Selection:** Right-click and drag rotates your perspective without pointer lock. Left-clicking meshes highlights them with emissive outlines.
- **3D Transform Gizmo:** Intersecting 3D arrows appear over selected meshes, allowing manual dragging along the X, Y, or Z axes.
- **Independent Per-Object & Character Timeline:** Keyframes are saved independently for each individual mesh and character part rather than globally.
- **Project Management Architecture:** Features an explicit "My Projects" dashboard for creating, naming, editing, saving, and deleting multi-file projects stored directly under user accounts in Firestore.
- **Color & Uniform Resizing:** Inspect, recolor, and scale selected items on the fly using input fields or quick uniform scaling triggers.

## Deployment & Setup
```bash
npm install
npm run dev
