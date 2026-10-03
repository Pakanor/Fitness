import { useState, useEffect, useRef } from "react";
import { toast } from "../../components/common/Toast";

const editorStyles = `
  .template-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    /* Anchored to the top on purpose: a centred dialog moves every time the
       content grows, which made the popup jump while typing. */
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
    z-index: 1000;
    padding: 5vh 20px 20px;
  }

  .template-editor {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .template-editor-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .template-editor-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-fg-primary);
    margin: 0;
  }

  .template-editor-close {
    background: none;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
  }

  .template-editor-close:hover {
    color: var(--color-fg-primary);
  }

  .template-editor-body {
    padding: 24px;
    overflow: visible;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .template-editor-field {
    margin-bottom: 20px;
  }

  .template-editor-field--tight {
    margin-bottom: 16px;
  }

  .template-editor-field--grow {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-bottom: 0;
  }

  /* Only the chosen exercises scroll, so the search box and its result popup
     never move and never get clipped. */
  .template-editor-exercise-list {
    flex: 1;
    min-height: 90px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 4px;
  }

  .template-editor-empty {
    padding: 20px 16px;
    text-align: center;
    color: var(--color-fg-muted);
    font-size: 13px;
    border: 1px dashed var(--color-border-subtle);
    border-radius: 8px;
  }

  .template-editor-label {
    display: block;
    font-size: 14px;
    color: var(--color-fg-muted);
    margin-bottom: 8px;
  }

  .template-editor-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    padding: 12px 16px;
    color: var(--color-fg-primary);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
  }

  .template-editor-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .template-editor-exercises {
    margin-top: 16px;
  }

  .template-editor-exercise {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .template-editor-exercise-handle {
    color: var(--color-fg-muted);
    cursor: grab;
  }

  .template-editor-exercise-name {
    flex: 1;
    color: var(--color-fg-primary);
    font-size: 14px;
  }

  .template-editor-exercise-remove {
    background: none;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    padding: 4px;
  }

  .template-editor-exercise-remove:hover {
    color: #ef4444;
  }

  .template-editor-add {
    width: 100%;
    background: var(--color-bg-base);
    border: 1px dashed var(--color-border-default);
    border-radius: 8px;
    padding: 12px;
    color: var(--color-fg-muted);
    cursor: pointer;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    margin-top: 8px;
  }

  .template-editor-add:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .template-editor-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--color-border-subtle);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .template-editor-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
  }

  .template-editor-btn.cancel {
    background: transparent;
    border: 1px solid var(--color-border-default);
    color: var(--color-fg-muted);
  }

  .template-editor-btn.cancel:hover {
    border-color: var(--color-fg-muted);
    color: var(--color-fg-primary);
  }

  .template-editor-btn.save {
    background: var(--color-accent);
    border: none;
    color: var(--color-bg-base);
    font-weight: 500;
  }

  .template-editor-btn.save:hover {
    background: var(--color-accent);
  }

  .template-editor-btn.save:disabled {
    background: var(--color-border-default);
    color: var(--color-fg-muted);
    cursor: not-allowed;
  }

  .template-editor-search {
    margin-top: 16px;
    position: relative;
  }

  .template-editor-search-hint {
    margin-top: 8px;
    font-size: 12px;
    color: var(--color-fg-muted);
    font-family: 'DM Sans', sans-serif;
  }

  .template-editor-search-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    padding: 10px 16px;
    color: var(--color-fg-primary);
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
  }

  .template-editor-search-input:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .template-editor-search-results {
    /* Floats over the exercise list instead of pushing it down, so the dialog
       never changes height while typing. Fixed to four rows (40px each) with
       scrolling for the rest. */
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 5;
    max-height: 160px;
    overflow-y: auto;
    overscroll-behavior: contain;
    margin-top: 4px;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-default);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
  }

  .template-editor-search-result {
    padding: 10px 16px;
    line-height: 20px;
    cursor: pointer;
    color: var(--color-fg-primary);
    font-size: 14px;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .template-editor-search-result:hover {
    background: var(--color-border-subtle);
  }

  .template-editor-search-result:last-child {
    border-bottom: none;
  }
`;

