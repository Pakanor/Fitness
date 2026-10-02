import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { fetchMe, getBodyMeasurements, createBodyMeasurement, deleteBodyMeasurement } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';

const JOB_TYPES = [
  { value: 'sedentary', label: 'Siedząca', pal: 1.2 },
  { value: 'light_active', label: 'Mieszana', pal: 1.375 },
  { value: 'moderate_active', label: 'Fizyczna', pal: 1.55 },
  { value: 'very_active', label: 'Ciężka fizyczna', pal: 1.725 },
  { value: 'extra_active', label: 'Bardzo ciężka', pal: 1.9 },
];

const inp = { width: '100%', padding: '8px 12px', background: '#0d0d0f', border: '1px solid #2a2a30', borderRadius: 8, color: '#f0ede8', fontSize: 13, boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" };
const sel = { ...inp, cursor: 'pointer' };
const lbl = { fontSize: 11, color: '#888', display: 'block', marginBottom: 4 };
const card = { background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 24 };

function SettingsPage({ profile, onUpdate }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saveSaving, setSaveSaving] = useState(false);

  const [birthDate, setBirthDate] = useState('');
  const [ageInput, setAgeInput] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [jobType, setJobType] = useState('sedentary');
  const [goal, setGoal] = useState('maintenance');
  const [metaSaving, setMetaSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || '');
    setEmail(profile.email || '');
    setBirthDate(profile.birthDate ? profile.birthDate.split('T')[0] : '');
    setHeight(profile.height || '');
    setCurrentWeight(profile.currentWeight || '');
    setGender(profile.gender || 'male');
    setJobType(profile.jobType || 'sedentary');
    setGoal(profile.goal || 'maintenance');
  }, [profile]);

  const calcAge = birthDate ? Math.floor((new Date() - new Date(birthDate)) / (365.25 * 86400000)) : null;
  const age = ageInput || (calcAge != null ? calcAge : '');
  
  const handleAgeChange = (val) => {
    setAgeInput(val);
    if (val) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - parseInt(val));
      setBirthDate(d.toISOString().split('T')[0]);
    }
  };
  const pal = JOB_TYPES.find(j => j.value === jobType)?.pal || 1.2;
  const localBmr = profile?.bmr || 0;
  const localTdee = localBmr ? Math.round(localBmr * pal) : 0;

  const proteinG = localTdee ? Math.round((localTdee * 0.30) / 4) : 0;
  const carbsG = localTdee ? Math.round((localTdee * 0.45) / 4) : 0;
  const fatG = localTdee ? Math.round((localTdee * 0.25) / 9) : 0;
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const macroTotal = proteinKcal + carbsKcal + fatKcal || 1;

  const handleSaveBasic = async () => {
    setSaveSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username, email,
          birthDate: profile?.birthDate || null,
          height: profile?.height || null,
          currentWeight: profile?.currentWeight || null,
          gender: profile?.gender || 'male',
          jobType: profile?.jobType || 'sedentary',
        }),
      });
      if (!res.ok) throw new Error('Błąd');
      onUpdate();
    } catch (err) {
      alert('Błąd zapisu: ' + err.message);
    }
    setSaveSaving(false);
  };

  const handleSaveMeta = async () => {
    setMetaSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: profile?.username || '',
          email: profile?.email || '',
          birthDate: birthDate ? new Date(birthDate).toISOString() : null,
          height: height ? parseFloat(height) : null,
          currentWeight: currentWeight ? parseFloat(currentWeight) : null,
          gender, jobType, goal,
        }),
      });
      if (!res.ok) throw new Error('Błąd');
      onUpdate();
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
    setMetaSaving(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { }
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Left column: Basic data */}
      <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={card}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>
            Dane <span style={{ color: '#c8f542' }}>podstawowe</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={lbl}>Nazwa użytkownika</label>
              <input value={username} onChange={e => setUsername(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} style={inp} />
            </div>
            <button onClick={handleSaveBasic} disabled={saveSaving}
              style={{ padding: '8px 20px', background: '#c8f542', border: 'none', borderRadius: 8, color: '#0d0d0f', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start' }}>
              {saveSaving ? '...' : 'Zapisz'}
            </button>
          </div>
        </div>

        <button onClick={handleLogout}
          style={{ padding: '10px 20px', background: '#2a1a1a', border: '1px solid #5a2a2a', borderRadius: 10, color: '#ff8a80', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>
          WYLOGUJ SIĘ
        </button>
      </div>

      {/* Right column: Metabolic profile */}
      <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={card}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>
            Profil <span style={{ color: '#c8f542' }}>metaboliczny</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Wiek (lata)</label>
                <input type="number" min="1" max="120" value={age} onChange={e => handleAgeChange(e.target.value)} style={inp} placeholder="np. 30" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Płeć</label>
                <select value={gender} onChange={e => setGender(e.target.value)} style={sel}>
                  <option value="male">Mężczyzna</option>
                  <option value="female">Kobieta</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Wzrost (cm)</label>
                <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Waga (kg)</label>
                <input type="number" step="0.1" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Typ pracy (współczynnik PAL)</label>
              <select value={jobType} onChange={e => setJobType(e.target.value)} style={sel}>
                {JOB_TYPES.map(jt => <option key={jt.value} value={jt.value}>{jt.label} (PAL {jt.pal})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Cel treningowy</label>
              <select value={goal} onChange={e => setGoal(e.target.value)} style={sel}>
                <option value="loss">Redukcja (utrata wagi)</option>
                <option value="maintenance">Utrzymanie wagi</option>
                <option value="gain">Przyrost masy</option>
              </select>
            </div>
            <button onClick={handleSaveMeta} disabled={metaSaving}
              style={{ padding: '8px 20px', background: '#c8f542', border: 'none', borderRadius: 8, color: '#0d0d0f', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start' }}>
              {metaSaving ? '...' : 'Aktualizuj profil'}
            </button>
          </div>
        </div>

        {/* Macro reference card */}
        {localTdee > 0 && (
          <div style={{ ...card, background: '#111115' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>
              Referencja <span style={{ color: '#c8f542' }}>kaloryczna</span>
            </h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#0d0d0f', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>BMR</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#c8f542' }}>{localBmr}</div>
                <div style={{ fontSize: 10, color: '#555' }}>kcal</div>
              </div>
              <div style={{ flex: 1, background: '#0d0d0f', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TDEE</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#f0ede8' }}>{localTdee}</div>
                <div style={{ fontSize: 10, color: '#555' }}>kcal</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Protein */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#aaa' }}>Białko</span>
                  <span style={{ color: '#f0ede8' }}>{proteinG}g · {proteinKcal} kcal</span>
                </div>
                <div style={{ height: 6, background: '#1e1e22', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(proteinKcal / macroTotal) * 100}%`, background: '#ff6b6b', borderRadius: 4 }} />
                </div>
              </div>
              {/* Carbs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#aaa' }}>Węglowodany</span>
                  <span style={{ color: '#f0ede8' }}>{carbsG}g · {carbsKcal} kcal</span>
                </div>
                <div style={{ height: 6, background: '#1e1e22', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(carbsKcal / macroTotal) * 100}%`, background: '#4ecdc4', borderRadius: 4 }} />
                </div>
              </div>
              {/* Fat */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#aaa' }}>Tłuszcze</span>
                  <span style={{ color: '#f0ede8' }}>{fatG}g · {fatKcal} kcal</span>
                </div>
                <div style={{ height: 6, background: '#1e1e22', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(fatKcal / macroTotal) * 100}%`, background: '#ffd93d', borderRadius: 4 }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 12, textAlign: 'center' }}>
              Podział: 30% białko · 45% węgle · 25% tłuszcze
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const MEASUREMENT_FIELDS = [
  { name: 'weight', label: 'Waga (kg)' },
  { name: 'height', label: 'Wzrost (cm)' },
  { name: 'chest', label: 'Klatka (cm)' },
  { name: 'bicepsLeft', label: 'Biceps L (cm)' },
  { name: 'bicepsRight', label: 'Biceps P (cm)' },
  { name: 'forearmLeft', label: 'Przedramię L (cm)' },
  { name: 'forearmRight', label: 'Przedramię P (cm)' },
  { name: 'waist', label: 'Pas (cm)' },
  { name: 'belly', label: 'Brzuch (cm)' },
  { name: 'hips', label: 'Biodra (cm)' },
  { name: 'thighLeft', label: 'Udo L (cm)' },
  { name: 'thighRight', label: 'Udo P (cm)' },
  { name: 'calfLeft', label: 'Łydka L (cm)' },
  { name: 'calfRight', label: 'Łydka P (cm)' },
  { name: 'neck', label: 'Szyja (cm)' },
  { name: 'shoulders', label: 'Barki (cm)' },
];

const SIDED_FIELDS = [
  { left: 'bicepsLeft', right: 'bicepsRight', label: 'bicepsa' },
  { left: 'forearmLeft', right: 'forearmRight', label: 'przedramienia' },
  { left: 'thighLeft', right: 'thighRight', label: 'uda' },
  { left: 'calfLeft', right: 'calfRight', label: 'łydki' },
];

function vTaperAnalysis(last) {
  if (!last || !last.chest || !last.waist) return null;
  const ratio = last.chest / last.waist;
  if (ratio >= 1.15) return { label: 'Klasyczne V-Taper', ratio: ratio.toFixed(2), color: '#22c55e' };
  if (ratio >= 1.05) return { label: 'Proporcjonalny', ratio: ratio.toFixed(2), color: '#f59e0b' };
  return { label: 'Wąska góra / szerszy pas', ratio: ratio.toFixed(2), color: '#ef4444' };
}

function findAsymmetries(last) {
  if (!last) return [];
  const results = [];
  for (const sf of SIDED_FIELDS) {
    const l = last[sf.left];
    const r = last[sf.right];
    if (l != null && r != null) {
      const diff = Math.abs(l - r);
      if (diff > 1) {
        results.push({ label: sf.label, diff: diff.toFixed(1), dominant: l > r ? 'L > P' : 'P > L' });
      }
    }
  }
  return results;
}

function MeasurementsPage({ profileHeight }) {
  const [measurements, setMeasurements] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchMeasurements = useCallback(async () => {
    try {
      const data = await getBodyMeasurements();
      setMeasurements(Array.isArray(data) ? data : []);
    } catch { setMeasurements([]); }
  }, []);

  useEffect(() => { fetchMeasurements(); }, [fetchMeasurements]);

  const didSyncHeight = useRef(false);
  useEffect(() => {
    if (profileHeight && !didSyncHeight.current) {
      didSyncHeight.current = true;
      setForm(f => ({ ...f, height: profileHeight }));
    }
  }, [profileHeight]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      for (const f of MEASUREMENT_FIELDS) {
        const val = parseFloat(form[f.name]);
        if (!isNaN(val)) payload[f.name] = val;
      }
      if (!payload.height) payload.height = 0;
      await createBodyMeasurement(payload);
      setForm({});
      fetchMeasurements();
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć ten pomiar?')) return;
    try {
      await deleteBodyMeasurement(id);
      fetchMeasurements();
    } catch (err) {
      alert('Błąd: ' + err.message);
    }
  };

  const last = measurements.length > 0 ? measurements[0] : null;
  const vtaper = vTaperAnalysis(last);
  const asymmetries = findAsymmetries(last);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 16, flex: 1, alignSelf: 'flex-start' }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>
          Nowy <span style={{ color: '#c8f542' }}>pomiar</span>
        </h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {MEASUREMENT_FIELDS.map(f => (
              <div key={f.name}>
                <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 2 }}>{f.label}</label>
                <input name={f.name} type="number" step="0.1" value={form[f.name] || ''} onChange={handleChange} style={{ width: '100%', padding: '5px 8px', background: '#0d0d0f', border: '1px solid #2a2a30', borderRadius: 6, color: '#f0ede8', fontSize: 12, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving}
            style={{ padding: '8px 16px', background: '#c8f542', border: 'none', borderRadius: 6, color: '#0d0d0f', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 2 }}>
            {saving ? 'Zapisywanie...' : 'Zapisz pomiar'}
          </button>
        </form>
      </div>

      <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 20, flex: 2, minWidth: 350, overflowX: 'auto' }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 12px' }}>
          Historia <span style={{ color: '#c8f542' }}>pomiarów</span>
        </h3>
        {measurements.length === 0 ? (
          <div style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: 20 }}>Brak zapisanych pomiarów</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Data</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Wzrost</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Waga</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Klatka</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Bic L</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Bic P</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Przed L</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Przed P</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Pas</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Brzuch</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Biodra</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Udo L</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Udo P</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Łyd L</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Łyd P</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Szyja</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30' }}>Barki</th>
                <th style={{ textAlign: 'left', padding: '4px 6px', color: '#888', borderBottom: '1px solid #2a2a30', width: 30 }} />
              </tr>
            </thead>
            <tbody>
              {measurements.map(m => (
                <tr key={m.id}>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#888' }}>{new Date(m.measuredAt).toLocaleDateString('pl-PL')}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.height ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.weight ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.chest ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.bicepsLeft ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.bicepsRight ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.forearmLeft ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.forearmRight ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.waist ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.belly ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.hips ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.thighLeft ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.thighRight ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.calfLeft ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.calfRight ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.neck ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22', color: '#f0ede8' }}>{m.shoulders ?? '—'}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #1e1e22' }}>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', fontSize: 12, padding: 2 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(vtaper || asymmetries.length > 0) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', width: '100%' }}>
          {vtaper && (
            <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: 16, flex: 1, minWidth: 250 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8 }}>
                Kształt <span style={{ color: '#c8f542' }}>sylwetki</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `conic-gradient(${vtaper.color} 0deg, ${vtaper.color} ${(vtaper.ratio / 1.3) * 180}deg, #1e1e22 ${(vtaper.ratio / 1.3) * 180}deg)`,
                  border: `2px solid ${vtaper.color}`,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede8' }}>{vtaper.label}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Stosunek klatka/pas: <strong style={{ color: vtaper.color }}>{vtaper.ratio}</strong></div>
                </div>
              </div>
            </div>
          )}
          {asymmetries.map((a, i) => (
            <div key={i} style={{ background: '#1a1a0a', border: '1px solid #5a4a00', borderRadius: 12, padding: 16, flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ffc107' }}>
                <span>⚠️</span>
                <span>Wykryto asymetrię <strong>{a.diff} cm</strong> w {a.label} ({a.dominant})</span>
              </div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                Sugerowana praca unilateralna (jednorącz/jednonóż) w zakładce <strong style={{ color: '#c8f542' }}>Ćwiczenia</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'settings';
  const { refreshMeasurementStatus } = useAuth();

  const fetchProfile = useCallback(async () => {
    try {
      await fetchMe();
      const res = await fetch('http://localhost:8000/api/user/profile', { credentials: 'include' });
      if (res.ok) setProfile(await res.json());
      // Keep the app-wide measurement gate in sync after edits.
      await refreshMeasurementStatus();
    } catch { }
  }, [refreshMeasurementStatus]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // Redirect to settings if no valid view
  if (!['settings', 'measurements'].includes(view)) {
    navigate('/profile?view=settings', { replace: true });
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0f', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <Header />
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e22' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          {view === 'settings' ? 'Ustawienia konta' : 'Dziennik pomiarów'}
          <span style={{ color: '#c8f542' }}>{view === 'settings' ? ' i profil metaboliczny' : ' i antropometria'}</span>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {view === 'settings' && <SettingsPage profile={profile} onUpdate={fetchProfile} />}
        {view === 'measurements' && <MeasurementsPage profileHeight={profile?.height} />}
      </div>
    </div>
  );
}
