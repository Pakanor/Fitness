import { useState, useEffect, useCallback } from "react";
import Header from "../components/layout/Header";
import TemplateCard from "../features/templates/TemplateCard";
import TemplateEditor from "../features/templates/TemplateEditor";
import { templateAPI } from "../api/templateAPI";
import { toast } from "../components/common/Toast";
import "../styles/tokens.css";

const pageStyles = `
  .tpl-page {
    min-height: 100vh;
    background: var(--color-bg-base);
    color: var(--color-fg-primary);
    font-family: var(--font-body);
  }

  .tpl-main {
    max-width: var(--container-medium);
    margin: 0 auto;
    padding: var(--space-6) var(--space-4) var(--space-10);
  }

  .tpl-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-5);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .tpl-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    margin: 0 0 6px;
  }

  .tpl-sub {
    font-size: 13px;
    color: var(--color-fg-muted);
    margin: 0;
  }

  .tpl-add {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 12px 20px;
    background: var(--color-accent);
    color: var(--color-bg-deep);
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast);
  }

  .tpl-add:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
  }

  .tpl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--space-4);
  }

  .tpl-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-12) var(--space-4);
    text-align: center;
  }

  .tpl-empty-icon {
    font-size: 40px;
    opacity: 0.4;
  }

  .tpl-empty-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-fg-secondary);
    margin: 0;
  }

  .tpl-empty-sub {
    font-size: 13px;
    color: var(--color-fg-muted);
    margin: 0;
  }

  .tpl-loading {
    display: flex;
    justify-content: center;
    padding: var(--space-12) 0;
  }

  .tpl-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border-subtle);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: tpl-spin 0.7s linear infinite;
  }

  @keyframes tpl-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 600px) {
    .tpl-title {
      font-size: 22px;
    }
  }
`;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      setTemplates([]);
      toast(e.message || "Błąd pobierania szablonów.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const handleEdit = (template) => {
    setEditing(template);
    setEditorOpen(true);
  };

  const handleDelete = async (template) => {
    try {
      await templateAPI.deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      toast(`Szablon „${template.name}” usunięty.`);
    } catch (e) {
      toast(e.message || "Nie udało się usunąć szablonu.", "error");
    }
  };

  const handleSaved = async () => {
    setEditorOpen(false);
    setEditing(null);
    await loadTemplates();
    toast("Szablon zapisany.");
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div className="tpl-page">
        <Header />
        <main className="tpl-main">
          <div className="tpl-head">
            <div>
              <h1 className="tpl-title">Szablony treningów</h1>
              <p className="tpl-sub">
                Wczytaj szablon na wybrany dzień, aby zaplanować trening.
              </p>
            </div>
            <button className="tpl-add" onClick={handleCreate} title="Utwórz nowy szablon">
              ＋ Nowy szablon
            </button>
          </div>

          {loading ? (
            <div className="tpl-loading">
              <div className="tpl-spinner" aria-label="Ładowanie szablonów" />
            </div>
          ) : templates.length === 0 ? (
            <div className="tpl-empty">
              <div className="tpl-empty-icon" aria-hidden="true">📋</div>
              <p className="tpl-empty-title">Nie masz jeszcze szablonów</p>
              <p className="tpl-empty-sub">
                Kliknij „Nowy szablon”, aby zapisać np. „Push A” albo „Pull A”.
              </p>
            </div>
          ) : (
            <div className="tpl-grid">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => handleEdit(template)}
                  onDelete={() => handleDelete(template)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {editorOpen && (
        <TemplateEditor
          template={editing}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSave={handleSaved}
        />
      )}
    </>
  );
}
