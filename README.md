# LILA BLACK — Map Intel Layer

> A browser-based player behavior visualization tool for LILA BLACK Level Designers.

**Live URL:** `[replace-with-your-vercel-url]`

---

## What It Does

Renders 5 days of production gameplay data (89,104 events, 796 matches) on top of in-game minimaps. Designed for Level Designers — not data scientists.

**Features:**
- Player journey paths (human vs bot, visually distinct)
- Kill, death, loot, and storm death event markers with distinct shapes
- Heatmaps: traffic, combat, loot, storm zones
- Filter by map, date, and individual match
- Per-match timeline playback with speed controls

---

## Running Locally

**Prerequisites:** Node.js 18+

```bash
git clone <repo-url>
cd lila-viz-app
npm install
npm run dev
```

The pre-processed JSON files and minimap images are already committed — the tool works immediately.

### Re-run the Data Pipeline (optional)

```bash
pip install pyarrow pandas numpy
python scripts/process_data.py --data-dir /path/to/player_data --out-dir public/data
```

---

## Deploy to Vercel

1. Push repo to GitHub
2. Import at vercel.com → Framework: **Vite** → Build: `npm run build` → Output: `dist`
3. Done. No env vars needed.

---

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Stack, data flow, coordinate mapping, tradeoffs
- [INSIGHTS.md](./INSIGHTS.md) — Three data-backed insights for the Level Design team
