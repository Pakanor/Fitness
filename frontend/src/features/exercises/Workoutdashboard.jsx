import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AddExerciseModal from "./AddExerciseModal";
import TemplateSelectionModal from "../templates/TemplateSelectionModal";
import { getExercisesByDate, deleteUserExercise } from "../../api/exerciseAPI";
import { templateAPI } from "../../api/templateAPI";
import { workoutAPI, SESSION_STATUS } from "../../api/workoutAPI";
import { toast } from "../../components/common/Toast";
import DateSearch from "../../components/DateSearch";
import '../../styles/tokens.css';

const categoryColors = {
  chest: "var(--color-category-chest)",
  back: "var(--color-category-back)",
  legs: "var(--color-category-legs)",
  shoulders: "var(--color-category-shoulders)",
  arms: "var(--color-category-arms)",
  core: "var(--color-category-core)",
  cardio: "var(--color-category-cardio)",
  default: "var(--color-fg-disabled)",
};

function getCategoryColor(category = "") {
  return categoryColors[category.toLowerCase()] ?? categoryColors.default;
}

const WorkoutDashboardStyles = `
  /* Fixed height so .exercise-list scrolls inside the page and the bottom bar
     (Załaduj szablon / Szablony / Dodaj ćwiczenie) always stays visible,
     no matter how many exercises a loaded template contains. */
  .dashboard {
    height: calc(100vh - var(--header-height));
    min-height: calc(100vh - var(--header-height));
    overflow: hidden;
    background: var(--color-bg-base);
    color: var(--color-fg-primary);
    font-family: var(--font-body);
    display: flex;
    flex-direction: column;
  }

  .dashboard-inner {
    max-width: var(--container-medium);
    width: 100%;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4) 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .exercise-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .bottom-bar {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4) 0 var(--space-6);
    background: var(--color-bg-base);
    border-top: 1px solid var(--color-border-subtle);
    margin-top: var(--space-4);
  }

  .today-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-5);
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .date-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .day-name {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    text-transform: capitalize;
    line-height: 1;
    color: var(--color-fg-primary);
  }

  .date-str {
    font-size: 13px;
    color: var(--color-fg-muted);
    font-weight: 300;
  }

  .exercise-count {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .count-num {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    color: var(--color-accent);
  }

  .count-label {
    font-size: 12px;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .section-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-fg-disabled);
    margin-bottom: var(--space-3);
    font-weight: 500;
  }

  .exercise-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-left: 3px solid var(--accent, var(--color-fg-disabled));
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    transition: background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
    position: relative;
    min-height: 110px;
  }

  .exercise-card:hover {
    background: var(--color-bg-elevated);
    box-shadow: var(--shadow-sm);
  }

  .card-left {
    flex-shrink: 0;
  }

  .exercise-gif {
    width: 90px;
    height: 90px;
    border-radius: var(--radius-md);
    object-fit: cover;
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
  }

  .placeholder-gif {
    width: 90px;
    height: 90px;
    border-radius: var(--radius-md);
    background: var(--color-bg-input);
    border: 1px solid var(--color-border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .card-body {
    flex: 1;
    min-width: 0;
  }

  .card-header-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    flex-wrap: wrap;
  }

  .exercise-name {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 15px;
    color: var(--color-fg-primary);
    text-transform: capitalize;
    line-height: 1.2;
  }

  .category-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    color: var(--color-bg-deep);
    flex-shrink: 0;
  }

  .stats-row {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 17px;
    font-weight: 700;
    color: var(--color-fg-primary);
    line-height: 1;
  }

  .stat-label {
    font-size: 10px;
    color: var(--color-fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .prev-hint {
    margin-top: var(--space-2);
    font-size: 12px;
    color: var(--color-fg-muted);
    font-style: italic;
    line-height: 1.3;
  }

  .delete-btn {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    background: none;
    border: none;
    color: var(--color-fg-disabled);
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 4px;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .delete-btn:hover {
    color: var(--color-error);
    background: var(--color-error-dim);
  }

  .delete-btn.deleting {
    color: var(--color-fg-muted);
    cursor: default;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-12) var(--space-4);
    text-align: center;
    gap: var(--space-2);
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: var(--space-2);
    opacity: 0.4;
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--color-fg-disabled);
  }

  .empty-sub {
    font-size: 13px;
    color: var(--color-fg-disabled);
  }

  .loading-wrap {
    display: flex;
    justify-content: center;
    padding: var(--space-12) 0;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border-subtle);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-box {
    background: var(--color-error-dim);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    color: var(--color-error);
    font-size: 14px;
    margin-bottom: var(--space-5);
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-4) var(--space-5);
    background: var(--color-accent);
    color: var(--color-bg-deep);
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
    letter-spacing: -0.2px;
  }

  .add-btn:hover {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(252, 76, 2, 0.15);
  }

  .add-btn:active {
    transform: translateY(0);
  }

  .add-btn-icon {
    width: 26px;
    height: 20px;
    background: var(--color-bg-deep);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    color: var(--color-accent);
    flex-shrink: 0;
  }

  .session-banner {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    padding: var(--space-4);
    margin-bottom: var(--space-4);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-left: 3px solid var(--session-accent, var(--color-fg-disabled));
    border-radius: var(--radius-lg);
  }

  .session-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .session-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    color: var(--color-fg-primary);
  }

  .session-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    color: var(--color-bg-deep);
    background: var(--session-accent, var(--color-fg-disabled));
  }

  .session-sub {
    font-size: 12px;
    color: var(--color-fg-muted);
  }

  .session-volume {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-fg-secondary);
  }

  .session-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 10px 18px;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .session-btn--primary {
    background: var(--color-accent);
    color: var(--color-bg-deep);
  }

  .session-btn--primary:hover:not(:disabled) {
    background: var(--color-accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(252, 76, 2, 0.15);
  }

  .session-btn--success {
    background: var(--color-success);
    color: var(--color-bg-deep);
  }

  .session-btn--success:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .session-btn--ghost {
    background: none;
    color: var(--color-fg-secondary);
    border-color: var(--color-border-default);
  }

  .session-btn--ghost:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: translateY(-1px);
  }

  .session-btn:disabled {
    background: var(--color-border-subtle);
    color: var(--color-fg-disabled);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .exercise-card.clickable {
    cursor: pointer;
  }

  .exercise-card.locked {
    opacity: 0.75;
  }

  .lock-hint {
    margin-top: var(--space-2);
    font-size: 12px;
    color: var(--color-fg-muted);
  }

  .template-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-3) var(--space-5);
    background: none;
    color: var(--color-fg-secondary);
    border: 1px dashed var(--color-border-default);
    border-radius: var(--radius-md);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .template-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .template-btn:disabled {
    color: var(--color-fg-disabled);
    cursor: not-allowed;
    opacity: 0.6;
  }

  .template-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .template-actions .template-btn {
    flex: 1;
    min-width: 160px;
  }

  .template-btn--ghost {
    flex: 0 0 auto;
    min-width: 0;
    border-style: solid;
    border-color: var(--color-border-subtle);
  }

  @media (max-width: 600px) {
    .day-name {
      font-size: 22px;
    }

    .count-num {
      font-size: 28px;
    }

    .exercise-card {
      flex-wrap: wrap;
    }

    .exercise-gif,
    .placeholder-gif {
      width: 70px;
      height: 70px;
    }
  }
`;

