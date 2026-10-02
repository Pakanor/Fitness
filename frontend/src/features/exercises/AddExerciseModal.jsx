import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { addUserExercise, getExerciseCategory, getExercisesByBodyPart } from "../../api/exerciseAPI";
import { toast } from "../../components/common/Toast";

export default function AddExerciseModal({ open, onClose, onAdded, defaultDate }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [rir, setRir] = useState("");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0); setSelectedCategory(null); setSelectedExercise(null); setSearch("");
      setSets(""); setReps(""); setWeight(""); setRpe(""); setRir(""); setDate(defaultDate || new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCatLoading(true);
    getExerciseCategory().then(setCategories).catch(console.error).finally(() => setCatLoading(false));
  }, [open]);

  useEffect(() => {
    if (!selectedCategory) return;
    setExLoading(true); setExercises([]);
    getExercisesByBodyPart(selectedCategory).then(setExercises).catch(console.error).finally(() => setExLoading(false));
  }, [selectedCategory]);

  const handleSelectCategory = (cat) => { setSelectedCategory(cat); setStep(1); };
  const handleSelectExercise = (ex) => { setSelectedExercise(ex); setStep(2); };
  const handleBack = () => {
    if (step === 1) { setStep(0); setSelectedExercise(null); setSearch(""); }
    if (step === 2) { setStep(1); }
  };

  const handleSubmit = async () => {
    if (!user?.id) { toast("Brak UserId w tokenie!", "error"); return; }
    if (rpe && (parseInt(rpe) < 1 || parseInt(rpe) > 10)) {
      toast("RPE musi być w zakresie 1-10", "error"); return;
    }
    if (rir && (parseInt(rir) < 0 || parseInt(rir) > 4)) {
      toast("RIR musi być w zakresie 0-4", "error"); return;
    }
    setLoading(true);
    try {
      await addUserExercise({
        userId: user.id, exerciseId: selectedExercise.id,
        sets: sets ? parseInt(sets) : null,
        reps: reps ? parseInt(reps) : null,
        weight: weight ? parseFloat(weight) : null,
        rpe: rpe ? parseInt(rpe) : null,
        rir: rir ? parseInt(rir) : null,
        date,
      });
      toast("Ćwiczenie dodane!");
      onAdded?.(); onClose();
    } catch (err) {
      console.error(err);
      toast("Błąd podczas dodawania ćwiczenia.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()));
  const stepLabel = ["Wybierz kategorię", "Wybierz ćwiczenie", `Dodaj: ${selectedExercise?.name ?? ""}`];

  if (!open) return null;

  return (
    <>
      <style>{`
        .aem-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .aem-dialog { background: #16161a; border: 1px solid #1e1e22; border-radius: 16px; width: 520px; max-width: 100%; min-height: 420px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
        .aem-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 1px solid #1e1e22; }
        .aem-back { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .aem-back:hover { color: #f0ede8; background: #1e1e22; }
        .aem-header-text { flex: 1; }
        .aem-step-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 2px; font-family: 'DM Sans', sans-serif; }
        .aem-step-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #f0ede8; text-transform: capitalize; }
        .aem-close { background: none; border: none; color: #555; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: color 0.15s, background 0.15s; }
        .aem-close:hover { color: #f0ede8; background: #1e1e22; }
        .aem-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
        .aem-spinner { display: flex; justify-content: center; padding: 32px 0; }
        .aem-spin { width: 24px; height: 24px; border: 2px solid #1e1e22; border-top-color: #c8f542; border-radius: 50%; animation: aem-spin 0.7s linear infinite; }
        @keyframes aem-spin { to { transform: rotate(360deg); } }
        .aem-cats { display: flex; flex-wrap: wrap; gap: 8px; }
        .aem-cat { padding: 8px 16px; border: 1px solid #2a2a30; border-radius: 8px; background: none; color: #ccc; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; text-transform: capitalize; transition: border-color 0.15s, color 0.15s, background 0.15s; }
        .aem-cat:hover { border-color: #c8f542; color: #c8f542; background: rgba(200,245,66,0.06); }
        .aem-search { width: 100%; padding: 10px 14px; background: #0d0d0f; border: 1px solid #2a2a30; border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: border-color 0.15s; }
        .aem-search::placeholder { color: #444; }
        .aem-search:focus { border-color: #c8f542; }
        .aem-ex-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
        .aem-ex-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid #1e1e22; border-radius: 10px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .aem-ex-item:hover { background: #1e1e22; border-color: #2a2a30; }
        .aem-ex-gif { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: #1e1e22; flex-shrink: 0; }
        .aem-ex-name { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #e0ddd8; text-transform: capitalize; }
        .aem-empty { text-align: center; padding: 32px; color: #444; font-size: 14px; font-family: 'DM Sans', sans-serif; }
        .aem-gif-preview { display: flex; justify-content: center; margin-bottom: 16px; }
        .aem-gif-preview img { width: 220px; height: 220px; border-radius: 12px; object-fit: cover; }
        .aem-field { margin-bottom: 12px; }
        .aem-label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #444; margin-bottom: 6px; font-family: 'DM Sans', sans-serif; font-weight: 500; }
        .aem-input { width: 100%; padding: 10px 14px; background: #0d0d0f; border: 1px solid #2a2a30; border-radius: 10px; color: #f0ede8; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; box-sizing: border-box; transition: border-color 0.15s; colorScheme: dark; }
        .aem-input:focus { border-color: #c8f542; }
        .aem-footer { padding: 16px 20px; border-top: 1px solid #1e1e22; display: flex; justify-content: flex-end; gap: 8px; }
        .aem-btn-cancel { padding: 10px 18px; background: none; border: none; color: #666; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; border-radius: 8px; transition: color 0.15s; }
        .aem-btn-cancel:hover { color: #aaa; }
        .aem-btn-submit { padding: 10px 20px; background: #c8f542; color: #0d0d0f; border: none; border-radius: 10px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .aem-btn-submit:hover { background: #d4f55a; }
        .aem-btn-submit:disabled { background: #1e1e22; color: #444; cursor: default; }
      `}</style>

      <div className="aem-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="aem-dialog">
          <div className="aem-header">
            {step > 0 && <button className="aem-back" onClick={handleBack}>←</button>}
            <div className="aem-header-text">
              <div className="aem-step-label">Krok {step + 1} / 3</div>
              <div className="aem-step-title">{stepLabel[step]}</div>
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
                {[
                  { label: "Serie", value: sets, set: setSets },
                  { label: "Powtórzenia", value: reps, set: setReps },
                  { label: "Waga (kg)", value: weight, set: setWeight },
                  { label: "RPE (1-10)", value: rpe, set: setRpe, hint: "opcjonalne" },
                  { label: "RIR (0-4)", value: rir, set: setRir, hint: "opcjonalne" },
                ].map(({ label, value, set, hint }) => (
                  <div key={label} className="aem-field">
                    <label className="aem-label">
                      {label}
                      {hint && <span style={{ fontSize: 11, color: '#555', fontWeight: 400, marginLeft: 6 }}>({hint})</span>}
                    </label>
                    <input className="aem-input" type="number" value={value} onChange={e => set(e.target.value)} />
                  </div>
                ))}
                <div className="aem-field">
                  <label className="aem-label">Data</label>
                  <input className="aem-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
                </div>
              </>
            )}
          </div>

          {step === 2 && (
            <div className="aem-footer">
              <button className="aem-btn-cancel" onClick={onClose} disabled={loading}>Anuluj</button>
              <button className="aem-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? "Dodawanie..." : "Dodaj ćwiczenie"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}