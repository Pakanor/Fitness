import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const API = 'http://localhost:8000/api/fatigue-analysis';

const CATEGORY_ORDER = { 'Małe': 0, 'Średnie': 1, 'Duże': 2 };
const ACCENT = '#c8f542';

function formatLoad(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'k';
  return Math.round(v).toString();
}

function statusColor(ratio) {
  if (ratio < 0.8) return '#60a5fa';
  if (ratio <= 1.3) return '#c8f542';
  if (ratio <= 1.5) return '#f59e0b';
  return '#ef4444';
}

// Continuous recovery model, recomputed locally every second from the stored
// session timestamp + decay constant, so the UI ticks in real time.
// Recovery(t) = 100 - Damage% * e^(-lambda*t); remaining = time to 98%.
function liveRecovery(m, nowMs) {
  if (!m || m.damagePercent <= 0 || !m.sessionTimestamp) {
    return { ...m, recoveryPercent: 100, remainingHours: 0 };
  }
  const t = (nowMs - new Date(m.sessionTimestamp).getTime()) / 3600000;
  if (t >= m.tMaxHours) return { ...m, recoveryPercent: 100, remainingHours: 0 };
  const recovery = 100 - m.damagePercent * Math.exp(-m.lambda * t);
  const remaining = Math.max(0, Math.log(2 / m.damagePercent) / -m.lambda - t);
  return { ...m, recoveryPercent: recovery, remainingHours: remaining };
}

function Gauge({ value }) {
  const max = 2;
  const v = Math.max(0, Math.min(max, value));
  const pct = v / max;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = statusColor(value);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1e1e22" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="800" fill={color} fontFamily="'Syne', sans-serif">
        {value.toFixed(2)}
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="9" fill="#888">ACWR</text>
    </svg>
  );
}

function AcwrView({ data }) {
  if (!data) return null;

  // Cold-Start Guard: until the user has a 14-day training baseline, the OUN
  // overload widget is suppressed and replaced by a neutral collection message.
  if (data.coldStart) {
    const remaining = data.baselineCollectionDaysRemaining ?? 0;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: '#1a1d24', border: '1px solid #2a2a30', borderRadius: 12,
          padding: 20, textAlign: 'center',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#c8f542', marginBottom: 8 }}>
            Zbieranie danych bazowych
          </div>
          <div style={{ fontSize: 13, color: '#a8a8a8', lineHeight: 1.5 }}>
            Ukończ jeszcze {remaining} {remaining === 1 ? 'dzień' : 'dni'} treningowych, aby aktywować analizę zmęczenia OUN.
          </div>
        </div>
        <AcwrChart data={data} />
      </div>
    );
  }

  if (data.insufficientData) {
    return (
      <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 24 }}>
        Zaloguj co najmniej 7 dni treningowych, aby zobaczyć wskaźnik ACWR.
      </div>
    );
  }

  const color = statusColor(data.ratio);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Gauge value={data.ratio} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color, marginBottom: 6 }}>
            {data.status}
          </div>
          {data.alert && (
            <div style={{ fontSize: 12, color: data.ratio > 1.5 ? '#f87171' : '#fbbf24', marginBottom: 10 }}>
              ⚠️ {data.alert}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#666' }}>Obciążenie ostre (7 dni)</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#f0ede8' }}>
                {formatLoad(data.acuteLoad)} <span style={{ fontSize: 11, color: '#555' }}>AU</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666' }}>Obciążenie przewlekłe (28 dni)</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#f0ede8' }}>
                {formatLoad(data.chronicLoad)} <span style={{ fontSize: 11, color: '#555' }}>AU</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AcwrChart data={data} color={color} />
    </div>
  );
}

function AcwrChart({ data, color }) {
  const chartData = (data.dailyWorkload || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
    load: Math.round(d.workload),
  }));

  const stroke = color || statusColor(data.ratio || 1);

  if (chartData.length === 0) return null;

  return (
    <div style={{ height: 170 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e1e22', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#888' }}
            formatter={(v) => [`${formatLoad(v)} AU`, 'Obciążenie']}
          />
          {typeof data.chronicLoad === 'number' && (
            <ReferenceLine y={Math.round(data.chronicLoad)} stroke="#555" strokeDasharray="4 4" />
          )}
          <Bar dataKey="load" fill={stroke} radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MuscleRecoveryView({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 24 }}>
        Brak danych z ostatniego ukończonego treningu.
      </div>
    );
  }

  const grouped = {};
  for (const m of data) {
    (grouped[m.category] ||= []).push(m);
  }
  const categories = Object.keys(grouped).sort((a, b) => (CATEGORY_ORDER[a] ?? 9) - (CATEGORY_ORDER[b] ?? 9));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {categories.map(cat => (
        <div key={cat}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
            {cat === 'Małe' ? 'Małe partie (48h)' : cat === 'Średnie' ? 'Średnie partie (72h)' : 'Duże partie (96h)'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {grouped[cat]
              .slice()
              .sort((a, b) => b.recoveryPercent - a.recoveryPercent)
              .map(m => (
                <div key={m.muscleGroupKey}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#f0ede8' }}>{m.namePl}</span>
                    <span style={{ color: '#888' }}>
                      {Math.round(m.recoveryPercent)}% · pozostało {Math.round(m.remainingHours)}h
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#1e1e22', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(0, Math.min(100, m.recoveryPercent))}%`,
                        background: m.recoveryPercent >= 98 ? ACCENT
                          : m.recoveryPercent >= 60 ? '#22c55e'
                          : m.recoveryPercent >= 30 ? '#f59e0b' : '#ef4444',
                        borderRadius: 4, transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FatigueAnalysis() {
  const [tab, setTab] = useState('acwr');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(API, { credentials: 'include' });
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error('Fatigue analysis load error:', e);
      }
      setLoading(false);
    })();
  }, []);

  // Tick every second to keep peripheral recovery live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <div style={{ padding: 20, color: '#444', fontSize: 13 }}>Ładowanie analizy zmęczenia...</div>;

  const muscleRecovery = (data?.muscleRecovery || []).map(m => liveRecovery(m, now));

  const tabStyle = (active) => ({
    flex: 1,
    padding: '10px 8px',
    background: active ? '#c8f542' : '#1e1e22',
    border: '1px solid #2a2a30',
    borderRadius: 8,
    color: active ? '#0d0d0f' : '#888',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Syne', sans-serif",
    textAlign: 'center',
  });

  return (
    <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 14, padding: 20 }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
        Analiza Zmęczenia
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button style={tabStyle(tab === 'acwr')} onClick={() => setTab('acwr')}>
          Zmęczenie Systemowe (OUN – ACWR)
        </button>
        <button style={tabStyle(tab === 'muscle')} onClick={() => setTab('muscle')}>
          Regeneracja Mięśni (Obwodowa)
        </button>
      </div>

      {tab === 'acwr'
        ? <AcwrView data={data?.acwr} />
        : <MuscleRecoveryView data={muscleRecovery} />}
    </div>
  );
}
