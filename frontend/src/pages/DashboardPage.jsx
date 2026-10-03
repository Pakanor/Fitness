import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import BodyMeasurementForm from '../features/measurements/BodyMeasurementForm';
import { useAuth } from '../context/AuthContext';
import { getExercisesByDate } from '../api/exerciseAPI';
import { getRecentLogs } from '../api/productAPI';
import '../styles/tokens.css';

const JOB_PAL = {
  sedentary: 1.2,
  light_active: 1.375,
  moderate_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const CATEGORY_LABELS = {
  legs: 'Dzień nóg',
  chest: 'Dzień klatki',
  back: 'Dzień pleców',
  shoulders: 'Dzień barków',
  arms: 'Dzień ramion',
  core: 'Dzień core',
  cardio: 'Dzień cardio',
};

const WEEKDAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getWeekDates = () => {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const computeTdee = (profile) => {
  const bmr = profile?.bmr || 0;
  const pal = JOB_PAL[profile?.jobType] || 1.2;
  let tdee = Math.round(bmr * pal);
  if (profile?.goal === 'loss') tdee = Math.round(tdee * 0.8);
  if (profile?.goal === 'gain') tdee = Math.round(tdee * 1.1);
  return tdee;
};

const computeMacros = (tdee, goal) => {
  if (!tdee) return { protein: 0, carbs: 0, fat: 0 };
  if (goal === 'loss') {
    return {
      protein: Math.round((tdee * 0.35) / 4),
      carbs: Math.round((tdee * 0.35) / 4),
      fat: Math.round((tdee * 0.30) / 9),
    };
  }
  if (goal === 'gain') {
    return {
      protein: Math.round((tdee * 0.25) / 4),
      carbs: Math.round((tdee * 0.50) / 4),
      fat: Math.round((tdee * 0.25) / 9),
    };
  }
  return {
    protein: Math.round((tdee * 0.30) / 4),
    carbs: Math.round((tdee * 0.45) / 4),
    fat: Math.round((tdee * 0.25) / 9),
  };
};

const getTodayLabel = (exercises) => {
  if (!exercises.length) return null;
  const counts = {};
  exercises.forEach((e) => {
    const c = (e.category || e.primaryMuscles || 'default').toLowerCase();
    counts[c] = (counts[c] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return CATEGORY_LABELS[top] || 'Trening siłowy';
};

const computeVolume = (exercises) =>
  exercises.reduce((sum, e) => {
    if (e.sets != null && e.reps != null && e.weight != null) {
      return sum + e.sets * e.reps * e.weight;
    }
    return sum;
  }, 0);

const computeStreak = (activeDates) => {
  const set = new Set(activeDates);
  let streak = 0;
  const d = new Date();
  if (!set.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(toDateStr(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
};

const DashboardStyles = `
  .db-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-base);
  }

  .db-main {
    flex: 1;
  }

  .db-container {
    max-width: var(--container-wide);
    margin: 0 auto;
    padding: var(--space-5) var(--space-4) var(--space-10);
    width: 100%;
  }

  .db-greeting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  .db-title {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-fg-primary);
    line-height: 1.2;
  }

  .db-date {
    font-size: 13px;
    color: var(--color-fg-muted);
    margin-top: 2px;
  }

  .db-streak-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-accent);
    background: var(--color-accent-dim);
    border: 1px solid rgba(252, 76, 2, 0.25);
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-4);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .db-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-4);
    align-items: start;
  }

  .db-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    padding: var(--space-5);
  }

  .db-card-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-fg-primary);
    margin-bottom: var(--space-4);
  }

  .db-kcal-current {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
  }

  .db-kcal-target {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-fg-muted);
  }

  .db-progress {
    height: 8px;
    background: var(--color-border-subtle);
    border-radius: var(--radius-pill);
    overflow: hidden;
    margin: var(--space-3) 0 var(--space-4);
  }

  .db-progress-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: var(--radius-pill);
    transition: width 0.5s ease;
  }

  .db-progress-fill.over {
    background: var(--color-warn);
  }

  .db-macro {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  .db-macro:last-child {
    margin-bottom: 0;
  }

  .db-macro-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-fg-muted);
    width: 104px;
    flex-shrink: 0;
  }

  .db-macro-bar {
    flex: 1;
    height: 6px;
    background: var(--color-border-subtle);
    border-radius: var(--radius-pill);
    overflow: hidden;
  }

  .db-macro-fill {
    height: 100%;
    background: var(--color-accent);
    border-radius: var(--radius-pill);
    transition: width 0.5s ease;
  }

  .db-macro-value {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--color-fg-secondary);
    width: 84px;
    text-align: right;
    flex-shrink: 0;
  }

  .db-divider {
    height: 1px;
    background: var(--color-border-subtle);
    border: none;
    margin: var(--space-5) 0;
  }

  .db-status {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .db-status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }

  .db-status-dot.idle {
    background: var(--color-fg-disabled);
  }

  .db-status-text {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-fg-primary);
  }

  .db-status-sub {
    font-size: 12px;
    color: var(--color-fg-muted);
    margin-top: 2px;
  }

  .db-recent-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .db-recent-row {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base);
    text-decoration: none;
    color: inherit;
  }

  .db-recent-row:hover {
    border-color: var(--color-border-default);
    background: var(--color-bg-elevated);
  }

  .db-recent-date {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-fg-primary);
    width: 86px;
    flex-shrink: 0;
  }

  .db-recent-names {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .db-recent-chip {
    font-size: 11px;
    color: var(--color-accent);
    background: var(--color-accent-dim);
    border-radius: var(--radius-pill);
    padding: 2px 8px;
    white-space: nowrap;
  }

  .db-recent-more {
    font-size: 11px;
    color: var(--color-fg-muted);
    white-space: nowrap;
  }

  .db-recent-volume {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-fg-secondary);
    text-align: right;
    flex-shrink: 0;
  }

  .db-recent-rank {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-accent-dim);
    border: 1px solid rgba(252, 76, 2, 0.25);
    color: var(--color-accent);
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .db-side {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .db-week {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .db-week-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }

  .db-week-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--color-border-default);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-fg-muted);
    background: transparent;
  }

  .db-week-dot.done {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg-deep);
  }

  .db-week-dot.today {
    box-shadow: 0 0 0 3px var(--color-accent-dim);
  }

  .db-week-dot.future {
    border-color: var(--color-border-subtle);
    color: var(--color-fg-disabled);
  }

  .db-week-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-fg-muted);
  }

  .db-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .db-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
    text-decoration: none;
  }

  .db-action:active {
    transform: scale(0.98);
  }

  .db-action--primary {
    background: var(--color-accent);
    color: var(--color-bg-deep);
  }

  .db-action--primary:hover {
    background: var(--color-accent-hover);
    box-shadow: 0 4px 16px rgba(252, 76, 2, 0.2);
  }

  .db-action--secondary {
    background: var(--color-bg-input);
    color: var(--color-fg-primary);
    border: 1px solid var(--color-border-subtle);
  }

  .db-action--secondary:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-default);
  }

  .db-empty {
    font-size: 13px;
    color: var(--color-fg-muted);
    line-height: 1.5;
  }

  .db-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) 0;
  }

  .db-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border-subtle);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: db-spin 0.7s linear infinite;
  }

  @keyframes db-spin {
    to { transform: rotate(360deg); }
  }

  .db-measurements-required {
    max-width: var(--container-narrow);
    margin: var(--space-8) auto 0;
  }

  .db-measurements-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-xl);
    overflow: hidden;
  }

  .db-measurements-header {
    background: var(--color-bg-elevated);
    border-bottom: 1px solid var(--color-border-subtle);
    padding: var(--space-5) var(--space-6);
  }

  .db-measurements-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 700;
    color: var(--color-fg-primary);
    margin-bottom: var(--space-1);
  }

  .db-measurements-description {
    font-size: 13px;
    color: var(--color-fg-secondary);
    line-height: 1.5;
  }

  .db-measurements-form-wrapper {
    padding: var(--space-6);
  }

  @media (max-width: 900px) {
    .db-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .db-greeting {
      flex-direction: column;
      align-items: flex-start;
    }

    .db-streak-pill {
      align-self: flex-start;
    }

    .db-recent-row {
      flex-wrap: wrap;
    }

    .db-recent-date {
      width: auto;
    }
  }
`;

function MacroBar({ label, current, target }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="db-macro">
      <span className="db-macro-label">{label}</span>
      <div className="db-macro-bar">
        <div className="db-macro-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="db-macro-value">
        {current.toFixed(0)} / {target.toFixed(0)} g
      </span>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasMeasurements, refreshMeasurementStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [totals, setTotals] = useState(null);
  const [todayExercises, setTodayExercises] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const todayStr = toDateStr(new Date());
        const pastDays = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return toDateStr(d);
        });

        const [profileRes, logsRes, todayEx, weekEx, pastEx, recordsRes] = await Promise.all([
          fetch('http://localhost:8000/api/user/profile', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
          getRecentLogs(todayStr).catch(() => ({ logs: [], totals: null })),
          getExercisesByDate(todayStr).catch(() => []),
          Promise.all(getWeekDates().map((d) => getExercisesByDate(toDateStr(d)).catch(() => []))),
          Promise.all(pastDays.map((ds) => getExercisesByDate(ds).catch(() => []))),
          fetch('http://localhost:8000/api/records/history', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

        if (cancelled) return;

        setProfile(profileRes);
        setTotals(logsRes?.totals || null);
        setTodayExercises(todayEx || []);
        setWeekData(weekEx);

        const activeDays = pastDays
          .map((ds, i) => ({ date: ds, exercises: pastEx[i] || [] }))
          .filter((x) => x.exercises.length > 0);
        setRecentWorkouts(activeDays.slice(0, 3));
        setPersonalRecords(Array.isArray(recordsRes) ? recordsRes.slice(0, 3) : []);
        setStreak(computeStreak(activeDays.map((x) => x.date)));
      } catch (e) {
        console.error('Błąd pobierania podsumowania:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const todayStr = toDateStr(new Date());
  const tdee = useMemo(() => computeTdee(profile), [profile]);
  const macros = useMemo(() => computeMacros(tdee, profile?.goal), [tdee, profile?.goal]);

  const consumed = totals?.energy || 0;
  const kcalPct = tdee > 0 ? Math.min(100, (consumed / tdee) * 100) : 0;
  const kcalOver = tdee > 0 && consumed > tdee;

  const todayLabel = getTodayLabel(todayExercises);
  const parsedToday = new Date();
  const dayName = parsedToday.toLocaleDateString('pl-PL', { weekday: 'long' });
  const dateStr = parsedToday.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const todayIdx = (new Date().getDay() + 6) % 7;
  const firstName = user?.username || '';
  const weekDates = useMemo(() => getWeekDates(), []);

  if (!hasMeasurements) {
    return (
      <>
        <style>{DashboardStyles}</style>
        <div className="db-page">
          <Header />
          <main className="db-main" role="main">
            <div className="db-container">
              <div className="db-greeting">
                <div>
                  <h1 className="db-title">Uzupełnij pomiary, by spersonalizować <span style={{ color: 'var(--color-accent)' }}>FitnessApp</span></h1>
                  <p className="db-date">
                    Potrzebujemy wagi, wzrostu, wieku i celu, aby obliczyć zapotrzebowanie kaloryczne i przygotować plan treningowy.
                  </p>
                </div>
              </div>
              <div className="db-measurements-required">
                <div className="db-measurements-card">
                  <div className="db-measurements-header">
                    <div className="db-measurements-title">Pomiary ciała</div>
                    <p className="db-measurements-description">
                      Wypełnij poniższe dane. Wymagane pola są oznaczone gwiazdką. Pozostałe pomiary są opcjonalne — możesz je dodać później.
                    </p>
                  </div>
                  <div className="db-measurements-form-wrapper">
                    <BodyMeasurementForm
                      onSave={async () => { await refreshMeasurementStatus(); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{DashboardStyles}</style>
      <div className="db-page">
        <Header />
        <main className="db-main" role="main">
          <div className="db-container">
            <div className="db-greeting">
              <div>
                <h1 className="db-title">Witaj{firstName ? `, ${firstName}` : ''}</h1>
                <p className="db-date">
                  {dayName}, {dateStr}
                </p>
              </div>
              {streak > 0 && (
                <div className="db-streak-pill" title="Dni z rzędu z treningiem">
                  🔥 {streak} {streak === 1 ? 'dzień' : 'dni'} z rzędu
                </div>
              )}
            </div>

            {loading ? (
              <div className="db-loading">
                <div className="db-spinner" aria-label="Ładowanie podsumowania" />
              </div>
            ) : (
              <div className="db-grid">
                <section className="db-card" aria-labelledby="db-summary-title">
                  <h2 className="db-card-title" id="db-summary-title">Podsumowanie dzisiejszego dnia</h2>

                  <div className="db-kcal-current">
                    {consumed.toFixed(0)}
                    <span className="db-kcal-target"> / {tdee} kcal</span>
                  </div>
                  <div
                    className="db-progress"
                    role="progressbar"
                    aria-valuenow={Math.round(kcalPct)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label="Postęp kaloryczny"
                  >
                    <div className={`db-progress-fill ${kcalOver ? 'over' : ''}`} style={{ width: `${kcalPct}%` }} />
                  </div>

                  <MacroBar label="Białko" current={totals?.proteins || 0} target={macros.protein} />
                  <MacroBar label="Węglowodany" current={totals?.sugars || 0} target={macros.carbs} />
                  <MacroBar label="Tłuszcz" current={totals?.fat || 0} target={macros.fat} />

                  <hr className="db-divider" />

                  <div className="db-status">
                    <span className={`db-status-dot ${todayLabel ? '' : 'idle'}`} aria-hidden="true" />
                    <div>
                      <div className="db-status-text">
                        {todayLabel
                          ? `Dzisiaj: ${todayLabel}`
                          : 'Brak zaplanowanego treningu'}
                      </div>
                      <div className="db-status-sub">
                        {todayLabel
                          ? `${todayExercises.length} ${todayExercises.length === 1 ? 'ćwiczenie' : todayExercises.length < 5 ? 'ćwiczenia' : 'ćwiczeń'} zapisanych dziś`
                          : 'Zaloguj trening, aby zobaczyć go tutaj'}
                      </div>
                    </div>
                  </div>

                  <hr className="db-divider" />

                  <h3 className="db-card-title" style={{ fontSize: 14 }}>Ostatnie treningi</h3>
                  {recentWorkouts.length === 0 ? (
                    <p className="db-empty">Brak zapisanych treningów w ciągu ostatnich 14 dni.</p>
                  ) : (
                    <div className="db-recent-list">
                      {recentWorkouts.map((day) => {
                        const parsed = new Date(day.date + 'T12:00:00');
                        const label = parsed.toLocaleDateString('pl-PL', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        });
                        const unique = [
                          ...new Map(day.exercises.map((e) => [e.exerciseId, e])).values(),
                        ];
                        const shown = unique.slice(0, 3);
                        const extra = unique.length - shown.length;
                        const volume = computeVolume(day.exercises);
                        return (
                          <a
                            key={day.date}
                            className="db-recent-row"
                            href={`/exercise-start?date=${day.date}`}
                            onClick={(e) => { e.preventDefault(); navigate(`/exercise-start?date=${day.date}`); }}
                          >
                            <span className="db-recent-date">{label}</span>
                            <span className="db-recent-names">
                              {shown.map((e) => (
                                <span key={e.exerciseId} className="db-recent-chip">{e.name}</span>
                              ))}
                              {extra > 0 && <span className="db-recent-more">+{extra}</span>}
                            </span>
                            <span className="db-recent-volume">
                              {volume > 0 ? `${volume.toLocaleString('pl-PL')} kg` : `${day.exercises.length} ${day.exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}`}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}

                  <hr className="db-divider" />

                  <h3 className="db-card-title" style={{ fontSize: 14 }}>Twoje rekordy życiowe</h3>
                  {personalRecords.length === 0 ? (
                    <p className="db-empty">Brak zarejestrowanych rekordów.</p>
                  ) : (
                    <div className="db-recent-list">
                      {personalRecords.map((pr, i) => (
                        <div key={pr.id} className="db-recent-row" style={{ cursor: 'default' }}>
                          <span className="db-recent-rank">{i + 1}</span>
                          <span className="db-recent-names">
                            <span className="db-recent-chip">{pr.exerciseName}</span>
                          </span>
                          <span className="db-recent-volume">
                            {pr.weight} kg × {pr.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <aside className="db-side">
                  <div className="db-card">
                    <h3 className="db-card-title" style={{ fontSize: 14 }}>Ten tydzień</h3>
                    <div className="db-week">
                      {WEEKDAY_SHORT.map((label, i) => {
                        const dayDate = weekDates[i];
                        const isToday = toDateStr(dayDate) === todayStr;
                        const isFuture = toDateStr(dayDate) > todayStr;
                        const done = weekData[i]?.length > 0;
                        const cls = `db-week-dot ${done ? 'done' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`;
                        return (
                          <div key={label} className="db-week-day">
                            <div className={cls} title={`${label}: ${done ? 'trening wykonany' : isFuture ? 'przed nami' : 'brak treningu'}`}>
                              {done ? '✓' : ''}
                            </div>
                            <span className="db-week-label">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="db-card">
                    <h3 className="db-card-title" style={{ fontSize: 14 }}>Szybkie akcje</h3>
                    <div className="db-actions">
                      <button className="db-action db-action--primary" onClick={() => navigate('/exercise-start')}>
                        ▶ Rozpocznij trening
                      </button>
                      <button className="db-action db-action--secondary" onClick={() => navigate('/calorie-tracker')}>
                        ＋ Dodaj posiłek
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default DashboardPage;