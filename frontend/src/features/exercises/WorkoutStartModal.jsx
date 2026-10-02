import { useState } from "react";
import TemplateSelectionModal from "../templates/TemplateSelectionModal";

const modalStyles = `
  .workout-start-overlay {
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

  .workout-start-modal {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    overflow: hidden;
  }

  .workout-start-header {
    padding: 20px 24px;
    border-bottom: 1px solid #1e1e22;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .workout-start-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #f0ede8;
    margin: 0;
  }

  .workout-start-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
  }

  .workout-start-close:hover {
    color: #f0ede8;
  }

  .workout-start-body {
    padding: 24px;
  }

  .workout-start-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .workout-start-option {
    background: #0d0d0f;
    border: 1px solid #2a2a30;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .workout-start-option:hover {
    border-color: #c8f542;
    transform: translateY(-1px);
  }

  .workout-start-option-icon {
    font-size: 24px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #16161a;
    border-radius: 12px;
  }

  .workout-start-option-content {
    flex: 1;
  }

  .workout-start-option-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 4px;
  }

  .workout-start-option-desc {
    font-size: 13px;
    color: #999;
  }
`;

export default function WorkoutStartModal({ onStartEmpty, onStartFromTemplate, onCopyPreviousByTemplate, onClose }) {
  const [templatePurpose, setTemplatePurpose] = useState(null); // 'from' | 'copy' | null

  const handleTemplateSelected = (templateId) => {
    setTemplatePurpose(null);
    if (templatePurpose === 'copy') {
      onCopyPreviousByTemplate(templateId);
    } else {
      onStartFromTemplate(templateId);
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <div className="workout-start-overlay" onClick={onClose}>
        <div className="workout-start-modal" onClick={e => e.stopPropagation()}>
          <div className="workout-start-header">
            <h2 className="workout-start-title">Rozpocznij trening</h2>
            <button className="workout-start-close" onClick={onClose}>×</button>
          </div>

          <div className="workout-start-body">
            <div className="workout-start-options">
              <div
                className="workout-start-option"
                onClick={() => setTemplatePurpose('from')}
              >
                <div className="workout-start-option-icon">📋</div>
                <div className="workout-start-option-content">
                  <div className="workout-start-option-title">Rozpocznij z Szablonu</div>
                  <div className="workout-start-option-desc">
                    Wybierz szablon i uzupełnij serie w trakcie
                  </div>
                </div>
              </div>

              <div
                className="workout-start-option"
                onClick={() => setTemplatePurpose('copy')}
              >
                <div className="workout-start-option-icon">📝</div>
                <div className="workout-start-option-content">
                  <div className="workout-start-option-title">Zacznij na bazie ostatniego treningu</div>
                  <div className="workout-start-option-desc">
                    Wczytaj ostatni ukończony trening z wybranego szablonu
                  </div>
                </div>
              </div>

              <div className="workout-start-option" onClick={onStartEmpty}>
                <div className="workout-start-option-icon">➕</div>
                <div className="workout-start-option-content">
                  <div className="workout-start-option-title">Pusty trening</div>
                  <div className="workout-start-option-desc">
                    Dodaj ćwiczenia ręcznie
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {templatePurpose && (
        <TemplateSelectionModal
          onSelect={handleTemplateSelected}
          onClose={() => setTemplatePurpose(null)}
        />
      )}
    </>
  );
}
