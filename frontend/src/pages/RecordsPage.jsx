import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/layout/Header';
import E1RMProgressChart from '../features/exercises/E1RMProgressChart';
import TrainingOverview from '../features/exercises/TrainingOverview';

const API_URL = 'http://localhost:8000/api/ExerciseDb';
const PAGE_SIZE = 40;

function RecordsPage({ embedded }) {
  const [exercises, setExercises] = useState([]);
  const [userExercises, setUserExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [activeView, setActiveView] = useState('overview');
  const [range, setRange] = useState('3M');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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
    ? { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)', color: 'var(--color-fg-primary)', fontFamily: "'DM Sans', sans-serif" }
    : { height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)', color: 'var(--color-fg-primary)', fontFamily: "'DM Sans', sans-serif" };

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

  const handleSelectExercise = (id) => {
    setSelectedExerciseId(id);
    setActiveView('detail');
    setLoading(true);
    setLoading(false);
  };

  const dateRange = useMemo(() => {
    if (range === 'CUSTOM') return { startDate: customStart || undefined, endDate: customEnd || undefined };
    if (range === 'ALL') return { startDate: undefined, endDate: undefined };
    const end = new Date();
    const start = new Date(end);
    if (range === 'WEEK') start.setDate(end.getDate() - 6);
    if (range === '1M') start.setMonth(end.getMonth() - 1);
    if (range === '3M') start.setMonth(end.getMonth() - 3);
    if (range === '6M') start.setMonth(end.getMonth() - 6);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  }, [range, customStart, customEnd]);

  return (
    <div style={rootStyle}>
      <style>{`
        .rec-layout { display: flex; flex: 1; overflow: hidden; }
        .rec-sidebar { width: 280px; flexShrink: 0; borderRight: 1px solid var(--color-border-subtle); overflow-y: auto; padding: 12px; }
        .rec-main { flex: 1; overflow-y: auto; padding: 20px; }
        .rec-search { width: 100%; padding: 8px 12px; background: var(--color-bg-base); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-fg-primary); font-family: 'DM Sans', sans-serif; font-size: 13px; outline: none; box-sizing: border-box; margin-bottom: 8px; }
        .rec-search:focus { border-color: var(--color-accent); }
        .rec-ex-item { display: block; width: 100%; padding: 8px 12px; background: none; border: none; color: var(--color-fg-muted); font-family: 'DM Sans', sans-serif; font-size: 13px; text-align: left; cursor: pointer; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .rec-ex-item:hover { color: var(--color-fg-primary); background: var(--color-border-subtle); }
        .rec-ex-item.active { color: var(--color-accent); background: rgba(252,76,2,0.08); }
        .rec-section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-fg-muted); margin-bottom: 6px; margin-top: 12px; }
        .rec-section-title:first-child { margin-top: 0; }
        .rec-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-fg-muted); flex-direction: column; gap: 4px; font-size: 14px; }
        .rec-empty-sub { font-size: 12px; color: var(--color-fg-disabled); }
        .rec-card { background: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .rec-weight { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--color-accent); }
        .rec-meta { font-size: 12px; color: var(--color-fg-muted); }
        .rec-ratio { font-size: 11px; color: var(--color-success); }
        .chart-wrap { background: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: 12px; padding: 20px; margin-bottom: 16px; overflow-x: auto; }
        .rec-pagination { display: flex; gap: 4px; align-items: center; justify-content: center; padding: 8px 0; flex-wrap: wrap; }
        .rec-page-btn { padding: 4px 10px; background: var(--color-border-subtle); border: 1px solid var(--color-border-default); border-radius: 4px; color: var(--color-fg-muted); cursor: pointer; font-size: 11px; font-family: 'DM Sans', sans-serif; }
        .rec-page-btn.active { background: var(--color-accent); color: var(--color-bg-base); border-color: var(--color-accent); }
        .rec-page-btn:hover:not(.active) { background: var(--color-border-default); }
        .rec-freq-item { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--color-border-subtle); border: 1px solid var(--color-border-default); border-radius: 20px; color: var(--color-fg-secondary); font-size: 11px; cursor: pointer; margin: 2px; transition: background 0.15s; }
        .rec-freq-item:hover { background: var(--color-border-default); color: var(--color-fg-primary); }
        .rec-freq-badge { background: var(--color-accent); color: var(--color-bg-base); border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; }
        .analytics-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
        .analytics-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: 16px; }
        .analytics-tab { border: 0; border-bottom: 2px solid transparent; background: none; color: var(--color-fg-muted); padding: 10px 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; }
        .analytics-tab.active { color: var(--color-accent); border-bottom-color: var(--color-accent); }
        .analytics-range, .analytics-date { background: var(--color-bg-card); color: var(--color-fg-primary); border: 1px solid var(--color-border-default); border-radius: 6px; padding: 7px 9px; font-family: 'DM Sans', sans-serif; font-size: 12px; }
        .analytics-overview-grid, .analytics-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .analytics-panel { background: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: 10px; padding: 14px; min-width: 0; }
        .analytics-panel-wide { grid-column: span 2; }
        .analytics-panel h2 { color: var(--color-fg-muted); font-size: 12px; font-weight: 500; margin: 0 0 8px; }
        .analytics-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
        .analytics-kpi { background: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: 8px; padding: 10px; min-width: 0; }
        .analytics-kpi span { display: block; color: var(--color-fg-muted); font-size: 10px; margin-bottom: 5px; }
        .analytics-kpi strong { display: block; color: var(--color-fg-primary); font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .activity-heatmap { display: grid; grid-template-columns: repeat(7, minmax(12px, 1fr)); gap: 4px; min-height: 120px; align-content: center; }
        .activity-cell { aspect-ratio: 1; background: var(--color-accent); border-radius: 3px; min-width: 10px; }
        .activity-legend { display: flex; align-items: center; gap: 4px; color: var(--color-fg-muted); font-size: 10px; margin-top: 10px; }
        .activity-legend i { width: 10px; height: 10px; background: var(--color-accent); border-radius: 2px; display: inline-block; }
        .activity-legend i:nth-of-type(1) { opacity: .25; } .activity-legend i:nth-of-type(2) { opacity: .45; } .activity-legend i:nth-of-type(3) { opacity: .7; }
        @media (max-width: 760px) { .analytics-overview-grid, .analytics-detail-grid { grid-template-columns: 1fr; } .analytics-panel-wide { grid-column: span 1; } .analytics-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>

      {!embedded && <Header />}
      {!embedded && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Analityka <span style={{ color: 'var(--color-accent)' }}>Treningowa</span>
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
          <div className="analytics-tabs">
            <button className={`analytics-tab ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>Przegląd Ogólny Partii</button>
            <button className={`analytics-tab ${activeView === 'detail' ? 'active' : ''}`} onClick={() => selectedExerciseId && setActiveView('detail')}>Analiza Ćwiczenia</button>
          </div>
          <div className="analytics-toolbar">
            <select className="analytics-range" value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="WEEK">Tydzień</option><option value="1M">1M</option><option value="3M">3M</option><option value="6M">6M</option><option value="ALL">ALL</option><option value="CUSTOM">Własny zakres</option>
            </select>
            {range === 'CUSTOM' && <><input className="analytics-date" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /><input className="analytics-date" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></>}
          </div>
          {loading ? (
            <div className="rec-empty">Ładowanie...</div>
          ) : activeView === 'overview' ? (
            <TrainingOverview startDate={dateRange.startDate} endDate={dateRange.endDate} />
          ) : !selectedExerciseId ? (
            <div className="rec-empty">
              <div style={{fontSize: 28, marginBottom: 8}}>🏆</div>
              <div>Wybierz ćwiczenie z listy</div>
              <div className="rec-empty-sub">aby zobaczyć analizę wszystkich sesji</div>
            </div>
          ) : (
            <>
              <E1RMProgressChart exerciseId={selectedExerciseId} startDate={dateRange.startDate} endDate={dateRange.endDate} />

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordsPage;