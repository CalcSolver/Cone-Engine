# PolyEngine 3D Pro Studio (v3.0)

A WebGL game engine designed for Vercel deployment featuring an Apple-inspired glassmorphism studio interface.

## Upgrades in v3.0
- **Fixed Render Lifecycles:** Canvas elements automatically trigger layout recalculations when switching tabs.
- **Pointer-Lock 3D Navigation:** Left-click the canvas to lock the mouse for FPS-style camera control without requiring right-clicks.
- **Object Inspector & Inspector Keyframing:** Double-click any 3D object to select it, inspect exact X/Y/Z positions, modify coordinates, and capture keyframes.
- **Firestore Publishing Sync:** Publishing pushes documents directly to `community_games` with an automated refresh cycle.

## Local Running
```bash
npm install
npm run dev
