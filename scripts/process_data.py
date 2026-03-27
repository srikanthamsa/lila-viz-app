"""
LILA BLACK - Data Pipeline
Converts 1,243 parquet files -> 3 JSON files (one per map) + 1 manifest JSON
Run: python scripts/process_data.py --data-dir <path_to_player_data> --out-dir public/data
"""

import pyarrow.parquet as pq
import pandas as pd
import numpy as np
import os, json, argparse, math
from collections import defaultdict

# ── Map config (from README) ──────────────────────────────────────────────────
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473, "img": "AmbroseValley_Minimap.png",  "img_w": 4320, "img_h": 4320},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290, "img": "GrandRift_Minimap.png",      "img_w": 2160, "img_h": 2158},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500, "img": "Lockdown_Minimap.jpg",       "img_w": 9000, "img_h": 9000},
}

# Normalize to 1024x1024 for frontend (canvas will scale)
CANVAS_SIZE = 1024

def world_to_canvas(x, z, map_id):
    cfg = MAP_CONFIG[map_id]
    scale_x = cfg["scale"]
    scale_z = cfg["scale"] * (cfg["img_h"] / cfg["img_w"])
    u = (x - cfg["origin_x"]) / scale_x
    v = (z - cfg["origin_z"]) / scale_z
    px = u * CANVAS_SIZE
    py = (1 - v) * CANVAS_SIZE
    return round(px, 2), round(py, 2)

def is_human(user_id):
    return "-" in str(user_id)

DAYS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

EVENT_CATEGORIES = {
    "Position":     "movement",
    "BotPosition":  "movement",
    "Kill":         "combat",
    "Killed":       "combat",
    "BotKill":      "combat",
    "BotKilled":    "combat",
    "KilledByStorm":"storm",
    "Loot":         "loot",
}

def load_all(data_dir):
    frames = []
    for day in DAYS:
        folder = os.path.join(data_dir, day)
        if not os.path.exists(folder):
            continue
        for fname in os.listdir(folder):
            fp = os.path.join(folder, fname)
            try:
                df = pq.read_table(fp).to_pandas()
                # Nuance: Bytes encoding
                for col in ["event", "user_id", "match_id", "victim_id"]:
                    if col in df.columns:
                        df[col] = df[col].apply(
                            lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x) if pd.notna(x) else x
                        )
                
                # Nuance: Bot detection
                df["is_human"] = df["user_id"].apply(lambda u: "-" in str(u))
                
                if "victim_id" in df.columns:
                    df["victim_human"] = df["victim_id"].apply(lambda u: "-" in str(u) if pd.notna(u) else False)
                else:
                    df["victim_human"] = False

                # Event renaming based on bot detection
                def rename_event(row):
                    ev = row["event"]
                    if pd.isna(ev): return ev
                    h = row["is_human"]
                    vh = row.get("victim_human", False)
                    has_vic = pd.notna(row.get("victim_id"))
                    
                    if ev == "Position" and not h:
                        return "BotPosition"
                    
                    if ev == "Kill":
                        if h and not vh and has_vic:
                            return "BotKill"      # Human killed bot
                        if not h and vh and has_vic:
                            return "BotKilled"    # Bot killed human
                    
                    if ev == "Killed" and not h:
                        return "BotKill"
                    if ev == "Killed" and h and has_vic and not vh:
                        return "BotKilled"
                        
                    return ev

                df["event"] = df.apply(rename_event, axis=1)

                df["day"] = day
                if "match_id" in df.columns:
                    df["match_id"] = df["match_id"].str.replace(".nakama-0", "", regex=False)
                
                # Nuance: Timestamp conversion (pandas datetime64[ns] to int64 ms)
                if np.issubdtype(df["ts"].dtype, np.datetime64):
                    df["ts_ms"] = df["ts"].astype("int64") // 1_000_000
                else:
                    # Fallback if it's already an epoch
                    df["ts_ms"] = df["ts"].astype("int64")
                    # If it's huge, assume ns
                    if df["ts_ms"].max() > 1e15:
                        df["ts_ms"] = df["ts_ms"] // 1_000_000

                frames.append(df)
            except Exception as e:
                print(f"  skip {fname}: {e}")
    print(f"Loaded {len(frames)} files")
    return pd.concat(frames, ignore_index=True)

