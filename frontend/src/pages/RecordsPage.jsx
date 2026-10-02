import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import { getRecordsByExercise } from '../api/exerciseAPI';

const API_URL = 'http://localhost:8000/api/ExerciseDb';
const PAGE_SIZE = 40;

function RecordsPage({ embedded }) {
  const [exercises, setExercises] = useState([]);
  const [userExercises, setUserExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [exRes, ueRes] = await Promise.all([
          fetch(`${API_URL}/exercise`, { credentials: 'include' }),
          fetch(`${API_URL}/userexercise/byuser`, { credentials: 'include' })
        ]);
        if (exRes.ok) setExercises(await exRes.json());
        if (ueRes.ok) setUserExercises(await ueRes.json());
      } catch { }
    })();
  }, []);

  const rootStyle = embedded
    ? { height: '100%', display: 'flex', flexDirection: 'column', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }
    : { height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" };

  const freqMap = useMemo(() => {
    const map = {};
    if (Array.isArray(userExercises)) {
      for (const ue of userExercises) {
        map[ue.exerciseId] = (map[ue.exerciseId] || 0) + 1;
      }
    }
    return map;
  }, [userExercises]);

  const mostFrequent = useMemo(() => {
    return [...exercises]
      .map(ex => ({ ...ex, freq: freqMap[ex.id] || 0 }))
      .filter(ex => ex.freq > 0)
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 20);
  }, [exercises, freqMap]);

  const filtered = useMemo(() => {
    return exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));
  }, [exercises, search]);

  const paged = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSelectExercise = async (id) => {
    setSelectedExerciseId(id);
    setLoading(true);
    try {
      const data = await getRecordsByExercise(id);
      setRecords(data);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  };

  const chartSections = records.length > 0 ? (() => {
    const minW = Math.min(...records.map(r => r.weight));
    const maxW = Math.max(...records.map(r => r.weight));
    const range = maxW - minW || 1;
    const height = 180;
    const width = Math.max(300, records.length * 60);
    const points = records.map((r, i) => {
      const x = i * (width / Math.max(records.length - 1, 1));
      const y = height - ((r.weight - minW) / range) * (height - 20) - 10;
      return { x, y, ...r };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return { points, linePath, height, width, minW, maxW };
  })() : null;

  return (
    <div style={rootStyle}>
      <style>{`
        .rec-layout { display: flex; flex: 1; overflow: hidden; }
        .rec-sidebar { width: 280px; flexShrink: 0; borderRight: 1px solid #1e1e22; overflow-y: auto; padding: 12px; }
        .rec-main { flex: 1; overflow-y: auto; padding: 20px; }
        .rec-search { width: 100%; padding: 8px 12px; background: #0d0d0f; border: 1px solid #2a2a30; border-radius: 8px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; box-sizing: border-box; margin-bottom: 8px; }
        .rec-search:focus { border-color: #c8f542; }
        .rec-ex-item { display: block; width: 100%; padding: 8px 12px; background: none; border: none; color: #888; font-family: 'DM Sans', sans-serif; font-size: 13px; text-align: left; cursor: pointer; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .rec-ex-item:hover { color: #f0ede8; background: #1e1e22; }
        .rec-ex-item.active { color: #c8f542; background: rgba(200,245,66,0.08); }
        .rec-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 6px; margin-top: 12px; }
        .rec-section-title:first-child { margin-top: 0; }
        .rec-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: #444; flex-direction: column; gap: 4px; font-size: 14px; }
        .rec-empty-sub { font-size: 12px; color: #333; }
        .rec-card { background: #16161a; border: 1px solid #1e1e22; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .rec-weight { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #c8f542; }
        .rec-meta { font-size: 12px; color: #666; }
        .rec-ratio { font-size: 11px; color: #4caf50; }
        .chart-wrap { background: #16161a; border: 1px solid #1e1e22; border-radius: 12px; padding: 20px; margin-bottom: 16px; overflow-x: auto; }
        .rec-pagination { display: flex; gap: 4px; align-items: center; justify-content: center; padding: 8px 0; flex-wrap: wrap; }
        .rec-page-btn { padding: 4px 10px; background: #1e1e22; border: 1px solid #2a2a30; border-radius: 4px; color: #888; cursor: pointer; font-size: 11px; font-family: 'DM Sans', sans-serif; }
        .rec-page-btn.active { background: #c8f542; color: #0d0d0f; border-color: #c8f542; }
        .rec-page-btn:hover:not(.active) { background: #2a2a30; }
        .rec-freq-item { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #1e1e22; border: 1px solid #2a2a30; border-radius: 20px; color: #aaa; font-size: 11px; cursor: pointer; margin: 2px; transition: background 0.15s; }
        .rec-freq-item:hover { background: #2a2a30; color: #f0ede8; }
        .rec-freq-badge { background: #c8f542; color: #0d0d0f; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
      `}</style>

      {!embedded && <Header />}
      {!embedded && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e22', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Centrum <span style={{ color: '#c8f542' }}>Rekordów</span>
        </div>
      )}
      <div className="rec-layout">
        <div className="rec-sidebar">
          <input className="rec-search" placeholder="Szukaj ćwiczenia..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />

          {mostFrequent.length > 0 && search.length === 0 && (
            <>
              <div className="rec-section-title">Najczęściej wykonywane</div>
              <div style={{ marginBottom: 8 }}>
                {mostFrequent.slice(0, 8).map(ex => (
                  <span key={ex.id} className="rec-freq-item" onClick={() => handleSelectExercise(ex.id)}>
                    {ex.name} <span className="rec-freq-badge">{ex.freq}</span>
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="rec-section-title">Wszystkie ćwiczenia ({filtered.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {paged.map(ex => (
              <button key={ex.id} className={`rec-ex-item ${selectedExerciseId === ex.id ? 'active' : ''}`} onClick={() => handleSelectExercise(ex.id)}>
                {ex.name}
              </button>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="rec-pagination">
              <button className="rec-page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} style={{ opacity: page === 0 ? 0.3 : 1 }}>◀</button>
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => {
                const startPage = Math.max(0, Math.min(page - 3, totalPages - 8));
                const p = startPage + i;
                if (p >= totalPages) return null;
                return (
                  <button key={p} className={`rec-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p + 1}
                  </button>
                );
              })}
              <button className="rec-page-btn" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} style={{ opacity: page >= totalPages - 1 ? 0.3 : 1 }}>▶</button>
            </div>
          )}
        </div>
        <div className="rec-main">
          {loading ? (
            <div className="rec-empty">Ładowanie...</div>
          ) : !selectedExerciseId ? (
            <div className="rec-empty">
              <div style={{fontSize: 28, marginBottom: 8}}>🏆</div>
              <div>Wybierz ćwiczenie z listy</div>
              <div className="rec-empty-sub">aby zobaczyć historię rekordów życiowych</div>
            </div>
          ) : records.length === 0 ? (
            <div className="rec-empty">
              <div>Brak rekordów dla tego ćwiczenia</div>
              <div className="rec-empty-sub">Dodaj treningi, aby śledzić progres</div>
            </div>
          ) : (
            <>
              {chartSections && (
                <div className="chart-wrap">
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' }}>Progresja siły w czasie</div>
                  <svg viewBox={`0 0 ${chartSections.width} ${chartSections.height + 30}`} style={{ width: '100%', height: 'auto', maxHeight: 220 }}>
                    <line x1="0" y1={chartSections.height} x2={chartSections.width} y2={chartSections.height} stroke="#2a2a30" strokeWidth="1" />
                    {chartSections.points.map((p, i) => (
                      <g key={i}>
                        {i > 0 && (
                          <line x1={chartSections.points[i-1].x} y1={chartSections.points[i-1].y} x2={p.x} y2={p.y} stroke="#c8f542" strokeWidth="2" />
                        )}
                        <circle cx={p.x} cy={p.y} r="4" fill="#c8f542" />
                        <text x={p.x} y={chartSections.height + 15} textAnchor="middle" fill="#555" fontSize="9">{new Date(p.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</text>
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#f0ede8" fontSize="10" fontWeight="600">{p.weight}kg</text>
                      </g>
                    ))}
                  </svg>
                </div>
              )}
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#444', marginBottom: 8 }}>Historia rekordów</div>
              {records.map((r, i) => (
                <div key={i} className="rec-card">
                  <div>
                    <div className="rec-weight">{r.weight} kg</div>
                    <div className="rec-meta">{r.reps} powt. • {new Date(r.date).toLocaleDateString('pl-PL')}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    {r.strengthToWeightRatio != null && (
                      <div className="rec-ratio">Stosunek: {r.strengthToWeightRatio.toFixed(2)}</div>
                    )}
                    {r.userWeightAtTime != null && (
                      <div className="rec-meta">Waga: {r.userWeightAtTime}kg</div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordsPage;