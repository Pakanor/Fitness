import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import TemplateCard from "./TemplateCard";
import TemplateEditor from "./TemplateEditor";

const templatesStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .templates-page {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: 'DM Sans', sans-serif;
  }

  .templates-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .templates-title {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #f0ede8;
  }

  .templates-back {
    font-size: 14px;
    color: #c8f542;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    text-decoration: none;
  }

  .templates-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .create-template-btn {
    background: #16161a;
    border: 2px dashed #2a2a30;
    border-radius: 12px;
    padding: 24px;
    color: #666;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .create-template-btn:hover {
    border-color: #c8f542;
    color: #c8f542;
  }

  .create-template-icon {
    font-size: 32px;
  }

  .create-template-text {
    font-size: 14px;
    font-weight: 500;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .error {
    text-align: center;
    padding: 40px;
    color: #ef4444;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 8px;
  }

  .empty-sub {
    font-size: 14px;
    color: #666;
  }
`;

export default function WorkoutTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/templates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (e) {
      setError(e.message || 'Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete template');
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (e) {
      console.error('Error deleting template:', e);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleEditorSave = () => {
    fetchTemplates();
    handleEditorClose();
  };

  return (
    <>
      <style>{templatesStyles}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d0f' }}>
        <Header />
        <div className="templates-page">
          <div className="templates-header">
            <h1 className="templates-title">Szablony treningowe</h1>
            <button className="templates-back" onClick={() => navigate('/')}>
              ← Powrót
            </button>
          </div>
          <p className="templates-subtitle">
            Twórz i zarządzaj szablonami treningów
          </p>

          {loading ? (
            <div className="loading">Ładowanie szablonów...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">Brak szablonów</h3>
              <p className="empty-sub">Utwórz swój pierwszy szablon treningowy</p>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => handleEdit(template)}
                  onDelete={() => handleDelete(template.id)}
                />
              ))}
            </div>
          )}

          <button className="create-template-btn" onClick={handleCreate}>
            <span className="create-template-icon">+</span>
            <span className="create-template-text">Utwórz nowy szablon</span>
          </button>
        </div>
      </div>

      {editorOpen && (
        <TemplateEditor
          template={editingTemplate}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}
    </>
  );
}