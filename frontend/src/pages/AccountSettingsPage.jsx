import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, updateUserProfile, changePassword, exportUserData, deleteUserAccount, fetchActiveSessions } from '../api/authAPI';

const ACTIVITIES = [
  { value: 'sedentary', label: 'Siedzaca', pal: 1.2 },
  { value: 'light_active', label: 'Lekka aktywnosc', pal: 1.375 },
  { value: 'moderate_active', label: 'Umiarkowana aktywnosc', pal: 1.55 },
  { value: 'very_active', label: 'Duza aktywnosc', pal: 1.725 },
  { value: 'extra_active', label: 'Bardzo duza aktywnosc', pal: 1.9 },
];

const GOALS = [
  { value: 'loss', label: 'Redukcja', adjustment: -400 },
  { value: 'maintenance', label: 'Utrzymanie', adjustment: 0 },
  { value: 'gain', label: 'Budowanie masy', adjustment: 300 },
];

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '6px 9px', border: '1px solid var(--color-border-default)', borderRadius: 8, background: 'var(--color-bg-base)', color: 'var(--color-fg-primary)', fontFamily: 'inherit' };
const labelStyle = { display: 'block', marginBottom: 3, color: 'var(--color-fg-muted)', fontSize: 10 };
const buttonStyle = { padding: '7px 12px', border: 0, borderRadius: 8, background: 'var(--color-accent)', color: 'var(--color-bg-base)', fontWeight: 700, cursor: 'pointer', fontSize: 12 };
const cardStyle = { background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)', borderRadius: 12, padding: 10, minHeight: 0, overflow: 'hidden' };

function Field({ label, children }) {
  return <label style={{ display: 'block' }}><span style={labelStyle}>{label}</span>{children}</label>;
}

