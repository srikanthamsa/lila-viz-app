import { useState, useEffect, useRef } from 'react';

export default function Timeline({ matchData, progress, onProgress, playing, onPlayPause }) {
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const speedRef = useRef(1);

  useEffect(() => {
    if (playing) {
      lastTimeRef.current = performance.now();
      const tick = (now) => {
        const dt = (now - lastTimeRef.current) / 1000; // seconds
        lastTimeRef.current = now;
        onProgress(p => {
          const next = p + dt * speedRef.current * 0.05; // 0.05 = speed factor
          if (next >= 1) { onPlayPause(false); return 1; }
          return next;
        });
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const durationMs = matchData ? matchData.duration_ms : 0;
  const currentMs = durationMs * progress;

  function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2,'0')}`;
  }

  if (!matchData) {
    return (
      <div style={{
        height: 52,
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
      }}>
        SELECT A MATCH TO ENABLE PLAYBACK
      </div>
    );
  }

  return (
    <div style={{
      height: 52,
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
    }}>
      {/* Play/Pause */}
      <button
        className="btn active"
        style={{ width: 36, justifyContent:'center', flexShrink:0 }}
        onClick={() => {
          if (progress >= 1) onProgress(0);
          onPlayPause(!playing);
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Reset */}
      <button
        className="btn"
        style={{ width: 36, justifyContent:'center', flexShrink:0 }}
        onClick={() => { onPlayPause(false); onProgress(0); }}
      >⏮</button>

      {/* Time display */}
      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--accent-cyan)', flexShrink:0, minWidth:50 }}>
        {formatMs(currentMs)}
      </div>

      {/* Slider */}
      <div style={{ flex:1, position:'relative' }}>
        <input
          type="range"
          min={0} max={1000}
          value={Math.round(progress * 1000)}
          onChange={e => { onPlayPause(false); onProgress(e.target.value / 1000); }}
          style={{ width:'100%', '--pct': `${progress*100}%` }}
        />
      </div>

      {/* Total duration */}
      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-dim)', flexShrink:0 }}>
        {formatMs(durationMs)}
      </div>

      {/* Speed */}
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        {[0.5, 1, 2, 4].map(s => (
          <button
            key={s}
            className={`btn ${speedRef.current===s?'active':''}`}
            style={{ padding:'4px 8px', fontSize:10 }}
            onClick={() => { speedRef.current = s; }}
          >{s}x</button>
        ))}
      </div>

      {/* Match info */}
      <div style={{ flexShrink:0, textAlign:'right' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', letterSpacing:'0.1em' }}>MATCH</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-secondary)' }}>
          {matchData.n_humans}H / {matchData.n_bots}B
        </div>
      </div>
    </div>
  );
}
