import { useEffect, useRef, useCallback } from 'react';

// ── Event visual config ───────────────────────────────────────────────────────
const EVENT_STYLE = {
  Position:     { color: '#00d4ff', radius: 2, alpha: 0.4 },
  BotPosition:  { color: '#2a6080', radius: 1.5, alpha: 0.3 },
  Kill:         { color: '#ff3b3b', radius: 6, alpha: 1.0, shape: 'star' },
  Killed:       { color: '#ff8c00', radius: 6, alpha: 1.0, shape: 'x' },
  BotKill:      { color: '#ff6b35', radius: 4, alpha: 0.85, shape: 'diamond' },
  BotKilled:    { color: '#ffaa44', radius: 4, alpha: 0.85, shape: 'diamond' },
  KilledByStorm:{ color: '#a855f7', radius: 6, alpha: 1.0, shape: 'triangle' },
  Loot:         { color: '#00ff94', radius: 3, alpha: 0.7, shape: 'square' },
};

const HEATMAP_COLORS = {
  movement: [[0,212,255], [0,100,200]],
  combat:   [[255,59,59], [200,20,20]],
  loot:     [[0,255,148], [0,180,100]],
  storm:    [[168,85,247], [100,40,180]],
};

// ── Draw shapes ───────────────────────────────────────────────────────────────
function drawShape(ctx, shape, x, y, r) {
  ctx.beginPath();
  switch (shape) {
    case 'x':
      ctx.moveTo(x-r, y-r); ctx.lineTo(x+r, y+r);
      ctx.moveTo(x+r, y-r); ctx.lineTo(x-r, y+r);
      ctx.stroke(); return;
    case 'star': {
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI/2;
        const ai = a + (2*Math.PI)/5;
        i === 0 ? ctx.moveTo(x+r*Math.cos(a),y+r*Math.sin(a))
                : ctx.lineTo(x+r*Math.cos(a),y+r*Math.sin(a));
        ctx.lineTo(x+r*0.4*Math.cos(ai),y+r*0.4*Math.sin(ai));
      }
      ctx.closePath(); ctx.fill(); return;
    }
    case 'diamond':
      ctx.moveTo(x,y-r); ctx.lineTo(x+r,y); ctx.lineTo(x,y+r); ctx.lineTo(x-r,y);
      ctx.closePath(); ctx.fill(); return;
    case 'triangle':
      ctx.moveTo(x,y-r); ctx.lineTo(x+r*0.866,y+r*0.5); ctx.lineTo(x-r*0.866,y+r*0.5);
      ctx.closePath(); ctx.fill(); return;
    case 'square':
      ctx.rect(x-r,y-r,r*2,r*2); ctx.fill(); return;
    default:
      ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); return;
  }
}

// ── Heatmap renderer ──────────────────────────────────────────────────────────
function renderHeatmap(ctx, cells, category, canvasSize, gridSize=64) {
  if (!cells || cells.length === 0) return;
  const [c1, c2] = HEATMAP_COLORS[category] || [[255,255,255],[200,200,200]];
  const cellPx = canvasSize / gridSize;

  cells.forEach(({ gx, gy, v }) => {
    if (v < 0.02) return;
    const alpha = Math.pow(v, 0.5) * 0.75;
    const r = Math.round(c1[0] * v + c2[0] * (1-v));
    const g = Math.round(c1[1] * v + c2[1] * (1-v));
    const b = Math.round(c1[2] * v + c2[2] * (1-v));
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fillRect(gx * cellPx, gy * cellPx, cellPx, cellPx);
  });
}

