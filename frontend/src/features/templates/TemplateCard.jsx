import { useState } from "react";

const cardStyles = `
  .template-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
    cursor: pointer;
  }

  .template-card:hover {
    border-color: var(--color-border-default);
    transform: translateY(-2px);
  }

  .template-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .template-card-name {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-fg-primary);
    margin: 0;
  }

  .template-card-actions {
    display: flex;
    gap: 8px;
  }

  .template-card-action {
    background: none;
    border: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    padding: 4px;
    font-size: 16px;
    transition: color 0.2s;
  }

  .template-card-action:hover {
    color: var(--color-fg-primary);
  }

  .template-card-action.delete:hover {
    color: #ef4444;
  }

  .template-card-exercises {
    margin-bottom: 12px;
  }

  .template-card-exercise {
    font-size: 13px;
    color: var(--color-fg-muted);
    padding: 4px 0;
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .template-card-exercise:last-child {
    border-bottom: none;
  }

  .template-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--color-fg-muted);
  }

  .template-card-count {
    color: var(--color-accent);
    font-weight: 500;
  }

  .template-card-date {
    color: var(--color-fg-muted);
  }
`;

export default function TemplateCard({ template, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <style>{cardStyles}</style>
      <div className="template-card">
        <div className="template-card-header">
          <h3 className="template-card-name">{template.name}</h3>
          <div className="template-card-actions">
            <button className="template-card-action" onClick={handleEdit} title="Edytuj">
              ✏️
            </button>
            <button 
              className={`template-card-action delete ${confirmDelete ? 'confirm' : ''}`} 
              onClick={handleDelete} 
              title={confirmDelete ? 'Potwierdź usunięcie' : 'Usuń'}
            >
              {confirmDelete ? '⚠️' : '🗑️'}
            </button>
          </div>
        </div>

        <div className="template-card-exercises">
          {template.exercises?.slice(0, 3).map((exercise, index) => (
            <div key={index} className="template-card-exercise">
              {exercise.exerciseName}
            </div>
          ))}
          {template.exercises?.length > 3 && (
            <div className="template-card-exercise">
              +{template.exercises.length - 3} więcej
            </div>
          )}
        </div>

        <div className="template-card-footer">
          <span className="template-card-count">
            {template.exercises?.length || 0} ćwiczeń
          </span>
          <span className="template-card-date">
            {formatDate(template.createdAt)}
          </span>
        </div>
      </div>
    </>
  );
}