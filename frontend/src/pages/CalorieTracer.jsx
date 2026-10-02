import { useEffect, useState, useCallback, useMemo } from 'react';
import ProductItem from '../features/calories/ProductItem';
import ProductForm from '../features/calories/ProductForm';
import { getRecentLogs, deleteProductLog } from '../api/productAPI';
import { getExercisesByDate } from '../api/exerciseAPI';
import TotalsSummary from '../features/calories/TotalsSummary';
import { toast } from '../components/common/Toast';
import Header from '../components/layout/Header';
import { fetchMe } from '../api/authAPI';

const JOB_TYPES = [
  { value: 'sedentary', pal: 1.2 },
  { value: 'light_active', pal: 1.375 },
  { value: 'moderate_active', pal: 1.55 },
  { value: 'very_active', pal: 1.725 },
  { value: 'extra_active', pal: 1.9 },
];

const CalorieTracer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [totals, setTotals] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isTrainingDay, setIsTrainingDay] = useState(false);
  const [workoutStatus, setWorkoutStatus] = useState(null);
  const [carbDecision, setCarbDecision] = useState(null);
  // 'suggested' | 'confirmed' | 'dismissed' for each peri meal
  const [periStatus, setPeriStatus] = useState({ pre: 'suggested', post: 'suggested' });

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  useEffect(() => {
    (async () => {
      try {
        await fetchMe();
        const res = await fetch('http://localhost:8000/api/user/profile', { credentials: 'include' });
        if (res.ok) setProfile(await res.json());
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const fetchWorkoutStatus = async () => {
      if (!isToday) {
        setWorkoutStatus(null);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/workout-status?date=${selectedDate}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setWorkoutStatus(data.status);
        }
      } catch (e) {
        console.error('Error fetching workout status:', e);
      }
    };

    fetchWorkoutStatus();

    const interval = setInterval(fetchWorkoutStatus, 30000);

    return () => clearInterval(interval);
  }, [selectedDate, isToday]);

  useEffect(() => {
    if (!isToday) { setIsTrainingDay(false); return; }
    getExercisesByDate(selectedDate)
      .then(data => setIsTrainingDay(Array.isArray(data) && data.length > 0))
      .catch(() => setIsTrainingDay(false));
  }, [selectedDate, isToday]);

  // Dynamic post-workout carb decision (1.0 or 1.4 g/kg) from workload + ACWR.
  useEffect(() => {
    if (!isTrainingDay || !isToday || !profile?.currentWeight) {
      setCarbDecision(null);
      return;
    }
    const fetchDecision = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/workload-nutrition/carbs?bodyWeight=${profile.currentWeight}&date=${selectedDate}`, { credentials: 'include' });
        if (res.ok) setCarbDecision(await res.json());
      } catch { setCarbDecision(null); }
    };
    fetchDecision();
  }, [isTrainingDay, isToday, profile?.currentWeight, selectedDate]);

  const pal = JOB_TYPES.find(j => j.value === profile?.jobType)?.pal || 1.2;
  const baseBmr = profile?.bmr || 0;
  const baseTdee = baseBmr ? Math.round(baseBmr * pal) : 0;
  const goal = profile?.goal || 'maintenance';

  const localTdee = useMemo(() => {
    if (!baseTdee) return 0;
    if (goal === 'loss') return Math.round(baseTdee * 0.8);
    if (goal === 'gain') return Math.round(baseTdee * 1.1);
    return baseTdee;
  }, [baseTdee, goal]);

  const bodyWeight = profile?.currentWeight || 70;

  const macros = useMemo(() => {
    if (!localTdee) return { protein: 0, carbs: 0, fat: 0 };
    if (goal === 'loss') {
      return {
        protein: Math.round((localTdee * 0.35) / 4),
        carbs: Math.round((localTdee * 0.35) / 4),
        fat: Math.round((localTdee * 0.30) / 9),
      };
    }
    if (goal === 'gain') {
      return {
        protein: Math.round((localTdee * 0.25) / 4),
        carbs: Math.round((localTdee * 0.50) / 4),
        fat: Math.round((localTdee * 0.25) / 9),
      };
    }
    if (isTrainingDay) {
      return {
        protein: Math.round((localTdee * 0.30) / 4),
        carbs: Math.round((localTdee * 0.45) / 4),
        fat: Math.round((localTdee * 0.25) / 9),
      };
    }
    return {
      protein: Math.round((localTdee * 0.30) / 4),
      carbs: Math.round((localTdee * 0.36) / 4),
      fat: Math.round((localTdee * 0.34) / 9),
    };
  }, [localTdee, isTrainingDay, goal]);

  // Post-workout carbs scaled by workout intensity (1.0 vs 1.4 g/kg).
  const postCarbs = useMemo(() => {
    if (carbDecision?.recommendedCarbs) return Math.round(carbDecision.recommendedCarbs);
    return Math.round(bodyWeight * 1.0);
  }, [carbDecision, bodyWeight]);

  const isHeavy = !!carbDecision?.isHeavyWorkout;

  // Proportional redistribution: when the post-workout dose is raised to 1.4 g/kg,
  // the surplus (0.4 g/kg) is subtracted from the other peri meal (pre-workout)
  // so the daily total stays constant. Clamped at 0.
  const preCarbs = useMemo(() => {
    const baseline = Math.round(bodyWeight * 1.0);
    const surplus = isHeavy ? Math.round(bodyWeight * 0.4) : 0;
    return Math.max(0, baseline - surplus);
  }, [isHeavy, bodyWeight]);

  const isWorkoutActive = workoutStatus === 'Active';

  const periMeals = useMemo(() => {
    if (!isTrainingDay || !isToday) return [];

    const meals = [];

    if (!isWorkoutActive && periStatus.pre !== 'dismissed') {
      meals.push({
        id: '__pre_workout__',
        key: 'pre',
        productName: '🥗 Posiłek przedtreningowy',
        brands: 'Peri-workout',
        energy: preCarbs * 4 + Math.round(bodyWeight * 0.3) * 4 + Math.round(bodyWeight * 0.1) * 9,
        proteins: Math.round(bodyWeight * 0.3),
        fat: Math.round(bodyWeight * 0.1),
        sugars: preCarbs,
        status: periStatus.pre,
      });
    }

    if (periStatus.post !== 'dismissed') {
      meals.push({
        id: '__post_workout__',
        key: 'post',
        productName: '💪 Posiłek potreningowy',
        brands: 'Peri-workout',
        energy: postCarbs * 4 + Math.round(bodyWeight * 0.4) * 4 + Math.round(bodyWeight * 0.05) * 9,
        proteins: Math.round(bodyWeight * 0.4),
        fat: Math.round(bodyWeight * 0.05),
        sugars: postCarbs,
        status: periStatus.post,
        heavy: isHeavy,
      });
    }

    return meals;
  }, [isTrainingDay, isToday, isWorkoutActive, periStatus, preCarbs, postCarbs, isHeavy, bodyWeight]);

  // Only CONFIRMED peri meals count toward the daily balance.
  const confirmedPeri = useMemo(
    () => periMeals.filter(m => m.status === 'confirmed'),
    [periMeals]
  );

  const adjustedTotals = useMemo(() => {
    const base = totals || { energy: 0, proteins: 0, fat: 0, sugars: 0 };
    return {
      energy: base.energy + confirmedPeri.reduce((s, m) => s + m.energy, 0),
      proteins: base.proteins + confirmedPeri.reduce((s, m) => s + m.proteins, 0),
      fat: base.fat + confirmedPeri.reduce((s, m) => s + m.fat, 0),
      sugars: base.sugars + confirmedPeri.reduce((s, m) => s + m.sugars, 0),
    };
  }, [totals, confirmedPeri]);

  const fetchLogs = useCallback(async (date) => {
    setLoading(true);
    try {
      const data = await getRecentLogs(date);
      if (Array.isArray(data)) {
        setLogs([...data]);
        if (data.length > 0) {
          const t = data.reduce(
            (acc, log) => ({
              energy: acc.energy + (log.energy || 0),
              proteins: acc.proteins + (log.proteins || 0),
              fat: acc.fat + (log.fat || 0),
              sugars: acc.sugars + (log.sugars || 0),
            }),
            { energy: 0, proteins: 0, fat: 0, sugars: 0 }
          );
          setTotals(t);
        } else {
          setTotals(null);
        }
      } else if (data && Array.isArray(data.logs)) {
        setLogs([...data.logs]);
        setTotals(data.totals || null);
      } else {
        setLogs([]);
        setTotals(null);
      }
    } catch (err) {
      console.error('Błąd pobierania:', err);
      setLogs([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate]);

  const handleDelete = async (id) => {
    try {
      await deleteProductLog(id);
      toast('Usunięto produkt.');
      fetchLogs(selectedDate);
    } catch (err) {
      console.error(err);
      toast('Nie udało się usunąć produktu.');
    }
  };

  const confirmPeri = (key) => setPeriStatus(s => ({ ...s, [key]: 'confirmed' }));
  const dismissPeri = (key) => setPeriStatus(s => ({ ...s, [key]: 'dismissed' }));
  const removePeri = (key) => setPeriStatus(s => ({ ...s, [key]: 'suggested' }));

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #1e1e22', borderTopColor: '#c8f542', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ height: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0d0d0f' }}>
      <Header />
      {isTrainingDay && isToday && (
        <div style={{ padding: '8px 16px', background: 'rgba(200,245,66,0.06)', borderBottom: '1px solid rgba(200,245,66,0.15)', fontSize: 12, color: '#c8f542', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Dzień treningowy</span>
          <span style={{ color: '#888' }}>— Wykryto trening. Poniżej propozycje posiłków przed/po treningu.</span>
        </div>
      )}
      {isToday && !isTrainingDay && localTdee > 0 && (
        <div style={{ padding: '8px 16px', background: 'rgba(96,165,250,0.06)', borderBottom: '1px solid rgba(96,165,250,0.15)', fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700 }}>Dzień odpoczynku</span>
          <span style={{ color: '#888' }}>— Węgle −20%, tłuszcze +20%</span>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 16px' }}>
        {periMeals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 0' }}>
            {periMeals.map(meal => {
              const confirmed = meal.status === 'confirmed';
              return (
                <div
                  key={meal.id}
                  style={{
                    background: confirmed ? '#16161a' : 'rgba(22,22,26,0.55)',
                    border: `1px solid ${confirmed ? '#c8f542' : '#1e1e22'}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    opacity: confirmed ? 1 : 0.85,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: confirmed ? '#c8f542' : '#6b6b72', marginBottom: 2 }}>
                      {confirmed ? 'Zatwierdzony posiłek' : 'Sugerowany posiłek'}
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: '#f0ede8' }}>
                      {meal.productName}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {meal.sugars} g węglowodanów
                      {meal.heavy && ' · podwyższona dawka (ciężki trening)'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {confirmed ? (
                      <button
                        onClick={() => removePeri(meal.key)}
                        title="Cofnij"
                        style={{ background: 'none', border: '1px solid #2a2a30', color: '#aaa', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}
                      >
                        Cofnij
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => confirmPeri(meal.key)}
                          title="Dodaj do dzisiejszego jadłospisu"
                          style={{ background: '#c8f542', border: 'none', color: '#0d0d0f', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          ✓ Dodaj
                        </button>
                        <button
                          onClick={() => dismissPeri(meal.key)}
                          title="Odrzuć"
                          style={{ background: 'none', border: '1px solid #2a2a30', color: '#ff8a80', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}
                        >
                          ✕ Odrzuć
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {showAddForm ? (
            <ProductForm
              mode="add"
              onSuccess={() => { fetchLogs(selectedDate); setShowAddForm(false); }}
            />
          ) : (
            <ProductItem
              logs={logs}
              onDelete={handleDelete}
              onProductUpdated={() => fetchLogs(selectedDate)}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}
        </div>
      </div>
      <TotalsSummary totals={adjustedTotals} tdee={localTdee} macros={macros} />
    </div>
  );
};

export default CalorieTracer;
