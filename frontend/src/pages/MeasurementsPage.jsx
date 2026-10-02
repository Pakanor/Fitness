import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Header from '../components/layout/Header';
import BodyMeasurementForm from '../features/measurements/BodyMeasurementForm';
import BodyMeasurementDisplay from '../features/measurements/BodyMeasurementDisplay';
import { getBodyMeasurements } from '../api/authAPI';

const TRACKED_METRICS = [
  { key: 'weight', label: 'Waga', color: '#c8f542', suffix: 'kg' },
  { key: 'chest', label: 'Klatka', color: '#42a5f5', suffix: 'cm' },
  { key: 'biceps', label: 'Biceps', color: '#ffa726', suffix: 'cm' },
  { key: 'waist', label: 'Pas', color: '#ef5350', suffix: 'cm' },
  { key: 'thigh', label: 'Udo', color: '#ab47bc', suffix: 'cm' },
  { key: 'calf', label: 'Łydka', color: '#66bb6a', suffix: 'cm' },
];

function MeasurementChart() {
  const [data, setData] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(TRACKED_METRICS[0]);

  useEffect(() => {
    (async () => {
      const result = await getBodyMeasurements();
      if (result) {
        const sorted = [...result].sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
        setData(sorted);
      }
    })();
  }, []);

  if (data.length < 2) return null;

  const chartData = data.map(m => ({
    date: new Date(m.measuredAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
    value: m[selectedMetric.key],
  }));

  return (
    <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8' }}>Trend</span>
        <select value={selectedMetric.key} onChange={e => setSelectedMetric(TRACKED_METRICS.find(m => m.key === e.target.value) || TRACKED_METRICS[0])}
          style={{ padding: '6px 10px', background: '#0d0d0f', border: '1px solid #2a2a30', borderRadius: 8, color: '#f0ede8', fontSize: 12 }}>
          {TRACKED_METRICS.map(m => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
          <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={{ stroke: '#2a2a30' }} tickLine={false} />
          <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={{ stroke: '#2a2a30' }} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0d0d0f', border: '1px solid #2a2a30', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#888' }}
            formatter={(val) => [`${val} ${selectedMetric.suffix}`, selectedMetric.label]}
          />
          <Line type="monotone" dataKey="value" stroke={selectedMetric.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MeasurementsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e22' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>Pomiary <span style={{ color: '#c8f542' }}>ciała</span></div>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <BodyMeasurementForm onSave={() => setRefreshKey(k => k + 1)} />
          <div style={{ flex: 1, minWidth: 300 }}><MeasurementChart /></div>
        </div>
        <div key={refreshKey}><BodyMeasurementDisplay refreshKey={refreshKey} /></div>
      </div>
    </div>
  );
}