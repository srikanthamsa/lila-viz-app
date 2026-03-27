import { useMemo } from 'react';

const MAPS = [
  { id: 'AmbroseValley', label: 'Ambrose Valley' },
  { id: 'GrandRift', label: 'Grand Rift' },
  { id: 'Lockdown', label: 'Lockdown' },
];

const DAYS = ['February_10', 'February_11', 'February_12', 'February_13', 'February_14'];
const DAY_LABELS = { February_10: 'Feb 10', February_11: 'Feb 11', February_12: 'Feb 12', February_13: 'Feb 13', February_14: 'Feb 14' };

const EVENT_GROUPS = [
  { key: 'Kill', label: 'KILL (PvP)', cls: 'btn-red' },
  { key: 'Killed', label: 'KILLED (PvP)', cls: 'btn-amber' },
  { key: 'BotKill', label: 'BOT KILL', cls: 'btn-amber' },
  { key: 'BotKilled', label: 'BOT KILLED', cls: 'btn-red' },
  { key: 'KilledByStorm', label: 'STORM DEATH', cls: 'btn-purple' },
  { key: 'Loot', label: 'LOOT', cls: 'btn-green' },
];

const HEATMAPS = [
  { key: 'movement', label: 'TRAFFIC', cls: 'btn-cyan' },
  { key: 'combat', label: 'COMBAT', cls: 'btn-red' },
  { key: 'loot', label: 'LOOT', cls: 'btn-green' },
  { key: 'storm', label: 'STORM', cls: 'btn-purple' },
];

export default function Sidebar({
  selectedMap, onMapChange,
  selectedDay, onDayChange,
  selectedMatchId, onMatchChange,
  visibleEvents, onToggleEvent,
  showHumanPaths, onToggleHuman,
  showBotPaths, onToggleBot,
  heatmapMode, onHeatmapMode,
  mapData,
  manifest,
}) {
  const filteredMatches = useMemo(() => {
    if (!mapData) return [];
    let matches = mapData.matches;
    if (selectedDay) matches = matches.filter(m => m.day === selectedDay);
    return matches.sort((a, b) => b.n_events - a.n_events);
  }, [mapData, selectedDay]);

  const mapStats = manifest?.maps?.find(m => m.id === selectedMap);

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 14px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,212,255,0.03)',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'var(--accent-cyan)', marginBottom: 4 }}>
          LILA BLACK // INTEL
        </div>
        <div style={{ fontFamily: 'var(--font-cond)', fontSize: 20, fontWeight: 700, letterSpacing: '0.05em' }}>
          MAP RECON
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Map selector */}
        <section>
          <div className="panel-label">// map</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {MAPS.map(m => (
              <button
                key={m.id}
                className={`btn ${selectedMap === m.id ? 'active' : ''}`}
                style={{ justifyContent: 'space-between', width: '100%' }}
                onClick={() => onMapChange(m.id)}
              >
                <span>{m.label}</span>
                {manifest && <span style={{ fontSize: 9, opacity: 0.6 }}>
                  {manifest.maps?.find(x => x.id === m.id)?.n_matches || 0}
                </span>}
              </button>
            ))}
          </div>
        </section>

        {/* Day filter */}
        <section>
          <div className="panel-label">// date</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              className={`btn ${!selectedDay ? 'active' : ''}`}
              style={{ width: '100%', justifyContent: 'space-between' }}
              onClick={() => onDayChange(null)}
            >All Days</button>
            {DAYS.map(d => (
              <button
                key={d}
                className={`btn ${selectedDay === d ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={() => onDayChange(selectedDay === d ? null : d)}
              >{DAY_LABELS[d]}</button>
            ))}
          </div>
        </section>

        {/* Match selector */}
        <section>
          <div className="panel-label">// match ({filteredMatches.length})</div>
          <select
            value={selectedMatchId || ''}
            onChange={e => onMatchChange(e.target.value || null)}
          >
            <option value=''>All matches</option>
            {filteredMatches.map((m, idx) => (
              <option key={m.id} value={m.id}>
                Match {idx + 1} ({m.n_events} events)
              </option>
            ))}
          </select>
        </section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Path toggles */}
        <section>
          <div className="panel-label">// paths</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn ${showHumanPaths ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onToggleHuman(!showHumanPaths)}
            >HUMAN</button>
            <button
              className={`btn btn-amber ${showBotPaths ? 'btn-amber active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => onToggleBot(!showBotPaths)}
            >BOT</button>
          </div>
        </section>

        {/* Event type toggles */}
        <section>
          <div className="panel-label">// events</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {EVENT_GROUPS.map(({ key, label, cls }) => (
              <button
                key={key}
                className={`btn ${cls} ${visibleEvents.has(key) ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => onToggleEvent(key)}
              >
                <Dot event={key} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Heatmap modes */}
        <section>
          <div className="panel-label">// heatmap overlay</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              className={`btn ${!heatmapMode ? 'active' : ''}`}
              style={{ width: '100%' }}
              onClick={() => onHeatmapMode(null)}
            >OFF</button>
            {HEATMAPS.map(({ key, label, cls }) => (
              <button
                key={key}
                className={`btn ${cls} ${heatmapMode === key ? 'active' : ''}`}
                style={{ width: '100%' }}
                onClick={() => onHeatmapMode(heatmapMode === key ? null : key)}
              >{label}</button>
            ))}
          </div>
        </section>

        {/* Map stats */}
        {mapStats && (
          <>
            <div style={{ borderTop: '1px solid var(--border)' }} />
            <section>
              <div className="panel-label">// map stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <StatBox val={mapStats.n_matches} label="matches" />
                <StatBox val={mapStats.n_events} label="events" />
                <StatBox val={mapStats.stats?.event_breakdown?.Kill || 0} label="pvp kills" color="var(--accent-red)" />
                <StatBox val={mapStats.stats?.event_breakdown?.Loot || 0} label="loots" color="var(--accent-green)" />
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}

function StatBox({ val, label, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 2, padding: '8px 10px' }}>
      <div className="stat-val" style={{ color: color || 'var(--text-primary)', fontSize: 18 }}>
        {typeof val === 'number' ? val.toLocaleString() : val}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const EVENT_COLORS = {
  Kill: '#ff3b3b', Killed: '#ff8c00', BotKill: '#ff6b35',
  BotKilled: '#ffaa44', KilledByStorm: '#a855f7', Loot: '#00ff94',
};
function Dot({ event }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: EVENT_COLORS[event] || '#fff',
      display: 'inline-block', flexShrink: 0,
    }} />
  );
}
