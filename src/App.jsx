import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import { useMapData, useManifest } from './hooks/useMapData';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import Timeline from './components/Timeline';
import Header from './components/Header';
import Legend from './components/Legend';

const DEFAULT_EVENTS = new Set([
  'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot',
  'Position', 'BotPosition',
]);

export default function App() {
  const { manifest, loading: manifestLoading } = useManifest();

  const [selectedMap, setSelectedMap] = useState('AmbroseValley');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const [visibleEvents, setVisibleEvents] = useState(new Set(DEFAULT_EVENTS));
  const [showHumanPaths, setShowHumanPaths] = useState(true);
  const [showBotPaths, setShowBotPaths] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState(null);

  const [timelineProgress, setTimelineProgress] = useState(0);
  const [playing, setPlaying] = useState(false);

  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 800 });

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const sz = Math.min(width - 2, height - 2);
      setCanvasSize({ w: sz, h: sz });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { data: mapData, loading: mapLoading } = useMapData(selectedMap);
  const minimapFile = mapData?.cfg?.img || null;

  useEffect(() => {
    setSelectedMatchId(null);
    setTimelineProgress(0);
    setPlaying(false);
  }, [selectedMap, selectedDay]);

  useEffect(() => {
    setTimelineProgress(0);
    setPlaying(false);
  }, [selectedMatchId]);

  const toggleEvent = useCallback((key) => {
    setVisibleEvents(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const activeMatch = selectedMatchId && mapData
    ? mapData.matches.find(m => m.id === selectedMatchId)
    : null;

  const isLoading = manifestLoading || mapLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>

      {isLoading && (
        <div className="loading-screen">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'var(--accent-cyan)', textAlign: 'center', marginBottom: 8 }}>
              LILA BLACK // INTEL LAYER
            </div>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: 28, fontWeight: 700, textAlign: 'center', letterSpacing: '0.05em' }}>
              LOADING MAP DATA
            </div>
          </div>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: '60%' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
            PROCESSING {selectedMap?.toUpperCase()}<span className="blink">_</span>
          </div>
        </div>
      )}

      <Header
        manifest={manifest}
        selectedMap={selectedMap}
        mapData={mapData}
        selectedMatchId={selectedMatchId}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          selectedMap={selectedMap} onMapChange={setSelectedMap}
          selectedDay={selectedDay} onDayChange={setSelectedDay}
          selectedMatchId={selectedMatchId} onMatchChange={setSelectedMatchId}
          visibleEvents={visibleEvents} onToggleEvent={toggleEvent}
          showHumanPaths={showHumanPaths} onToggleHuman={setShowHumanPaths}
          showBotPaths={showBotPaths} onToggleBot={setShowBotPaths}
          heatmapMode={heatmapMode} onHeatmapMode={setHeatmapMode}
          mapData={mapData}
          manifest={manifest}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            ref={containerRef}
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-void)',
              overflow: 'hidden',
            }}
          >
            {mapData && (
              <>
                <div style={{ position: 'relative', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}>
                  <MapCanvas
                    mapData={mapData}
                    minimap={minimapFile}
                    visibleEvents={visibleEvents}
                    showHumanPaths={showHumanPaths}
                    showBotPaths={showBotPaths}
                    heatmapMode={heatmapMode}
                    selectedMatchId={selectedMatchId}
                    timelineProgress={timelineProgress}
                    width={canvasSize.w}
                    height={canvasSize.h}
                  />
                  <Legend />
                </div>

                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'rgba(0,212,255,0.4)', letterSpacing: '0.15em',
                  pointerEvents: 'none',
                }}>
                  {selectedMap?.toUpperCase()}
                  {selectedDay && ` // ${selectedDay.replace('_', ' ').toUpperCase()}`}
                </div>

                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'rgba(0,212,255,0.4)', letterSpacing: '0.1em',
                  pointerEvents: 'none', textAlign: 'right',
                }}>
                  {selectedMatchId
                    ? `${activeMatch?.n_events || 0} events`
                    : `${mapData.events?.length?.toLocaleString()} events`
                  }
                </div>
              </>
            )}

            {!mapData && !mapLoading && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-dim)', letterSpacing: '0.1em', textAlign: 'center',
              }}>
                NO DATA LOADED
              </div>
            )}
          </div>

          <Timeline
            matchData={activeMatch}
            progress={timelineProgress}
            onProgress={setTimelineProgress}
            playing={playing}
            onPlayPause={setPlaying}
          />
        </div>

        {activeMatch && <RightPanel match={activeMatch} />}
      </div>
    </div>
  );
}

function RightPanel({ match }) {
  const ec = match.event_counts || {};
  const rows = [
    { label: 'Kill (PvP)', val: ec.Kill || 0, color: 'var(--accent-red)' },
    { label: 'Killed (PvP)', val: ec.Killed || 0, color: 'var(--accent-amber)' },
    { label: 'Bot Kill', val: ec.BotKill || 0, color: '#ff6b35' },
    { label: 'Bot Killed', val: ec.BotKilled || 0, color: '#ffaa44' },
    { label: 'Storm Death', val: ec.KilledByStorm || 0, color: 'var(--accent-purple)' },
    { label: 'Loot', val: ec.Loot || 0, color: 'var(--accent-green)' },
    { label: 'Positions', val: (ec.Position || 0) + (ec.BotPosition || 0), color: 'var(--text-dim)' },
  ];
  const durationSec = Math.round(match.duration_ms / 1000);

  return (
    <aside style={{
      width: 250, minWidth: 250,
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      padding: '16px 14px',
      display: 'flex', flexDirection: 'column', gap: 16,
      overflowY: 'auto',
    }}>
      <div>
        <div className="panel-label">// match detail</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: 1.4 }}>
          {match.id}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['DAY', match.day?.replace('February_', 'Feb '), 'var(--text-primary)'],
          ['DURATION', `${durationSec}s`, 'var(--accent-cyan)'],
          ['HUMANS', match.n_humans, 'var(--accent-cyan)'],
          ['BOTS', match.n_bots, 'var(--accent-amber)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      <div>
        <div className="panel-label">// event breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {rows.map(({ label, val, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color }}>{val}</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: color,
                  width: `${Math.min(100, (val / (match.n_events || 1)) * 500)}%`,
                  opacity: 0.6, transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
