import React, { useState } from 'react';
import { createBodyMeasurement, updateUserProfile } from '../../api/authAPI';
import '../../styles/tokens.css';

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

const MeasurementFormStyles = `
  .mf {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--compact, 20px);
    max-width: 100%;
  }

  .mf-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--color-fg-primary);
    margin: 0 0 var(--space-4);
  }

  .mf-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .mf-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .mf-label {
    font-size: 10px;
    color: var(--color-fg-secondary);
    display: block;
    margin-bottom: 2px;
  }

  .mf-input {
    width: 100%;
    padding: 6px 10px;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    color: var(--color-fg-primary);
    font-size: 13px;
    box-sizing: border-box;
    font-family: var(--font-body);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast);
  }

  .mf-input::placeholder {
    color: var(--color-fg-disabled);
  }

  .mf-input:hover:not(:disabled):not(:read-only) {
    border-color: var(--color-border-default);
  }

  .mf-input:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-accent-dim);
    background: var(--color-bg-card);
  }

  .mf-divider {
    height: 1px;
    background: var(--color-border-subtle);
    border: none;
    margin: var(--space-2) 0;
  }

  .mf-section-label {
    font-size: 11px;
    color: var(--color-fg-muted);
    margin-bottom: var(--space-2);
  }

  .mf-grid-circumferences {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .mf-submit {
    padding: 8px 16px;
    background: var(--color-accent);
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-bg-deep);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    margin-top: var(--space-1);
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .mf-submit:hover:not(:disabled) {
    background: var(--color-accent-hover);
    box-shadow: 0 0 0 3px var(--color-accent-dim);
  }

  .mf-submit:active:not(:disabled) {
    transform: scale(0.98);
  }

  .mf-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 500px) {
    .mf-grid-2,
    .mf-grid-circumferences {
      grid-template-columns: 1fr;
    }
  }
`;

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

      await updateUserProfile(payload);

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

  const requiredFields = MEASUREMENT_FIELDS.filter(f => f.required);

  return (
    <>
      <style>{MeasurementFormStyles}</style>
      <div
        className="mf"
        style={{ '--compact': compact ? '16px' : '20px' }}
      >
        {!compact && <h3 className="mf-title">Pomiary ciała</h3>}
        <form onSubmit={handleSubmit} className="mf-form">
          <div className="mf-grid-2">
            <div className="form-field">
              <label className="mf-label" htmlFor="weight">Waga (kg) *</label>
              <input
                id="weight"
                name="weight"
                className="mf-input"
                value={form.weight}
                onChange={handleChange}
                placeholder="80"
                required
                inputMode="decimal"
              />
            </div>
            <div className="form-field">
              <label className="mf-label" htmlFor="height">Wzrost (cm) *</label>
              <input
                id="height"
                name="height"
                className="mf-input"
                value={form.height}
                onChange={handleChange}
                placeholder="180"
                required
                inputMode="decimal"
              />
            </div>
          </div>
          <div className="mf-grid-2">
            <div className="form-field">
              <label className="mf-label" htmlFor="birthDate">Data urodzenia *</label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                className="mf-input"
                value={form.birthDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label className="mf-label" htmlFor="gender">Płeć *</label>
              <select
                id="gender"
                name="gender"
                className="mf-input"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="male">Mężczyzna</option>
                <option value="female">Kobieta</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="mf-label" htmlFor="activityLevel">Poziom aktywności *</label>
            <select
              id="activityLevel"
              name="activityLevel"
              className="mf-input"
              value={form.activityLevel}
              onChange={handleChange}
            >
              {ACTIVITY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="mf-label" htmlFor="goal">Cel treningowy *</label>
            <select
              id="goal"
              name="goal"
              className="mf-input"
              value={form.goal}
              onChange={handleChange}
            >
              {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {!compact && (
            <>
              <hr className="mf-divider" />
              <div className="mf-section-label">Opcjonalne pomiary obwodów (cm)</div>
              <div className="mf-grid-circumferences">
                {MEASUREMENT_FIELDS.slice(2).map(f => (
                  <div key={f.name} className="form-field">
                    <label className="mf-label" htmlFor={f.name}>{f.label}</label>
                    <input
                      id={f.name}
                      name={f.name}
                      className="mf-input"
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.label.replace(' (cm)', '')}
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <button type="submit" disabled={saving} className="mf-submit">
            {saving ? 'Zapisywanie...' : 'Zapisz pomiary'}
          </button>
          {requiredFields.length > 0 && !compact && (
            <p className="form-hint">Pola oznaczone * są wymagane.</p>
          )}
        </form>
      </div>
    </>
  );
}