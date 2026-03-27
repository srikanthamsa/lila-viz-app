# ARCHITECTURE.md

## What I Built

A browser-based map intelligence tool for LILA BLACK Level Designers. It renders player journeys, combat events, loot activity, and storm deaths as interactive overlays on the in-game minimaps — with filtering, heatmaps, and per-match playback.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast iteration, clean component model, zero-config Vercel deploy |
| Rendering | Canvas API (no libs) | Handles 89K points at 60fps without a heavy charting library |
| Data pipeline | Python + PyArrow | Native parquet support; outputs static JSON at build time |
| Hosting | Vercel | Free, instant shareable URL, works with static assets |
| Data format | Pre-processed static JSON | Eliminates backend complexity; 3 files serve the entire dataset |

---

## Data Flow

```
1,243 .nakama-0 parquet files
        │
        ▼
scripts/process_data.py
  - Reads all files with PyArrow
  - Decodes event bytes → UTF-8 strings
  - Detects humans (UUID user_id) vs bots (numeric user_id)
  - Converts world coords (x, z) → canvas coords (0–1024 range)
  - Buckets events into 64×64 heatmap grids per category
  - Outputs match metadata index
        │
        ▼
public/data/
  AmbroseValley.json  (10.4 MB)
  GrandRift.json      (1.2 MB)
  Lockdown.json       (3.6 MB)
  manifest.json       (summary)
        │
        ▼
React App (browser)
  - Loads map JSON on demand (cached after first load)
  - Filters events by map / day / match in-memory
  - Canvas renders: minimap image → paths → events → heatmap overlay
  - Timeline scrubs ts values within a match to animate playback
```

---

## Coordinate Mapping

The README specifies a world-to-UV formula. The tricky part: minimap images are **not** 1024×1024 as the README implies — they are 4320×4320 (AmbroseValley), 2160×2158 (GrandRift), and 9000×9000 (Lockdown).

My approach: normalize everything to a **1024×1024 canvas coordinate space** during the Python pipeline, then let the canvas element scale to fit the viewport. This decouples rendering resolution from image resolution.

```python
# World → UV (0 to 1)
u = (x - origin_x) / scale
v = (z - origin_z) / scale

# UV → 1024-unit canvas space
canvas_x = u * 1024
canvas_y = (1 - v) * 1024   # Y-flipped: image origin is top-left

# At render time, canvas scales to actual pixel dimensions
pixel_x = canvas_x * (canvas_width / 1024)
pixel_y = canvas_y * (canvas_height / 1024)
```

**Note:** The `y` column in the data is elevation (3D height), not a map coordinate. Only `x` and `z` are used for 2D plotting.

---

## Assumptions Made

| Ambiguity | Assumption |
|---|---|
| README says images are 1024×1024 | They're not — actual sizes vary. Normalized to 1024 canvas units. |
| `ts` column epoch | Stored as ms since Unix epoch, offset to ~Jan 21 1970. Used as relative ordering within a match. |
| Bot detection | Numeric `user_id` (no dashes) = bot, UUID (with dashes) = human. Confirmed in README. |
| `.nakama-0` suffix on match_id | Stripped for cleaner display; same match can span multiple server nodes but data shows one node. |
| February 14 partial day | Included as-is; flagged in UI date filter. Lower event count is expected. |

---

## Major Tradeoffs

| Decision | Alternative Considered | Why I Chose This |
|---|---|---|
| Static JSON (pre-processed) | DuckDB in browser / server backend | No backend = simpler deploy, instant load, free hosting |
| Canvas API | Deck.gl / Leaflet / MapLibre | No map tile dependency, no license issues, full control over rendering |
| All data in 3 JSON files | Split by match ID | Simpler loading logic; 10MB is fast on modern connections |
| 1024 internal coord space | Use actual image pixels | Decouples data from image resolution; works at any display size |

---

## What I'd Do With More Time

1. **Tile the large JSON files** — AmbroseValley.json at 10.4MB takes ~1s on fast connections. Splitting into per-match chunks with lazy loading would make the initial load instant.
2. **WebGL heatmaps** — The current canvas heatmap is grid-based (64×64 cells). A proper kernel density estimate rendered in WebGL (via deck.gl) would produce smoother, more accurate heatmaps.
3. **Click-to-inspect** — Clicking a kill or death marker should show who died, who killed them, and the full event context. Requires a spatial index (quadtree) on the canvas.
4. **Cross-match player tracking** — The same `user_id` appears across multiple matches. Tracking a single player's performance across their session history would reveal player skill distribution.
5. **Bot ratio analysis per match** — Understanding whether bot-heavy matches correlate with shorter durations or different spatial patterns would help tune bot spawning logic.
