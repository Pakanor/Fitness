import { useEffect, useState, useCallback, useMemo } from 'react';
import ProductItem from '../features/calories/ProductItem';
import ProductForm from '../features/calories/ProductForm';
import { getRecentLogs, deleteProductLog } from '../api/productAPI';
import TotalsSummary from '../features/calories/TotalsSummary';
import { toast } from '../components/common/Toast';
import Header from '../components/layout/Header';

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:8000/api/user/profile', { credentials: 'include' });
        if (res.ok) setProfile(await res.json());
      } catch { }
    })();
  }, []);

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
    return {
      protein: Math.round((localTdee * 0.30) / 4),
      carbs: Math.round((localTdee * 0.45) / 4),
      fat: Math.round((localTdee * 0.25) / 9),
    };
  }, [localTdee, goal]);

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

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--color-border-subtle)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ height: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg-base)' }}>
      <Header />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 16px 100px' }}>
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
      <TotalsSummary totals={totals} tdee={localTdee} macros={macros} />
    </div>
  );
};

export default CalorieTracer;