function ExerciseCard({ entry, onDelete, prev, onLogSet, locked }) {
  const color = getCategoryColor(entry.category);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await onDelete(entry.userExerciseId);
    } catch {
      setDeleting(false);
    }
  };

  const showPrevHint = prev && entry.weight == null && entry.reps == null;
  const hasNumbers = entry.sets != null || entry.reps != null || entry.weight != null;

  const handleCardClick = () => {
    if (locked || !onLogSet) return;
    onLogSet(entry);
  };

  return (
    <div
      className={`exercise-card ${onLogSet && !locked ? "clickable" : ""} ${locked ? "locked" : ""}`}
      style={{ "--accent": color }}
      onClick={handleCardClick}
      role={onLogSet && !locked ? "button" : undefined}
      tabIndex={onLogSet && !locked ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="card-left">
        {entry.gifUrl ? (
          <img
            src={`http://localhost:8000${entry.gifUrl}`}
            alt={entry.name}
            className="exercise-gif"
            loading="lazy"
          />
        ) : (
          <div className="exercise-gif placeholder-gif">
            <span aria-hidden="true">💪</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-header-row">
          <span className="exercise-name">{entry.name}</span>
          {entry.primaryMuscles && (
            <span className="category-badge" style={{ background: color }}>
              {entry.primaryMuscles}
            </span>
          )}
        </div>
        <div className="stats-row">
          {entry.sets != null && (
            <div className="stat">
              <span className="stat-value">{entry.sets}</span>
              <span className="stat-label">serie</span>
            </div>
          )}
          {entry.reps != null && (
            <div className="stat">
              <span className="stat-value">{entry.reps}</span>
              <span className="stat-label">powtórzenia</span>
            </div>
          )}
          {entry.weight != null && (
            <div className="stat">
              <span className="stat-value">{entry.weight}</span>
              <span className="stat-label">kg</span>
            </div>
          )}
          {entry.rpe != null && (
            <div className="stat">
              <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{entry.rpe}</span>
              <span className="stat-label">RPE</span>
            </div>
          )}
          {entry.rir != null && (
            <div className="stat">
              <span className="stat-value" style={{ color: 'var(--color-category-arms)' }}>{entry.rir}</span>
              <span className="stat-label">RIR</span>
            </div>
          )}
        </div>
        {showPrevHint && (
          <div className="prev-hint">
            Poprzednio: {prev.weight} kg x {prev.reps} powt.
          </div>
        )}
        {locked ? (
          <div className="lock-hint">
            {entry.sessionStatus === SESSION_STATUS.PLANNED
              ? "Serie zapiszesz po rozpoczęciu treningu"
              : "Trening zakończony — zapis zamknięty"}
          </div>
        ) : (
          onLogSet && !hasNumbers && (
            <div className="lock-hint">Kliknij, aby zapisać wagę i powtórzenia</div>
          )
        )}
      </div>
      {!locked && (
        <button
          className={`delete-btn ${deleting ? "deleting" : ""}`}
          onClick={handleDelete}
          disabled={deleting}
          title="Usuń"
          aria-label={`Usuń ćwiczenie ${entry.name}`}
        >
          {deleting ? "⏳" : "×"}
        </button>
      )}
    </div>
  );
}

const STATUS_META = {
  [SESSION_STATUS.PLANNED]: {
    label: "Zaplanowany",
    accent: "var(--color-info)",
    hint: "Zaplanowany na ten dzień. Serie możesz zapisać po rozpoczęciu treningu.",
  },
  [SESSION_STATUS.IN_PROGRESS]: {
    label: "W trakcie",
    accent: "var(--color-accent)",
    hint: "Trening trwa. Kliknij ćwiczenie, aby zapisać serie.",
  },
  [SESSION_STATUS.COMPLETED]: {
    label: "Ukończony",
    accent: "var(--color-success)",
    hint: "Trening zakończony. Zapis jest zablokowany.",
  },
};

function SessionBanner({ session, actionLoading, onStart, onFinish, onReopen }) {
  if (!session) return null;

  const meta = STATUS_META[session.status] ?? STATUS_META[SESSION_STATUS.PLANNED];
  const completed = session.status === SESSION_STATUS.COMPLETED;

  return (
    <div className="session-banner" style={{ "--session-accent": meta.accent }}>
      <div className="session-info">
        <div className="session-title">
          {session.templateName || "Trening"}
          <span className="session-badge">{meta.label}</span>
        </div>
        <div className="session-sub">{meta.hint}</div>
      </div>

      {completed && (
        <>
          <div className="session-volume">
            {(session.totalVolume || 0).toLocaleString("pl-PL")} kg objętości
          </div>
          <button
            className="session-btn session-btn--ghost"
            onClick={onReopen}
            disabled={actionLoading}
            title="Wznów trening i dopisz kolejne serie"
          >
            {actionLoading ? "Wznawiam…" : "↻ Wznów trening"}
          </button>
        </>
      )}

      {session.status === SESSION_STATUS.PLANNED && (
        <button
          className="session-btn session-btn--primary"
          onClick={onStart}
          disabled={actionLoading}
          title="Rozpocznij trening"
        >
          {actionLoading ? "Startuję…" : "▶ Rozpocznij trening"}
        </button>
      )}

      {session.status === SESSION_STATUS.IN_PROGRESS && (
        <button
          className="session-btn session-btn--success"
          onClick={onFinish}
          disabled={actionLoading}
          title="Zakończ trening"
        >
          {actionLoading ? "Zapisuję…" : "✓ Zakończ trening"}
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">🏋️</div>
      <p className="empty-title">Brak ćwiczeń na dziś</p>
      <p className="empty-sub">Dodaj pierwsze ćwiczenie i zacznij trening!</p>
    </div>
  );
}

function TodayHeader({ count, date }) {
  const parsed = new Date(date + "T12:00:00");
  const dayName = parsed.toLocaleDateString("pl-PL", { weekday: "long" });
  const dateStr = parsed.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="today-header">
      <div className="date-block">
        <span className="day-name">{dayName}</span>
        <time className="date-str" dateTime={date}>{dateStr}</time>
      </div>
      {count > 0 && (
        <div className="exercise-count">
          <span className="count-num">{count}</span>
          <span className="count-label">
            {count === 1 ? "ćwiczenie" : count < 5 ? "ćwiczenia" : "ćwiczeń"}
          </span>
        </div>
      )}
    </div>
  );
}

function ResumeBanner({ session, onResume }) {
  if (!session) return null;

  const date = String(session.date).slice(0, 10);
  const parsed = new Date(`${date}T12:00:00`);
  const label = parsed.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="session-banner" style={{ "--session-accent": "var(--color-warn)" }}>
      <div className="session-info">
        <div className="session-title">
          Niedokończony trening
          <span className="session-badge">Wznowienia</span>
        </div>
        <div className="session-sub">
          {session.templateName || "Trening"} z {label} · {session.exerciseCount}{" "}
          {session.exerciseCount === 1 ? "ćwiczenie" : "ćwiczeń"}
        </div>
      </div>

      <button
        className="session-btn session-btn--primary"
        onClick={onResume}
        title="Wróć do niedokończonego treningu"
      >
        ▶ Wznów trening
      </button>
    </div>
  );
}

export default function WorkoutDashboard({ onExerciseChange }) {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [prevMap, setPrevMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null);
  const [session, setSession] = useState(null);
  const [resumable, setResumable] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateCount, setTemplateCount] = useState(0);
  const [searchParams] = useSearchParams();
  const paramDate = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(
    paramDate || new Date().toISOString().slice(0, 10)
  );

  const sessionStatus = session?.status ?? null;
  const sessionLocked =
    sessionStatus === SESSION_STATUS.PLANNED || sessionStatus === SESSION_STATUS.COMPLETED;

  useEffect(() => {
    if (paramDate) setSelectedDate(paramDate);
  }, [paramDate]);

  const refreshTemplates = useCallback(async () => {
    try {
      const templates = await templateAPI.getTemplates();
      setTemplateCount(Array.isArray(templates) ? templates.length : 0);
    } catch {
      setTemplateCount(0);
    }
  }, []);

  // An unfinished session survives reloads and day switches, so it is tracked
  // separately from the session of the day being viewed.
  const refreshResumable = useCallback(async () => {
    try {
      const active = await workoutAPI.getActiveSession();
      setResumable(active);
    } catch {
      setResumable(null);
    }
  }, []);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  useEffect(() => {
    refreshResumable();
  }, [refreshResumable]);

  const fetchExercises = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const [data, daySession] = await Promise.all([
        getExercisesByDate(date),
        workoutAPI.getSession(date).catch(() => null),
      ]);
      setExercises(data);
      setSession(daySession);

      const templateId = data.find((e) => e.templateId)?.templateId;
      if (templateId) {
        try {
          const prev = await templateAPI.getPreviousByTemplate(templateId);
          const map = {};
          prev.forEach((p) => {
            map[p.exerciseId] = { weight: p.weight, reps: p.reps };
          });
          setPrevMap(map);
        } catch {
          setPrevMap({});
        }
      } else {
        setPrevMap({});
      }
    } catch (e) {
      setError(e.message || "Błąd pobierania ćwiczeń");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises(selectedDate);
  }, [selectedDate, fetchExercises]);

  const handleDelete = async (userExerciseId) => {
    await deleteUserExercise(userExerciseId);
    setExercises((prev) => prev.filter((e) => e.userExerciseId !== userExerciseId));
    onExerciseChange?.();
  };

  const handleExerciseAdded = () => {
    setModalOpen(false);
    setLogTarget(null);
    fetchExercises(selectedDate);
    refreshResumable();
    onExerciseChange?.();
  };

  const handleDateSearch = (date) => {
    setSelectedDate(date);
  };

  const handleResume = () => {
    if (!resumable) return;
    setSelectedDate(String(resumable.date).slice(0, 10));
    toast("Wrócono do niedokończonego treningu.");
  };

  const handleLoadTemplate = async (templateId) => {
    setTemplateModalOpen(false);
    setActionLoading(true);
    try {
      await workoutAPI.loadTemplate(templateId, selectedDate);
      toast("Szablon dodany do tego dnia. Rozpocznij trening, aby zapisywać serie.");
      await fetchExercises(selectedDate);
      onExerciseChange?.();
    } catch (e) {
      toast(e.message || "Nie udało się wczytać szablonu.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      await workoutAPI.startWorkout(session.id);
      toast("Trening rozpoczęty. Możesz zapisywać serie.");
      await fetchExercises(selectedDate);
      await refreshResumable();
    } catch (e) {
      toast(e.message || "Nie udało się rozpocząć treningu.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      const updated = await workoutAPI.finishWorkout(session.id);
      toast(`Trening ukończony — ${(updated.totalVolume || 0).toLocaleString("pl-PL")} kg objętości.`);
      await fetchExercises(selectedDate);
      await refreshResumable();
      onExerciseChange?.();
    } catch (e) {
      toast(e.message || "Nie udało się zakończyć treningu.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!session) return;
    setActionLoading(true);
    try {
      await workoutAPI.reopenWorkout(session.id);
      toast("Trening wznowiony. Możesz dopisać kolejne serie.");
      await fetchExercises(selectedDate);
      await refreshResumable();
    } catch (e) {
      toast(e.message || "Nie udało się wznowić treningu.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogSet = (entry) => {
    setLogTarget({
      exercise: {
        id: entry.exerciseId,
        name: entry.name,
        category: entry.category,
        gifUrl: entry.gifUrl,
      },
      entry,
    });
    setModalOpen(true);
  };

  return (
    <>
      <style>{WorkoutDashboardStyles}</style>
      <div className="dashboard">
        <div className="dashboard-inner">
          <TodayHeader count={exercises.length} date={selectedDate} />
          <DateSearch selectedDate={selectedDate} onSearch={handleDateSearch} />

          <SessionBanner
            session={session}
            actionLoading={actionLoading}
            onStart={handleStart}
            onFinish={handleFinish}
            onReopen={handleReopen}
          />

          {resumable && String(resumable.date).slice(0, 10) !== selectedDate && (
            <ResumeBanner session={resumable} onResume={handleResume} />
          )}

          <div className="section-label">Trening</div>

          <div className="content">
            {loading ? (
              <div className="loading-wrap"><div className="spinner" aria-label="Ładowanie" /></div>
            ) : error ? (
              <div className="error-box" role="alert">⚠️ {error}</div>
            ) : exercises.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="exercise-list">
                {exercises.map((entry) => (
                  <ExerciseCard
                    key={entry.userExerciseId}
                    entry={entry}
                    onDelete={handleDelete}
                    prev={prevMap[entry.exerciseId]}
                    onLogSet={sessionStatus ? handleLogSet : null}
                    locked={Boolean(entry.sessionId) && sessionLocked}
                  />
                ))}
              </div>
            )}

            <div className="bottom-bar">
              <div className="template-actions">
                <button
                  className="template-btn"
                  onClick={() => setTemplateModalOpen(true)}
                  disabled={templateCount === 0 || Boolean(session) || actionLoading}
                  title={
                    templateCount === 0
                      ? "Najpierw utwórz szablon w zakładce Szablony"
                      : session
                        ? "Na ten dzień istnieje już trening"
                        : `Wczytaj jeden z ${templateCount} szablonów na ten dzień`
                  }
                >
                  📋 Załaduj szablon
                  {templateCount === 0 && " (brak szablonów)"}
                </button>
                <button
                  className="template-btn template-btn--ghost"
                  onClick={() => navigate('/templates')}
                  title="Dodaj, edytuj lub usuń szablony"
                >
                  ⚙ Szablony
                </button>
              </div>
              <button
                className="add-btn"
                onClick={() => { setLogTarget(null); setModalOpen(true); }}
                aria-label="Dodaj ćwiczenie"
                disabled={sessionLocked}
                title={sessionLocked ? "Trening jest zablokowany do edycji" : "Dodaj ćwiczenie"}
                style={sessionLocked ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <span className="add-btn-icon" aria-hidden="true">+</span>
                Dodaj ćwiczenie
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddExerciseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setLogTarget(null); }}
        onAdded={handleExerciseAdded}
        defaultDate={selectedDate}
        initialExercise={logTarget?.exercise}
        initialEntry={logTarget?.entry}
        sessionId={session?.id ?? null}
      />

      {templateModalOpen && (
        <TemplateSelectionModal
          onSelect={handleLoadTemplate}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </>
  );
}