def build_heatmap(events_df, map_id, grid=64):
    """Bucket events into a grid for heatmap overlay."""
    heatmaps = {}
    for category in ["movement", "combat", "loot", "storm"]:
        sub = events_df[events_df["event"].map(EVENT_CATEGORIES) == category]
        if sub.empty:
            heatmaps[category] = []
            continue
        coords = sub.apply(lambda r: world_to_canvas(r["x"], r["z"], map_id), axis=1)
        xs = np.array([c[0] for c in coords])
        zs = np.array([c[1] for c in coords])
        # Bin into grid
        x_bins = np.floor(xs / CANVAS_SIZE * grid).astype(int).clip(0, grid-1)
        z_bins = np.floor(zs / CANVAS_SIZE * grid).astype(int).clip(0, grid-1)
        counts = defaultdict(int)
        for xb, zb in zip(x_bins, z_bins):
            counts[f"{xb},{zb}"] += 1
        max_count = max(counts.values()) if counts else 1
        cells = [
            {"gx": int(k.split(",")[0]), "gy": int(k.split(",")[1]), "v": round(v / max_count, 4)}
            for k, v in counts.items()
        ]
        heatmaps[category] = cells
    return heatmaps

def build_map_data(df, map_id):
    mdf = df[df["map_id"] == map_id].copy()
    if mdf.empty:
        return None

    # Match index
    match_ids = sorted(mdf["match_id"].unique())
    matches = []
    for mid in match_ids:
        m = mdf[mdf["match_id"] == mid]
        ts_min = int(m["ts_ms"].min())
        ts_max = int(m["ts_ms"].max())
        n_humans = int(m[m["is_human"]]["user_id"].nunique())
        n_bots = int(m[~m["is_human"]]["user_id"].nunique())
        day = m["day"].iloc[0]
        event_counts = m["event"].value_counts().to_dict()
        matches.append({
            "id": mid,
            "day": day,
            "ts_min": ts_min,
            "ts_max": ts_max,
            "duration_ms": ts_max - ts_min,
            "n_humans": n_humans,
            "n_bots": n_bots,
            "n_events": len(m),
            "event_counts": event_counts,
        })

    # Events (all, with canvas coords)
    events = []
    for _, row in mdf.iterrows():
        try:
            cx, cy = world_to_canvas(row["x"], row["z"], map_id)
        except:
            continue
        # Skip out-of-bounds
        if cx < -100 or cx > CANVAS_SIZE + 100 or cy < -100 or cy > CANVAS_SIZE + 100:
            continue
        events.append({
            "uid": str(row["user_id"]),
            "mid": str(row["match_id"]),
            "day": row["day"],
            "ev": row["event"],
            "h": int(row["is_human"]),   # 1=human, 0=bot
            "cx": cx,
            "cy": cy,
            "ts": int(row["ts_ms"]),
        })

    # Heatmaps
    heatmaps = build_heatmap(mdf, map_id)

    # Stats
    stats = {
        "total_events": len(mdf),
        "total_matches": len(match_ids),
        "event_breakdown": mdf["event"].value_counts().to_dict(),
        "human_events": int(mdf["is_human"].sum()),
        "bot_events": int((~mdf["is_human"]).sum()),
    }

    print(f"  {map_id}: {len(matches)} matches, {len(events)} events")
    return {
        "map_id": map_id,
        "cfg": {
            "scale": MAP_CONFIG[map_id]["scale"],
            "origin_x": MAP_CONFIG[map_id]["origin_x"],
            "origin_z": MAP_CONFIG[map_id]["origin_z"],
            "img": MAP_CONFIG[map_id]["img"],
        },
        "matches": matches,
        "events": events,
        "heatmaps": heatmaps,
        "stats": stats,
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="../player_data", help="Path to player_data folder")
    parser.add_argument("--out-dir", default="public/data", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    print("Loading all parquet files...")
    df = load_all(args.data_dir)
    print(f"Total rows: {len(df)}")

    manifest = {"maps": [], "days": DAYS, "total_events": len(df), "total_matches": df["match_id"].nunique()}

    for map_id in ["AmbroseValley", "GrandRift", "Lockdown"]:
        print(f"\nProcessing {map_id}...")
        data = build_map_data(df, map_id)
        if data is None:
            continue
        out_path = os.path.join(args.out_dir, f"{map_id}.json")
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        size_mb = os.path.getsize(out_path) / 1e6
        print(f"  Written: {out_path} ({size_mb:.1f} MB)")
        manifest["maps"].append({
            "id": map_id,
            "img": MAP_CONFIG[map_id]["img"],
            "n_matches": len(data["matches"]),
            "n_events": len(data["events"]),
            "stats": data["stats"],
        })

    with open(os.path.join(args.out_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest written. Done.")

if __name__ == "__main__":
    main()
