import React, { useState, useEffect } from 'react';
import { getBodyMeasurements, deleteBodyMeasurement } from '../../api/authAPI';

const COLUMNS = [
  { key: 'measuredAt', label: 'Data', format: v => new Date(v).toLocaleDateString('pl-PL') },
  { key: 'weight', label: 'Waga', suffix: 'kg' },
  { key: 'height', label: 'Wzrost', suffix: 'cm' },
  { key: 'chest', label: 'Klatka', suffix: 'cm' },
  { key: 'bicepsLeft', label: 'Bic L', suffix: 'cm' },
  { key: 'bicepsRight', label: 'Bic P', suffix: 'cm' },
  { key: 'forearmLeft', label: 'Przed L', suffix: 'cm' },
  { key: 'forearmRight', label: 'Przed P', suffix: 'cm' },
  { key: 'waist', label: 'Pas', suffix: 'cm' },
  { key: 'belly', label: 'Brzuch', suffix: 'cm' },
  { key: 'hips', label: 'Biodra', suffix: 'cm' },
  { key: 'thighLeft', label: 'Udo L', suffix: 'cm' },
  { key: 'thighRight', label: 'Udo P', suffix: 'cm' },
  { key: 'calfLeft', label: 'Łyd L', suffix: 'cm' },
  { key: 'calfRight', label: 'Łyd P', suffix: 'cm' },
  { key: 'neck', label: 'Szyja', suffix: 'cm' },
  { key: 'shoulders', label: 'Barki', suffix: 'cm' },
  { key: 'bfPercent', label: 'BF%', suffix: '%' },
];

export default function BodyMeasurementDisplay({ refreshKey }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const result = await getBodyMeasurements();
      setData(result);
    })();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć ten pomiar?')) return;
    try {
      await deleteBodyMeasurement(id);
      setData(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      alert('Błąd usuwania: ' + err.message);
    }
  };

  if (!data.length) return null;

  return (
    <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 20, overflowX: 'auto' }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>Historia pomiarów</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th key={col.key} style={{ textAlign: 'left', padding: '6px 8px', color: '#888', borderBottom: '1px solid #2a2a30', whiteSpace: 'nowrap' }}>{col.label}</th>
            ))}
            <th style={{ textAlign: 'left', padding: '6px 8px', color: '#888', borderBottom: '1px solid #2a2a30', width: 40 }} />
          </tr>
        </thead>
        <tbody>
          {data.map(m => (
            <tr key={m.id}>
              {COLUMNS.map(col => (
                <td key={col.key} style={{ padding: '6px 8px', borderBottom: '1px solid #1e1e22', color: '#f0ede8', whiteSpace: 'nowrap' }}>
                  {col.format ? col.format(m[col.key]) : (m[col.key] != null ? `${m[col.key]}${col.suffix || ''}` : '—')}
                </td>
              ))}
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #1e1e22' }}>
                <button onClick={() => handleDelete(m.id)}
                  style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: 13, padding: 2 }}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
