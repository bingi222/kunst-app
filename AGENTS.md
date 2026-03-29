# AGENTS.md

## Cursor Cloud specific instructions

This is a single-page **React** app (Create React App) called **KUNST** — an Instagram-like art feed. There is no backend, database, or external API keys required. All data is in-memory.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| React Dev Server | `npm start` | 3000 | Only service; serves the app with hot-reload |

### Lint / Test / Build

- **Lint:** `npx eslint src/` — uses CRA's built-in `react-app` ESLint config.
- **Test:** `CI=true npm test -- --watchAll=false` — runs Jest non-interactively. Note: the default `App.test.js` has a pre-existing failure (looks for "learn react" text that doesn't exist in the app).
- **Build:** `npm run build`

### Gotchas

- The three stub component files (`src/Feed.js`, `src/Login.js`, `src/Upload.js`) are empty and unused; all components live in `src/App.js`.
- Images load from public Unsplash/Pravatar URLs; no API keys needed, but network access is required for images to render.
