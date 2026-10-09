import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { addUserExercise, getExerciseCategory, getExercisesByBodyPart } from "../../api/exerciseAPI";
import { workoutAPI } from "../../api/workoutAPI";
import { toast } from "../../components/common/Toast";

export default function AddExerciseModal({
  open,
  onClose,
  onAdded,
  defaultDate,
  initialExercise = null,
  initialEntry = null,
  sessionId = null,
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [setCount, setSetCount] = useState("");
  const [setRows, setSetRows] = useState([]);
  const [isWarmup, setIsWarmup] = useState(false);
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const isSessionLog = Boolean(sessionId) && Boolean(initialExercise);

  const initSetRows = (count, initialData = null) => {
    const rows = [];
    for (let i = 1; i <= count; i++) {
      if (initialData && initialData.Sets && initialData.Sets[i - 1]) {
        const s = initialData.Sets[i - 1];
        rows.push({
          setNumber: i,
          weight: s.Weight != null ? String(s.Weight) : "",
          reps: s.Reps != null ? String(s.Reps) : "",
          rpe: s.RPE != null ? String(s.RPE) : "",
          isWarmup: s.IsWarmup || false,
        });
      } else {
        rows.push({
          setNumber: i,
          weight: "",
          reps: "",
          rpe: "",
          isWarmup: false,
        });
      }
    }
    setSetRows(rows);
  };

  useEffect(() => {
    if (!open) return;

    setSelectedExercise(initialExercise ?? null);
    setSelectedCategory(initialExercise?.category ?? null);
    setStep(initialExercise ? 2 : 0);
    setSearch("");
    setIsWarmup(initialEntry?.isWarmup === true);
    setDate(defaultDate || new Date().toISOString().slice(0, 10));

    if (initialEntry?.Sets?.length) {
      setSetCount(String(initialEntry.Sets.length));
      initSetRows(initialEntry.Sets.length, initialEntry);
    } else if (initialEntry?.sets != null) {
      setSetCount(String(initialEntry.sets));
      initSetRows(initialEntry.sets);
    } else {
      setSetCount("");
      setSetRows([]);
    }
  }, [open, initialExercise, initialEntry, defaultDate]);

  useEffect(() => {
    if (!open || isSessionLog) return;
    setCatLoading(true);
    getExerciseCategory().then(setCategories).catch(console.error).finally(() => setCatLoading(false));
  }, [open, isSessionLog]);

  useEffect(() => {
    if (!selectedCategory || isSessionLog) return;
    setExLoading(true); setExercises([]);
    getExercisesByBodyPart(selectedCategory).then(setExercises).catch(console.error).finally(() => setExLoading(false));
  }, [selectedCategory, isSessionLog]);

  const handleSelectCategory = (cat) => { setSelectedCategory(cat); setStep(1); };
  const handleSelectExercise = (ex) => { setSelectedExercise(ex); setStep(2); };
  const handleBack = () => {
    if (step === 1) { setStep(0); setSelectedExercise(null); setSearch(""); }
    if (step === 2) { setStep(1); }
  };

  const handleSetCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setSetCount(e.target.value);
    if (count > 0 && count <= 50) {
      initSetRows(count);
    } else {
      setSetRows([]);
    }
  };

  const updateSetRow = (index, field, value) => {
    setSetRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const fillAllFromFirst = () => {
    if (setRows.length === 0) return;
    const first = setRows[0];
    const filled = setRows.map((row, i) => i === 0 ? row : { ...row, weight: first.weight, reps: first.reps, rpe: first.rpe });
    setSetRows(filled);
  };

  const handleSubmit = async () => {
    if (!user?.id) { toast("Brak UserId w tokenie!", "error"); return; }

    const setsToSend = setRows
      .filter(row => row.weight !== "" || row.reps !== "" || row.rpe !== "")
      .map((row, idx) => ({
        setNumber: idx + 1,
        weight: row.weight ? parseFloat(row.weight) : 0,
        reps: row.reps ? parseInt(row.reps) : 0,
        rpe: row.rpe ? parseFloat(row.rpe) : null,
        isWarmup: row.isWarmup,
      }));

    if (setsToSend.length === 0) {
      toast("Wypełnij co najmniej jedną serię", "error");
      return;
    }

    for (const s of setsToSend) {
      if (s.rpe !== null && (s.rpe < 1 || s.rpe > 10)) {
        toast("RPE musi być w zakresie 1-10", "error"); return;
      }
    }

    setLoading(true);
    try {
      if (sessionId) {
        await workoutAPI.logSet({
          sessionId,
          userExerciseId: initialEntry?.userExerciseId ?? null,
          exerciseId: selectedExercise.id,
          Sets: setsToSend,
        });
        toast("Zapisano serie w treningu.");
      } else {
        await addUserExercise({
          userId: user.id,
          exerciseId: selectedExercise.id,
          Sets: setsToSend,
          date,
        });
        toast("Ćwiczenie dodane!");
      }

      onAdded?.(); onClose();
    } catch (err) {
      console.error(err);
      toast(err.message || "Błąd podczas dodawania ćwiczenia.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));
  const stepLabel = isSessionLog
    ? `Zapisz serie: ${selectedExercise?.name ?? ""}`
    : ["Wybierz kategorię", "Wybierz ćwiczenie", `Dodaj: ${selectedExercise?.name ?? ""}`];

  if (!open) return null;

  return (
    <>
      <style>{`
        .aem-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .aem-dialog { background: var(--color-bg-card); border: 1px solid var(--color-border-subtle); border-radius: 16px; width: 520px; max-width: 100%; min-height: 420px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
        .aem-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--color-border-subtle); }
        .aem-back { background: none; border: none; color: var(--color-fg-muted); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .aem-back:hover { color: var(--color-fg-primary); background: var(--color-border-subtle); }
        .aem-header-text { flex: 1; }
        .aem-step-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-fg-muted); margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .aem-step-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--color-fg-primary); text-transform: capitalize; }
        .aem-close { background: none; border: none; color: var(--color-fg-muted); font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .aem-close:hover { color: var(--color-fg-primary); background: var(--color-border-subtle); }
        .aem-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .aem-spinner { display: flex; justify-content: center; padding: 32px 0; }
        .aem-spin { width: 24px; height: 24px; border: 2px solid var(--color-border-subtle); border-top-color: var(--color-accent); border-radius: 50%; animation: aem-spin 0.7s linear infinite; }
        @keyframes aem-spin { to { transform: rotate(360deg); } }
        .aem-cats { display: flex; flex-wrap: wrap; gap: 8px; }
        .aem-cat { padding: 8px 16px; border: 1px solid var(--color-border-default); border-radius: 8px; background: none; color: var(--color-fg-secondary); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; text-transform: capitalize; transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .aem-cat:hover { border-color: var(--color-accent); color: var(--color-accent); background: rgba(252,76,2,0.06); }
        .aem-search { width: 100%; padding: 10px 14px; background: var(--color-bg-base); border: 1px solid var(--color-border-default); border-radius: 10px; color: var(--color-fg-primary); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: border-color 0.15s; }
        .aem-search::placeholder { color: var(--color-fg-muted); }
        .aem-search:focus { border-color: var(--color-accent); }
        .aem-ex-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
        .aem-ex-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--color-border-subtle); border-radius: 10px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .aem-ex-item:hover { background: var(--color-border-subtle); border-color: var(--color-border-default); }
        .aem-ex-gif { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: var(--color-border-subtle); flex-shrink: 0; }
        .aem-ex-name { font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--color-fg-primary); text-transform: capitalize; }
        .aem-empty { text-align: center; padding: 32px; color: var(--color-fg-muted); font-size: 14px; font-family: 'DM Sans', sans-serif; }
        .aem-gif-preview { display: flex; justify-content: center; margin-bottom: 16px; }
        .aem-gif-preview img { width: 220px; height: 220px; border-radius: 12px; object-fit: cover; }
        .aem-field { margin-bottom: 12px; }
        .aem-hint { display: block; margin-top: 6px; font-size: 11px; color: var(--color-fg-muted); font-family: 'DM Sans', sans-serif; }
        .aem-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--color-fg-muted); margin-bottom: 6px; font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .aem-input { width: 100%; padding: 10px 14px; background: var(--color-bg-base); border: 1px solid var(--color-border-default); border-radius: 10px; color: var(--color-fg-primary); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.15s; colorScheme: dark; }
        .aem-input:focus { border-color: var(--color-accent); }
        .aem-footer { padding: 16px 20px; border-top: 1px solid var(--color-border-subtle); display: flex; justify-content: flex-end; gap: 8px; }
        .aem-btn-cancel { padding: 10px 18px; background: none; border: none; color: var(--color-fg-muted); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; border-radius: 8px; transition: color 0.15s; }
        .aem-btn-cancel:hover { color: var(--color-fg-secondary); }
        .aem-btn-submit { padding: 10px 20px; background: var(--color-accent); color: var(--color-bg-base); border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .aem-btn-submit:hover { background: var(--color-accent-hover); }
        .aem-btn-submit:disabled { background: var(--color-border-subtle); color: var(--color-fg-muted); cursor: default; }
        .aem-sets-header { display: grid; grid-template-columns: 50px 1fr 80px 80px 80px; gap: 8px; padding: 8px 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--color-fg-muted); font-family: 'DM Sans', sans-serif; font-weight: 600; border-bottom: 1px solid var(--color-border-subtle); margin-bottom: 4px; }
        .aem-set-row { display: grid; grid-template-columns: 50px 1fr 80px 80px 80px; gap: 8px; align-items: center; padding: 6px 4px; border-bottom: 1px solid var(--color-border-subtle); }
        .aem-set-row:last-child { border-bottom: none; }
        .aem-set-col { display: flex; align-items: center; }
        .aem-set-nr { justify-content: center; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--color-fg-secondary); }
        .aem-set-input { width: 100%; padding: 8px 10px; font-size: 13px; }
        .aem-set-warmup input { transform: scale(1.1); }
        .aem-btn-fill { margin-top: 12px; padding: 8px 16px; background: none; border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-fg-secondary); font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .aem-btn-fill:hover { border-color: var(--color-accent); color: var(--color-accent); background: rgba(252,76,2,0.06); }
      `}</style>

      <div className="aem-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="aem-dialog">
          <div className="aem-header">
            {step > 0 && !isSessionLog && <button className="aem-back" onClick={handleBack}>←</button>}
            <div className="aem-header-text">
              <div className="aem-step-label">{isSessionLog ? "Trening" : `Krok ${step + 1} / 3`}</div>
              <div className="aem-step-title">{isSessionLog ? stepLabel : stepLabel[step]}</div>
            </div>
            <button className="aem-close" onClick={onClose}>✕</button>
          </div>

          <div className="aem-body">
            {step === 0 && (
              catLoading
                ? <div className="aem-spinner"><div className="aem-spin" /></div>
                : <div className="aem-cats">
                    {categories.map(cat => (
                      <button key={cat} className="aem-cat" onClick={() => handleSelectCategory(cat)}>{cat}</button>
                    ))}
                  </div>
            )}

            {step === 1 && (
              <>
                <input className="aem-search" placeholder="Szukaj ćwiczenia..." value={search} onChange={e => setSearch(e.target.value)} />
                {exLoading
                  ? <div className="aem-spinner"><div className="aem-spin" /></div>
                  : <div className="aem-ex-list">
                      {filteredExercises.length === 0
                        ? <div className="aem-empty">Brak wyników</div>
                        : filteredExercises.map(ex => (
                            <div key={ex.id} className="aem-ex-item" onClick={() => handleSelectExercise(ex)}>
                              {ex.gifUrl && <img src={`http://localhost:8000${ex.gifUrl}`} alt={ex.name} className="aem-ex-gif" />}
                              <span className="aem-ex-name">{ex.name}</span>
                            </div>
                          ))
                      }
                    </div>
                }
              </>
            )}

            {step === 2 && (
              <>
                {selectedExercise?.gifUrl && (
                  <div className="aem-gif-preview">
                    <img src={`http://localhost:8000${selectedExercise.gifUrl}`} alt={selectedExercise.name} />
                  </div>
                )}
                <div className="aem-field">
                  <label className="aem-label">Liczba serii</label>
                  <input className="aem-input" type="number" min="1" max="50" value={setCount} onChange={handleSetCountChange} placeholder="np. 3" />
                  <span className="aem-hint">Podaj liczbę serii, by wygenerować wiersze poniżej</span>
                </div>
                {setRows.length > 0 && (
                  <>
                    <div className="aem-sets-header">
                      <div className="aem-set-col aem-set-nr">Seria</div>
                      <div className="aem-set-col aem-set-weight">Ciężar (kg)</div>
                      <div className="aem-set-col aem-set-reps">Powt.</div>
                      <div className="aem-set-col aem-set-rpe">RPE</div>
                      <div className="aem-set-col aem-set-warmup">Rozgrzew.</div>
                    </div>
                    {setRows.map((row, idx) => (
                      <div key={idx} className="aem-set-row">
                        <div className="aem-set-col aem-set-nr"><strong>{row.setNumber}</strong></div>
                        <div className="aem-set-col aem-set-weight">
                          <input className="aem-input aem-set-input" type="number" step="0.5" min="0" value={row.weight} onChange={e => updateSetRow(idx, 'weight', e.target.value)} placeholder="—" />
                        </div>
                        <div className="aem-set-col aem-set-reps">
                          <input className="aem-input aem-set-input" type="number" min="1" max="1000" value={row.reps} onChange={e => updateSetRow(idx, 'reps', e.target.value)} placeholder="—" />
                        </div>
                        <div className="aem-set-col aem-set-rpe">
                          <input className="aem-input aem-set-input" type="number" step="0.5" min="1" max="10" value={row.rpe} onChange={e => updateSetRow(idx, 'rpe', e.target.value)} placeholder="—" />
                        </div>
                        <div className="aem-set-col aem-set-warmup">
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <input type="checkbox" checked={row.isWarmup} onChange={e => updateSetRow(idx, 'isWarmup', e.target.checked)} />
                          </label>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="aem-btn-fill" onClick={fillAllFromFirst}>
                      Wypełnij wszystkie 1. serią
                    </button>
                  </>
                )}
                <label className="aem-field" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isWarmup} onChange={e => setIsWarmup(e.target.checked)} />
                  <span className="aem-label" style={{ marginBottom: 0, textTransform: 'none', letterSpacing: 0 }}>Całe ćwiczenie jako rozgrzewkowe</span>
                </label>
                <div className="aem-field">
                  <label className="aem-label">Data</label>
                  <input className="aem-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} disabled={Boolean(sessionId)} />
                  {sessionId && <span className="aem-hint">Data pochodzi z rozpoczętego treningu.</span>}
                </div>
              </>
            )}
          </div>

          {step === 2 && (
            <div className="aem-footer">
              <button className="aem-btn-cancel" onClick={onClose} disabled={loading}>Anuluj</button>
              <button className="aem-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? "Zapisywanie..." : sessionId ? "Zapisz serie" : "Dodaj ćwiczenie"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}