# INSIGHTS.md

Three insights derived from 5 days of production gameplay data (Feb 10–14, 2026) across 89,104 events and 796 matches in LILA BLACK.

---

## Insight 1: PvP Combat is Nearly Nonexistent — Players Are Dying to Bots, Not Each Other

### What Caught My Eye
When I first looked at the event breakdown, the `Kill` and `Killed` counts were striking: **only 3 Kill events and 3 Killed events** across the entire 5-day dataset. In contrast, there were **2,415 BotKill events** (humans killing bots) and **700 BotKilled events** (humans killed by bots).

### The Numbers
| Event | Count | % of combat events |
|---|---|---|
| Kill (human killed human) | 3 | 0.09% |
| Killed (human killed by human) | 3 | 0.09% |
| BotKill (human killed bot) | 2,415 | 73.8% |
| BotKilled (human killed by bot) | 700 | 21.4% |
| KilledByStorm | 39 | 1.2% |

The tool confirms this spatially: plotting Kill events on the minimap shows 3 isolated markers spread across AmbroseValley. There are no "PvP hotspots" because PvP essentially isn't happening.

### Actionable Implications
**Metric affected:** PvP engagement rate (Kill / total combat events)  
**Current state:** ~0.09% — effectively zero  

**Possible root causes a Level Designer should investigate:**
- **Extract routes don't force player convergence** — if players can loot and extract through different corridors, they never meet. The traffic heatmap on AmbroseValley shows dispersed movement with no natural chokepoints.
- **Bot density is absorbing all combat** — with 2,415 bot kills vs 3 PvP kills, players may be fully occupied fighting bots and never seeking out other players.
- **Match size** — 779 of 796 matches had only 1 human player. Solo queue with bots means no PvP is possible by design. If this is intentional (PvE-first mode), it's working. If PvP is the design goal, matchmaking needs investigation.

**What a Level Designer should do:** Use the combat heatmap to identify where bot kills cluster. If those zones also have natural line-of-sight to other extract paths, adding environmental features (cover, elevated positions, narrower corridors) could force human players into the same space and create genuine PvP pressure.

---

## Insight 2: Grand Rift is Effectively Abandoned — 10x Less Play Than Ambrose Valley

### What Caught My Eye
The map distribution in the manifest was immediately alarming: **567 matches on AmbroseValley vs 59 on GrandRift** — a 9.6:1 ratio. Lockdown sits in the middle at 171 matches. This isn't a slight preference; GrandRift is barely in the rotation.

### The Numbers
| Map | Matches | Events | Avg Events/Match |
|---|---|---|---|
| AmbroseValley | 567 | 61,013 | 107.6 |
| Lockdown | 171 | 21,238 | 124.2 |
| GrandRift | 59 | 6,853 | 116.1 |

GrandRift has a healthy average event count per match (116), meaning when players do play it, they're as active as on other maps. The problem isn't that GrandRift is bad to play — it's that players aren't ending up there.

### Actionable Implications
**Metric affected:** Map rotation equity (% of matches per map)  
**Target state:** ~33% per map if rotation is meant to be even  
**Current state:** GrandRift at ~7.5%  

**Possible root causes:**
- **Matchmaking/rotation weighting** — GrandRift may simply be under-weighted in the queue rotation. This is a backend fix, not a design fix.
- **Map availability by date** — Using the day filter in the tool reveals GrandRift matches are not evenly distributed; checking if GrandRift was added later in the dataset window is worth investigating.
- **Player avoidance** — If players have a map vote or preference system, GrandRift may be actively avoided. The tool can't confirm this from telemetry alone, but it's the hypothesis to test.

**What a Level Designer should do:** First rule out matchmaking as the cause (data team). If matchmaking is balanced and GrandRift is still underplayed, use the tool's traffic heatmap on GrandRift to compare spatial coverage vs AmbroseValley — are players moving through the full map or dying in a small area? Sparse traffic in parts of GrandRift would suggest the map layout itself isn't rewarding exploration.

---

## Insight 3: Loot Is the Primary Player Activity — But Its Distribution May Be Creating Dead Zones

### What Caught My Eye
**Loot events (12,885) are the second most common event type after position tracking** — more than 4x the total combat events combined. This tells us looting is the dominant moment-to-moment gameplay loop. The spatial distribution of those loot events, visible in the tool's loot heatmap, shows clear clustering rather than even spread.

### The Numbers
| Event Category | Count | % of Non-Movement Events |
|---|---|---|
| Loot | 12,885 | 77.8% |
| Bot combat (BotKill + BotKilled) | 3,115 | 18.8% |
| Storm deaths | 39 | 0.2% |
| PvP combat | 6 | 0.04% |

On AmbroseValley specifically, the loot heatmap shows 2–3 high-density zones with large portions of the map having minimal loot activity. This suggests players have learned where the high-value loot spawns and are routing directly to those zones, ignoring large parts of the map.

### Actionable Implications
**Metric affected:** Map coverage rate (% of map area with loot activity), average loot-to-extract time  

**What this means for Level Design:**
- **High-density loot zones create predictable player routing** — if everyone knows where the best loot is, the map becomes smaller than it actually is. Players skip large sections entirely, which means those sections aren't worth having.
- **Cross-referencing loot density with bot kill density** (both visible in the tool) reveals whether combat is happening near loot zones or away from them. High loot + low combat = players looting unopposed, which is low tension. High loot + high bot combat = players have to fight for resources, which is better design.
- **Storm death distribution** (39 events, all visible as purple markers) shows where players are getting caught by the storm. If storm deaths cluster far from loot-dense areas, it suggests players are over-extending to reach loot and getting punished on the way back.

**What a Level Designer should do:** Redistribute loot spawn weights to pull players toward underused sections of the map. Use the tool's side-by-side view of traffic vs loot heatmaps to identify "dead zones" — areas with low traffic AND low loot. Adding medium-value loot to those zones gives players a reason to route through them, increasing map utilization and creating more organic player encounters.
