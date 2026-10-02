import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import BodyMeasurementForm from '../features/measurements/BodyMeasurementForm';
import { useAuth } from '../context/AuthContext';

function DashboardPage() {
  const navigate = useNavigate();
  const { hasMeasurements, refreshMeasurementStatus } = useAuth();

  if (!hasMeasurements) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
        <Header />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', gap: 20 }}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
              Uzupełnij pomiary ciała, aby spersonalizować aplikację
            </div>
            <div style={{ color: '#666', fontSize: 13, lineHeight: 1.5 }}>
              Potrzebujemy wagi, wzrostu, wieku i celu, aby obliczyć zapotrzebowanie kaloryczne i przygotować plan treningowy.
            </div>
          </div>
          <BodyMeasurementForm
            onSave={async () => { await refreshMeasurementStatus(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24 }}>Witaj w <span style={{ color: '#c8f542' }}>FitnessApp</span></div>
        <div style={{ color: '#666', fontSize: 14 }}>Wybierz sekcję, aby rozpocząć</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={() => navigate('/exercises')} style={{ padding: '12px 24px', background: '#c8f542', color: '#0d0d0f', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
            Ćwiczenia
          </button>
          <button onClick={() => navigate('/calorie-tracker')} style={{ padding: '12px 24px', background: '#16161a', color: '#f0ede8', border: '1px solid #1e1e22', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
            Kalorie
          </button>
          <button onClick={() => navigate('/records')} style={{ padding: '12px 24px', background: '#16161a', color: '#f0ede8', border: '1px solid #1e1e22', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
            Rekordy Życiowe
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
