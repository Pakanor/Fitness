import { useState, useEffect } from "react";

const modalStyles = `
  .template-modal-overlay {
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

  .template-modal {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    max-height: 70vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .template-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #1e1e22;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .template-modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #f0ede8;
    margin: 0;
  }

  .template-modal-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
  }

  .template-modal-close:hover {
    color: #f0ede8;
  }

  .template-modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .template-modal-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .template-modal-item {
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .template-modal-item:hover {
    border-color: #c8f542;
    transform: translateY(-1px);
  }

  .template-modal-item-name {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 8px;
  }

  .template-modal-item-exercises {
    font-size: 13px;
    color: #999;
  }

  .template-modal-item-count {
    color: #c8f542;
    font-weight: 500;
  }

  .template-modal-empty {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }

  .template-modal-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .template-modal-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 8px;
  }

  .template-modal-empty-text {
    font-size: 14px;
    color: #666;
  }

  .template-modal-loading {
    text-align: center;
    padding: 40px;
    color: #666;
  }
`;

export default function TemplateSelectionModal({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/workout-start/templates', {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch templates');
        const data = await response.json();
        setTemplates(data);
      } catch (e) {
        console.error('Error fetching templates:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelect = (templateId) => {
    onSelect(templateId);
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="template-modal-overlay" onClick={onClose}>
        <div className="template-modal" onClick={e => e.stopPropagation()}>
          <div className="template-modal-header">
            <h2 className="template-modal-title">Wybierz szablon</h2>
            <button className="template-modal-close" onClick={onClose}>×</button>
          </div>

          <div className="template-modal-body">
            {loading ? (
              <div className="template-modal-loading">Ładowanie szablonów...</div>
            ) : templates.length === 0 ? (
              <div className="template-modal-empty">
                <div className="template-modal-empty-icon">📋</div>
                <h3 className="template-modal-empty-title">Brak szablonów</h3>
                <p className="template-modal-empty-text">
                  Utwórz szablon treningowy, aby móc go tutaj wybrać
                </p>
              </div>
            ) : (
              <div className="template-modal-list">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="template-modal-item"
                    onClick={() => handleSelect(template.id)}
                  >
                    <div className="template-modal-item-name">{template.name}</div>
                    <div className="template-modal-item-exercises">
                      <span className="template-modal-item-count">{template.exerciseCount}</span> ćwiczeń
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}