export default function TemplateEditor({ template, onClose, onSave }) {
  const [name, setName] = useState(template?.name || '');
  const [exercises, setExercises] = useState(template?.exercises || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRun = useRef(0);

  // Debounced search: one request per pause in typing, and stale responses are
  // discarded so the list never flickers between queries.
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const run = ++searchRun.current;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/records/search?query=${encodeURIComponent(query)}`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        if (run !== searchRun.current) return;
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (run !== searchRun.current) return;
        console.error('Search error:', e);
        setSearchResults([]);
      } finally {
        if (run === searchRun.current) setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddExercise = (exercise) => {
    if (!exercises.find(e => e.exerciseId === exercise.id)) {
      setExercises(prev => [...prev, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        order: prev.length
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveExercise = (exerciseId) => {
    setExercises(prev => prev.filter(e => e.exerciseId !== exerciseId));
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return;

    setSaving(true);
    try {
      const url = template 
        ? `http://localhost:8000/api/templates/${template.id}`
        : 'http://localhost:8000/api/templates';
      
      const method = template ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          exerciseIds: exercises.map(e => e.exerciseId)
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Nie udało się zapisać szablonu');
      }
      onSave();
    } catch (e) {
      console.error('Save error:', e);
      toast(e.message || 'Nie udało się zapisać szablonu.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{editorStyles}</style>
      <div className="template-editor-overlay" onClick={onClose}>
        <div className="template-editor" onClick={e => e.stopPropagation()}>
          <div className="template-editor-header">
            <h2 className="template-editor-title">
              {template ? 'Edytuj szablon' : 'Nowy szablon'}
            </h2>
            <button className="template-editor-close" onClick={onClose}>×</button>
          </div>

          <div className="template-editor-body">
            <div className="template-editor-field">
              <label className="template-editor-label">Nazwa szablonu</label>
              <input
                type="text"
                className="template-editor-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Trening klatki"
              />
            </div>

            <div className="template-editor-field template-editor-field--tight">
              <label className="template-editor-label">Dodaj ćwiczenie</label>
              <div className="template-editor-search">
                <input
                  type="text"
                  className="template-editor-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Szukaj ćwiczeń..."
                />
                {searching && (
                  <div className="template-editor-search-hint">Szukanie…</div>
                )}
                {searchResults.length > 0 && (
                  <div className="template-editor-search-results">
                    {searchResults.map(exercise => (
                      <div
                        key={exercise.id}
                        className="template-editor-search-result"
                        onClick={() => handleAddExercise(exercise)}
                      >
                        {exercise.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="template-editor-field template-editor-field--grow">
              <label className="template-editor-label">
                Ćwiczenia w szablonie ({exercises.length})
              </label>

              <div className="template-editor-exercise-list">
                {exercises.length === 0 ? (
                  <div className="template-editor-empty">
                    Wyszukaj ćwiczenie powyżej i dodaj je do szablonu.
                  </div>
                ) : (
                  exercises.map(exercise => (
                    <div key={exercise.exerciseId} className="template-editor-exercise">
                      <span className="template-editor-exercise-handle">⋮⋮</span>
                      <span className="template-editor-exercise-name">{exercise.exerciseName}</span>
                      <button
                        className="template-editor-exercise-remove"
                        onClick={() => handleRemoveExercise(exercise.exerciseId)}
                        title="Usuń z szablonu"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="template-editor-footer">
            <button className="template-editor-btn cancel" onClick={onClose}>
              Anuluj
            </button>
            <button 
              className="template-editor-btn save" 
              onClick={handleSave}
              disabled={!name.trim() || exercises.length === 0 || saving}
            >
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}