function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [manualMacrosEnabled, setManualMacrosEnabled] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then((data) => {
      const hasManual = data.manualProteinG || data.manualCarbsG || data.manualFatG;
      setProfile(data);
      setForm({ ...data, birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '', manualProteinG: data.manualProteinG || '', manualCarbsG: data.manualCarbsG || '', manualFatG: data.manualFatG || '' });
      setManualMacrosEnabled(hasManual);
    }).catch(() => setStatus('Nie udało się pobrać ustawień.'));
  }, []);

  useEffect(() => {
    fetchActiveSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const activity = ACTIVITIES.find((item) => item.value === form.jobType) || ACTIVITIES[0];
  const goal = GOALS.find((item) => item.value === form.goal) || GOALS[1];
  const calculatedTarget = profile?.bmr && form.currentWeight && form.height && form.birthDate
    ? Math.round(profile.bmr * activity.pal + goal.adjustment)
    : null;
  const macroCalories = Number(form.manualProteinG || 0) * 4
    + Number(form.manualCarbsG || 0) * 4
    + Number(form.manualFatG || 0) * 9;
  const target = manualMacrosEnabled && macroCalories
    ? macroCalories
    : calculatedTarget || profile?.tdee;

const saveProfile = async (fields, message) => {
    setSaving(true);
    setStatus('');
    try {
      const next = { ...profile, ...form, ...fields };
      await updateUserProfile({
        username: next.username || user?.username || '', email: next.email || user?.email || '',
        birthDate: next.birthDate || null, currentWeight: next.currentWeight ? Number(next.currentWeight) : null,
        height: next.height ? Number(next.height) : null, gender: next.gender || null, jobType: next.jobType || null,
        goal: next.goal || null,
        manualProteinG: manualMacrosEnabled && next.manualProteinG ? Number(next.manualProteinG) : null, manualCarbsG: manualMacrosEnabled && next.manualCarbsG ? Number(next.manualCarbsG) : null,
        manualFatG: manualMacrosEnabled && next.manualFatG ? Number(next.manualFatG) : null, weightUnit: next.weightUnit || 'kg',
        defaultWeightIncrement: next.defaultWeightIncrement ? Number(next.defaultWeightIncrement) : null,
        defaultRestTimerSeconds: next.defaultRestTimerSeconds ? Number(next.defaultRestTimerSeconds) : null,
      });
      const refreshed = await fetchProfile();
      setProfile(refreshed);
      setForm({ ...refreshed, birthDate: refreshed.birthDate ? refreshed.birthDate.slice(0, 10) : '', manualProteinG: manualMacrosEnabled ? refreshed.manualProteinG || '' : '', manualCarbsG: manualMacrosEnabled ? refreshed.manualCarbsG || '' : '', manualFatG: manualMacrosEnabled ? refreshed.manualFatG || '' : '' });
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: refreshed }));
      setStatus(message);
    } catch (error) {
      setStatus(error.message || 'Nie uda się zapisać zmian.');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      await changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setStatus('Hasło zostało zmienione.');
    } catch (error) {
      setStatus(error.message || 'Nie udało się zmienić hasła.');
    } finally {
      setSaving(false);
    }
  };

  const downloadData = async () => {
    const data = await exportUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fitnessapp-dane.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const removeAccount = async () => {
    if (!window.confirm('Czy na pewno usunąć konto i wszystkie dane?')) return;
    await deleteUserAccount();
    setUser(null);
    navigate('/login', { replace: true });
  };

  if (!profile) return <><Header /><main style={{ padding: 24 }}>Ładowanie ustawień...</main></>;

  return <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', color: 'var(--color-fg-primary)', fontFamily: "'DM Sans', sans-serif" }}>
    <Header />
    <main style={{ maxWidth: 1100, height: 'calc(100dvh - var(--header-height))', boxSizing: 'border-box', overflow: 'hidden', margin: '0 auto', padding: '10px 20px 12px' }}>
      <div style={{ marginBottom: 12 }}><h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 22 }}>Ustawienia konta</h1><p style={{ color: 'var(--color-fg-muted)', margin: '4px 0 0', fontSize: 13 }}>Zarządzaj bilansem, treningiem, bezpieczeństwem i danymi.</p></div>
      {status && <div role="status" style={{ marginBottom: 10, color: 'var(--color-accent)', fontSize: 13 }}>{status}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 10, height: 'calc(100% - 54px)', minHeight: 0 }}>
        <section style={cardStyle}>
          <h2 style={{ margin: '0 0 8px', fontSize: 15 }}>Bilans kaloryczny</h2>
          <div style={{ display: 'grid', gap: 7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><Field label="Aktywnosc"><select value={form.jobType || 'sedentary'} onChange={(e) => update('jobType', e.target.value)} style={inputStyle}>{ACTIVITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field><Field label="Cel"><select value={form.goal || 'maintenance'} onChange={(e) => update('goal', e.target.value)} style={inputStyle}>{GOALS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><Field label="Wiek / data urodzenia"><input type="date" value={form.birthDate || ''} onChange={(e) => update('birthDate', e.target.value)} style={inputStyle} /></Field><Field label="Płeć"><select value={form.gender || 'male'} onChange={(e) => update('gender', e.target.value)} style={inputStyle}><option value="male">Mężczyzna</option><option value="female">Kobieta</option></select></Field></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><Field label="Wzrost (cm)"><input type="number" value={form.height || ''} onChange={(e) => update('height', e.target.value)} style={inputStyle} /></Field><Field label="Waga (kg)"><input type="number" value={form.currentWeight || ''} onChange={(e) => update('currentWeight', e.target.value)} style={inputStyle} /></Field></div>
            <div style={{ padding: 9, background: 'var(--color-bg-base)', borderRadius: 8 }}>BMR: <strong>{profile?.bmr || '—'}</strong> kcal · {manualMacrosEnabled && macroCalories ? 'Kcal z makro' : 'Cel obliczony'}: <strong>{target || '—'}</strong> kcal</div>
            {!manualMacrosEnabled && <button type="button" onClick={() => setManualMacrosEnabled(true)} style={buttonStyle}>Dodaj ręczne białko, węgle i tłuszcze</button>}
            {manualMacrosEnabled && <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}><Field label="Białko (g)"><input type="number" min="0" value={form.manualProteinG || ''} onChange={(e) => update('manualProteinG', e.target.value)} style={inputStyle} /></Field><Field label="Węgle (g)"><input type="number" min="0" value={form.manualCarbsG || ''} onChange={(e) => update('manualCarbsG', e.target.value)} style={inputStyle} /></Field><Field label="Tłuszcze (g)"><input type="number" min="0" value={form.manualFatG || ''} onChange={(e) => update('manualFatG', e.target.value)} style={inputStyle} /></Field></div><div style={{ padding: 8, background: 'var(--color-bg-base)', borderRadius: 8 }}>Kcal z ręcznego makro: <strong>{macroCalories || '—'}</strong> kcal</div></>}
            <button onClick={() => saveProfile({}, 'Bilans zapisany.')} disabled={saving} style={buttonStyle}>Zapisz bilans</button>
          </div>
        </section>

        <section style={cardStyle}><h2 style={{ margin: '0 0 16px', fontSize: 17 }}>Parametry treningowe</h2><div style={{ display: 'grid', gap: 14 }}><Field label="Jednostka ciężaru"><select value={form.weightUnit || 'kg'} onChange={(e) => update('weightUnit', e.target.value)} style={inputStyle}><option value="kg">Kilogramy (kg)</option><option value="lbs">Funt (lbs)</option></select></Field><Field label="Domyślny skok ciężaru"><input type="number" min="0" step="0.25" value={form.defaultWeightIncrement || ''} onChange={(e) => update('defaultWeightIncrement', e.target.value)} placeholder="np. 2.5" style={inputStyle} /></Field><Field label="Timer przerw (sekundy)"><input type="number" min="0" step="5" value={form.defaultRestTimerSeconds || ''} onChange={(e) => update('defaultRestTimerSeconds', e.target.value)} placeholder="np. 90" style={inputStyle} /></Field><button onClick={() => saveProfile({}, 'Parametry treningowe zapisane.')} disabled={saving} style={buttonStyle}>Zapisz parametry</button></div></section>

        <section style={cardStyle}><h2 style={{ margin: '0 0 16px', fontSize: 17 }}>Bezpieczeństwo i sesje</h2><div style={{ display: 'grid', gap: 12 }}><Field label="Adres e-mail"><input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} style={inputStyle} /></Field><button onClick={() => saveProfile({}, 'Adres e-mail zapisany.')} disabled={saving} style={buttonStyle}>Zmień adres e-mail</button><hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--color-border-subtle)' }} /><Field label="Aktualne hasło"><input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} style={inputStyle} /></Field><Field label="Nowe hasło"><input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} style={inputStyle} /></Field><button onClick={savePassword} disabled={saving || !passwords.currentPassword || !passwords.newPassword} style={buttonStyle}>Zmień hasło</button><div><strong style={{ fontSize: 13 }}>Aktywne urządzenia</strong>{sessions.length ? sessions.map((session) => <div key={session.sessionId} style={{ marginTop: 8, fontSize: 12 }}>{session.device} · {session.browser} · {session.os}{session.isCurrent ? ' · To urządzenie' : ''}</div>) : <p style={{ margin: '6px 0 0', color: 'var(--color-fg-muted)', fontSize: 12 }}>Brak zarejestrowanych sesji.</p>}</div></div></section>

        <section style={cardStyle}><h2 style={{ margin: '0 0 16px', fontSize: 17 }}>Dane i prywatność</h2><p style={{ color: 'var(--color-fg-muted)', fontSize: 13 }}>Pobierz kopię danych zapisanych w FitnessApp albo usuń konto.</p><div style={{ display: 'grid', gap: 10 }}><button onClick={downloadData} style={buttonStyle}>Pobierz kopię danych JSON</button><button onClick={removeAccount} style={{ ...buttonStyle, background: 'var(--color-error)', color: '#fff' }}>Usuń konto</button></div></section>
      </div>
    </main>
  </div>;
}

export default AccountSettingsPage;