// ── Main canvas component ─────────────────────────────────────────────────────
export default function MapCanvas({
  mapData,
  minimap,
  visibleEvents,      // Set of event type strings
  showHumanPaths,
  showBotPaths,
  heatmapMode,        // null | 'movement' | 'combat' | 'loot' | 'storm'
  selectedMatchId,
  timelineProgress,   // 0–1, filters events by ts
  width,
  height,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // Load minimap image once
  useEffect(() => {
    if (!minimap) return;
    const img = new Image();
    img.src = `/minimaps/${minimap}`;
    img.onload = () => { imgRef.current = img; drawAll(); };
  }, [minimap]);

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#080a0e';
    ctx.fillRect(0, 0, W, H);

    // Draw minimap image
    if (imgRef.current) {
      ctx.globalAlpha = 0.75;
      ctx.drawImage(imgRef.current, 0, 0, W, H);
      ctx.globalAlpha = 1.0;
    }

    // Filter events
    let events = mapData.events;

    // Filter by match
    if (selectedMatchId) {
      events = events.filter(e => e.mid === selectedMatchId);
    }

    // Filter by timeline
    if (timelineProgress < 1 && selectedMatchId) {
      const matchEvents = events;
      if (matchEvents.length > 0) {
        const tsVals = matchEvents.map(e => e.ts);
        const tsMin = Math.min(...tsVals);
        const tsMax = Math.max(...tsVals);
        const tsCut = tsMin + (tsMax - tsMin) * timelineProgress;
        events = events.filter(e => e.ts <= tsCut);
      }
    }

    // Heatmap mode
    if (heatmapMode && mapData.heatmaps && mapData.heatmaps[heatmapMode]) {
      // Dark overlay
      ctx.fillStyle = 'rgba(8,10,14,0.5)';
      ctx.fillRect(0, 0, W, H);
      renderHeatmap(ctx, mapData.heatmaps[heatmapMode], heatmapMode, W);
    } else {
      // Draw paths (Position events as trails)
      if (showHumanPaths || showBotPaths) {
        drawPaths(ctx, events, showHumanPaths, showBotPaths);
      }

      // Draw discrete events
      drawEvents(ctx, events, visibleEvents);
    }

    // Grid overlay (subtle)
    ctx.strokeStyle = 'rgba(30,45,61,0.3)';
    ctx.lineWidth = 0.5;
    const gridStep = W / 8;
    for (let x = gridStep; x < W; x += gridStep) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = gridStep; y < H; y += gridStep) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);

  }, [mapData, visibleEvents, showHumanPaths, showBotPaths, heatmapMode, selectedMatchId, timelineProgress, width, height]);

  function drawPaths(ctx, events, showHuman, showBot) {
    // Group position events by user+match
    const tracks = {};
    events.forEach(e => {
      if (e.ev !== 'Position' && e.ev !== 'BotPosition') return;
      if (e.ev === 'Position' && !showHuman) return;
      if (e.ev === 'BotPosition' && !showBot) return;
      const key = `${e.uid}-${e.mid}`;
      if (!tracks[key]) tracks[key] = { pts: [], isHuman: e.h === 1 };
      tracks[key].pts.push([e.cx, e.cy]);
    });

    Object.values(tracks).forEach(({ pts, isHuman }) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * (width/1024), pts[0][1] * (height/1024));
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0] * (width/1024), pts[i][1] * (height/1024));
      }
      ctx.strokeStyle = isHuman
        ? 'rgba(0,212,255,0.35)'
        : 'rgba(42,96,128,0.25)';
      ctx.lineWidth = isHuman ? 1.5 : 1;
      ctx.stroke();
    });
  }

  function drawEvents(ctx, events, visibleSet) {
    const scale = width / 1024;
    events.forEach(e => {
      if (!visibleSet.has(e.ev)) return;
      if (e.ev === 'Position' || e.ev === 'BotPosition') return; // drawn as paths
      const style = EVENT_STYLE[e.ev];
      if (!style) return;
      const x = e.cx * scale;
      const y = e.cy * scale;
      ctx.globalAlpha = style.alpha;
      ctx.fillStyle = style.color;
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 2;
      drawShape(ctx, style.shape, x, y, style.radius);
      ctx.globalAlpha = 1.0;
    });
  }

  useEffect(() => { drawAll(); }, [drawAll]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}
