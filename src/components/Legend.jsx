const LEGEND_ITEMS = [
  { shape:'circle',   color:'#00d4ff', label:'Human path' },
  { shape:'circle',   color:'#2a6080', label:'Bot path' },
  { shape:'star',     color:'#ff3b3b', label:'Kill (PvP)' },
  { shape:'x',        color:'#ff8c00', label:'Killed (PvP)' },
  { shape:'diamond',  color:'#ff6b35', label:'Bot kill' },
  { shape:'diamond',  color:'#ffaa44', label:'Bot killed' },
  { shape:'triangle', color:'#a855f7', label:'Storm death' },
  { shape:'square',   color:'#00ff94', label:'Loot' },
];

function ShapeIcon({ shape, color }) {
  if (shape === 'circle') return (
    <svg width={12} height={12}>
      <circle cx={6} cy={6} r={4} fill={color} opacity={0.8}/>
    </svg>
  );
  if (shape === 'star') return (
    <svg width={12} height={12} viewBox="0 0 12 12">
      <polygon points="6,1 7.5,5 11,5 8.5,7.5 9.5,11 6,9 2.5,11 3.5,7.5 1,5 4.5,5" fill={color}/>
    </svg>
  );
  if (shape === 'x') return (
    <svg width={12} height={12}><line x1={2} y1={2} x2={10} y2={10} stroke={color} strokeWidth={2}/><line x1={10} y1={2} x2={2} y2={10} stroke={color} strokeWidth={2}/></svg>
  );
  if (shape === 'diamond') return (
    <svg width={12} height={12}><polygon points="6,1 11,6 6,11 1,6" fill={color}/></svg>
  );
  if (shape === 'triangle') return (
    <svg width={12} height={12}><polygon points="6,1 11,10 1,10" fill={color}/></svg>
  );
  if (shape === 'square') return (
    <svg width={12} height={12}><rect x={2} y={2} width={8} height={8} fill={color}/></svg>
  );
  return null;
}

export default function Legend() {
  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      right: 12,
      background: 'rgba(8,10,14,0.88)',
      border: '1px solid var(--border)',
      borderRadius: 2,
      padding: '10px 12px',
      backdropFilter: 'blur(4px)',
      zIndex: 10,
    }}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)', letterSpacing:'0.15em', marginBottom:8 }}>
        LEGEND
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {LEGEND_ITEMS.map(({ shape, color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ShapeIcon shape={shape} color={color} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
