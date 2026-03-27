export default function Header({ manifest, selectedMap, mapData, selectedMatchId }) {
  const now = new Date().toISOString().slice(0,10);

  const activeMatch = selectedMatchId && mapData
    ? mapData.matches.find(m => m.id === selectedMatchId)
    : null;

  return (
    <header style={{
      height: 48,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 16,
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--accent-cyan)',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          display: 'flex', alignItems:'center', justifyContent:'center',
        }} />
        <div>
          <div style={{ fontFamily:'var(--font-cond)', fontSize:16, fontWeight:700, letterSpacing:'0.1em', lineHeight:1 }}>
            LILA BLACK
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--accent-cyan)', letterSpacing:'0.15em' }}>
            INTEL LAYER
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width:1, height:28, background:'var(--border)' }} />

      {/* Global stats */}
      {manifest && (
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <StatItem label="TOTAL EVENTS" val={manifest.total_events?.toLocaleString()} />
          <StatItem label="MATCHES" val={manifest.total_matches?.toLocaleString()} />
          <StatItem label="DATE RANGE" val="FEB 10–14" />
        </div>
      )}

      {/* Active match badge */}
      {activeMatch && (
        <>
          <div style={{ width:1, height:28, background:'var(--border)' }} />
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', letterSpacing:'0.1em' }}>ACTIVE MATCH</span>
            <span className="tag tag-cyan">{activeMatch.id.slice(0,8)}…</span>
            <span className="tag tag-green">{activeMatch.n_humans} human{activeMatch.n_humans!==1?'s':''}</span>
            <span className="tag tag-amber">{activeMatch.n_bots} bot{activeMatch.n_bots!==1?'s':''}</span>
            <span className="tag tag-purple">{activeMatch.n_events} events</span>
          </div>
        </>
      )}

      {/* Right side - status */}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{
          width:6, height:6, borderRadius:'50%',
          background:'var(--accent-green)',
          boxShadow:'0 0 6px var(--accent-green)',
        }} />
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-dim)', letterSpacing:'0.1em' }}>
          LIVE DATASET
        </span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-secondary)' }}>
          {selectedMap?.toUpperCase()}
        </span>
      </div>
    </header>
  );
}

function StatItem({ label, val }) {
  return (
    <div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</div>
      <div style={{ fontFamily:'var(--font-cond)', fontSize:15, fontWeight:700, lineHeight:1.2 }}>{val}</div>
    </div>
  );
}
