import React, { useState } from 'react';
import { createBodyMeasurement } from '../../api/authAPI';

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Siedzący (biuro)' },
  { value: 'light_active', label: 'Lekko aktywny (1-2 treningi/tydzień)' },
  { value: 'moderate_active', label: 'Umiarkowanie aktywny (3-4 treningi/tydzień)' },
  { value: 'very_active', label: 'Bardzo aktywny (5-6 treningów/tydzień)' },
  { value: 'extra_active', label: 'Ekstremalnie aktywny (2+ dziennie)' },
];

const GOALS = [
  { value: 'loss', label: 'Redukcja (utrata wagi)' },
  { value: 'maintenance', label: 'Utrzymanie wagi' },
  { value: 'gain', label: 'Przyrost masy' },
];

const MEASUREMENT_FIELDS = [
  { name: 'weight', label: 'Waga (kg)', required: true },
  { name: 'height', label: 'Wzrost (cm)', required: true },
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

const inputStyle = { width: '100%', padding: '5px 8px', background: '#0d0d0f', border: '1px solid #2a2a30', borderRadius: 6, color: '#f0ede8', fontSize: 12, boxSizing: 'border-box' };
const labelStyle = { fontSize: 10, color: '#888', display: 'block', marginBottom: 2 };

export default function BodyMeasurementForm({ onSave, compact }) {
  const [form, setForm] = useState({
    height: '', weight: '', gender: 'male', birthDate: '',
    activityLevel: 'moderate_active', goal: 'maintenance',
    chest: '', bicepsLeft: '', bicepsRight: '', forearmLeft: '', forearmRight: '',
    waist: '', belly: '', hips: '', thighLeft: '', thighRight: '',
    calfLeft: '', calfRight: '', neck: '', shoulders: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        Username: '',
        Email: '',
        BirthDate: form.birthDate || null,
        CurrentWeight: parseFloat(form.weight) || null,
        Height: parseFloat(form.height) || null,
        Gender: form.gender,
        JobType: form.activityLevel,
        Goal: form.goal,
      };

      const updateUser = (await import('../../api/authAPI')).updateUserProfile;
      if (updateUser) {
        await updateUser(payload);
      }

      const measurements = {
        height: parseFloat(form.height) || 0,
        weight: parseFloat(form.weight) || 0,
        gender: form.gender,
      };
      for (const f of MEASUREMENT_FIELDS) {
        const val = parseFloat(form[f.name]);
        if (!isNaN(val)) measurements[f.name] = val;
      }

      const hasAnyMeasurement = MEASUREMENT_FIELDS.slice(2).some(f => form[f.name]);
      if (hasAnyMeasurement) {
        await createBodyMeasurement(measurements);
      }

      if (onSave) onSave();
    } catch (err) {
      alert('Błąd zapisu: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div style={{ background: '#16161a', border: '1px solid #1e1e22', borderRadius: 12, padding: compact ? 16 : 20, maxWidth: '100%' }}>
      {!compact && <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0ede8', margin: '0 0 16px' }}>Pomiary ciała</h3>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Waga (kg) *</label>
            <input name="weight" value={form.weight} onChange={handleChange} placeholder="80" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Wzrost (cm) *</label>
            <input name="height" value={form.height} onChange={handleChange} placeholder="180" style={inputStyle} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Data urodzenia *</label>
            <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Płeć *</label>
            <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
              <option value="male">Mężczyzna</option>
              <option value="female">Kobieta</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Poziom aktywności *</label>
          <select name="activityLevel" value={form.activityLevel} onChange={handleChange} style={inputStyle}>
            {ACTIVITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Cel treningowy *</label>
          <select name="goal" value={form.goal} onChange={handleChange} style={inputStyle}>
            {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        {!compact && (
          <>
            <div style={{ height: 1, background: '#1e1e22', margin: '4px 0' }} />
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Opcjonalne pomiary obwodów (cm)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div><label style={labelStyle}>Klatka</label><input name="chest" value={form.chest} onChange={handleChange} placeholder="110" style={inputStyle} /></div>
              <div><label style={labelStyle}>Biceps L</label><input name="bicepsLeft" value={form.bicepsLeft} onChange={handleChange} placeholder="38" style={inputStyle} /></div>
              <div><label style={labelStyle}>Biceps P</label><input name="bicepsRight" value={form.bicepsRight} onChange={handleChange} placeholder="38" style={inputStyle} /></div>
              <div><label style={labelStyle}>Przedramię L</label><input name="forearmLeft" value={form.forearmLeft} onChange={handleChange} placeholder="30" style={inputStyle} /></div>
              <div><label style={labelStyle}>Przedramię P</label><input name="forearmRight" value={form.forearmRight} onChange={handleChange} placeholder="30" style={inputStyle} /></div>
              <div><label style={labelStyle}>Pas</label><input name="waist" value={form.waist} onChange={handleChange} placeholder="85" style={inputStyle} /></div>
              <div><label style={labelStyle}>Brzuch</label><input name="belly" value={form.belly} onChange={handleChange} placeholder="90" style={inputStyle} /></div>
              <div><label style={labelStyle}>Biodra</label><input name="hips" value={form.hips} onChange={handleChange} placeholder="100" style={inputStyle} /></div>
              <div><label style={labelStyle}>Udo L</label><input name="thighLeft" value={form.thighLeft} onChange={handleChange} placeholder="58" style={inputStyle} /></div>
              <div><label style={labelStyle}>Udo P</label><input name="thighRight" value={form.thighRight} onChange={handleChange} placeholder="58" style={inputStyle} /></div>
              <div><label style={labelStyle}>Łydka L</label><input name="calfLeft" value={form.calfLeft} onChange={handleChange} placeholder="38" style={inputStyle} /></div>
              <div><label style={labelStyle}>Łydka P</label><input name="calfRight" value={form.calfRight} onChange={handleChange} placeholder="38" style={inputStyle} /></div>
              <div><label style={labelStyle}>Szyja</label><input name="neck" value={form.neck} onChange={handleChange} placeholder="40" style={inputStyle} /></div>
              <div><label style={labelStyle}>Barki</label><input name="shoulders" value={form.shoulders} onChange={handleChange} placeholder="120" style={inputStyle} /></div>
            </div>
          </>
        )}

        <button type="submit" disabled={saving}
          style={{ padding: '8px 16px', background: '#c8f542', border: 'none', borderRadius: 6, color: '#0d0d0f', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
          {saving ? 'Zapisywanie...' : 'Zapisz pomiary'}
        </button>
      </form>
    </div>
  );
}
