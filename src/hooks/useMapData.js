import { useState, useEffect, useRef } from 'react';

const cache = {};

export function useMapData(mapId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mapId) return;
    if (cache[mapId]) { setData(cache[mapId]); return; }

    setLoading(true);
    setData(null);
    setError(null);

    fetch(`/data/${mapId}.json`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { cache[mapId] = d; setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [mapId]);

  return { data, loading, error };
}

export function useManifest() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(r => r.json())
      .then(d => { setManifest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { manifest, loading };
}
