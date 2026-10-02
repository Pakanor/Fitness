import { useState, useEffect } from "react";

const editorStyles = `
  .template-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .template-editor {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .template-editor-header {
    padding: 20px 24px;
    border-bottom: 1px solid #1e1e22;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .template-editor-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #f0ede8;
    margin: 0;
  }

  .template-editor-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
  }

  .template-editor-close:hover {
    color: #f0ede8;
  }

  .template-editor-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .template-editor-field {
    margin-bottom: 20px;
  }

  .template-editor-label {
    display: block;
    font-size: 14px;
    color: #999;
    margin-bottom: 8px;
  }

  .template-editor-input {
    width: 100%;
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 8px;
    padding: 12px 16px;
    color: #f0ede8;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
  }

  .template-editor-input:focus {
    outline: none;
    border-color: #c8f542;
  }

  .template-editor-exercises {
    margin-top: 16px;
  }

  .template-editor-exercise {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .template-editor-exercise-handle {
    color: #666;
    cursor: grab;
  }

  .template-editor-exercise-name {
    flex: 1;
    color: #f0ede8;
    font-size: 14px;
  }

  .template-editor-exercise-remove {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
  }

  .template-editor-exercise-remove:hover {
    color: #ef4444;
  }

  .template-editor-add {
    width: 100%;
    background: #0d0d0f;
    border: 1px dashed #2a2a30;
    border-radius: 8px;
    padding: 12px;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    margin-top: 8px;
  }

  .template-editor-add:hover {
    border-color: #c8f542;
    color: #c8f542;
  }

  .template-editor-footer {
    padding: 20px 24px;
    border-top: 1px solid #1e1e22;
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
    border: 1px solid #2a2a30;
    color: #999;
  }

  .template-editor-btn.cancel:hover {
    border-color: #666;
    color: #f0ede8;
  }

  .template-editor-btn.save {
    background: #c8f542;
    border: none;
    color: #0d0d0f;
    font-weight: 500;
  }

  .template-editor-btn.save:hover {
    background: #d4ff5c;
  }

  .template-editor-btn.save:disabled {
    background: #2a2a30;
    color: #666;
    cursor: not-allowed;
  }

  .template-editor-search {
    margin-top: 16px;
  }

  .template-editor-search-input {
    width: 100%;
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 8px;
    padding: 10px 16px;
    color: #f0ede8;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
  }

  .template-editor-search-input:focus {
    outline: none;
    border-color: #c8f542;
  }

  .template-editor-search-results {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 8px;
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 8px;
  }

  .template-editor-search-result {
    padding: 10px 16px;
    cursor: pointer;
    color: #f0ede8;
    font-size: 14px;
    border-bottom: 1px solid #1e1e22;
  }

  .template-editor-search-result:hover {
    background: #1e1e22;
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`http://localhost:8000/api/records/search?query=${encodeURIComponent(query)}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

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

      if (!response.ok) throw new Error('Failed to save template');
      onSave();
    } catch (e) {
      console.error('Save error:', e);
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

            <div className="template-editor-field">
              <label className="template-editor-label">Ćwiczenia ({exercises.length})</label>
              
              {exercises.map((exercise, index) => (
                <div key={exercise.exerciseId} className="template-editor-exercise">
                  <span className="template-editor-exercise-handle">⋮⋮</span>
                  <span className="template-editor-exercise-name">{exercise.exerciseName}</span>
                  <button 
                    className="template-editor-exercise-remove"
                    onClick={() => handleRemoveExercise(exercise.exerciseId)}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="template-editor-search">
                <input
                  type="text"
                  className="template-editor-search-input"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Szukaj ćwiczeń..."
                />
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