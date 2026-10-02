import { useState, useEffect, useCallback } from "react";
import AddExerciseModal from "./AddExerciseModal";
import { getExercisesByDate, deleteUserExercise } from "../../api/exerciseAPI";
import { templateAPI } from "../../api/templateAPI";
import DateSearch from "../../components/DateSearch";

const categoryColors = {
  chest: "#ef4444",
  back: "#3b82f6",
  legs: "#22c55e",
  shoulders: "#f59e0b",
  arms: "#a855f7",
  core: "#06b6d4",
  cardio: "#f97316",
  default: "#6b7280",
};

function getCategoryColor(category = "") {
  return categoryColors[category.toLowerCase()] ?? categoryColors.default;
}

function ExerciseCard({ entry, onDelete, prev }) {
  const color = getCategoryColor(entry.category);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(entry.userExerciseId);
    } catch {
      setDeleting(false);
    }
  };

  const showPrevHint = prev && entry.weight == null && entry.reps == null;

  return (
    <div className="exercise-card" style={{ "--accent": color }}>
      <div className="card-left">
        {entry.gifUrl ? (
          <img
            src={`http://localhost:8000${entry.gifUrl}`}
            alt={entry.name}
            className="exercise-gif"
          />
        ) : (
          <div className="exercise-gif placeholder-gif">
            <span>💪</span>
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
              <span className="stat-value" style={{ color: '#c8f542' }}>{entry.rpe}</span>
              <span className="stat-label">RPE</span>
            </div>
          )}
          {entry.rir != null && (
            <div className="stat">
              <span className="stat-value" style={{ color: '#a855f7' }}>{entry.rir}</span>
              <span className="stat-label">RIR</span>
            </div>
          )}
        </div>
        {showPrevHint && (
          <div className="prev-hint">
            Poprzednio: {prev.weight} kg x {prev.reps} powt.
          </div>
        )}
      </div>
      <button
        className={`delete-btn ${deleting ? "deleting" : ""}`}
        onClick={handleDelete}
        disabled={deleting}
        title="Usuń"
      >
        {deleting ? "⏳" : "×"}
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🏋️</div>
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
        <span className="date-str">{dateStr}</span>
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

export default function WorkoutDashboard({ onExerciseChange }) {
  const [exercises, setExercises] = useState([]);
  const [prevMap, setPrevMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const fetchExercises = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExercisesByDate(date);
      setExercises(data);

      // Type-safe: if the session was copied from a template, fetch the prior
      // completed workout for that template to render "Poprzednio" hints.
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
    fetchExercises(selectedDate);
    onExerciseChange?.();
  };

  const handleDateSearch = (date) => {
    setSelectedDate(date);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .dashboard {
          height: calc(100vh - 52px);
          background: #0d0d0f;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dashboard-inner {
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 20px 0;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .exercise-list {
          flex: 1;
          overflow-y: auto;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
        }

        .bottom-bar {
          flex-shrink: 0;
          padding: 16px 0 24px;
          background: #0d0d0f;
          border-top: 1px solid #1e1e22;
        }

        .today-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #1e1e22;
        }

        .date-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .day-name {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          text-transform: capitalize;
          line-height: 1;
          color: #f0ede8;
        }

        .date-str {
          font-size: 13px;
          color: #666;
          font-weight: 300;
        }

        .exercise-count {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .count-num {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          color: #c8f542;
        }

        .count-label {
          font-size: 12px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #444;
          margin-bottom: 12px;
          font-weight: 500;
        }

        .exercise-card:hover {
          background: #1a1a1f;
        }

        .card-left {
          flex-shrink: 0;
        }

        .exercise-gif {
          width: 90px;
          height: 90px;
          border-radius: 8px;
          object-fit: cover;
          background: #1e1e22;
        }

        .placeholder-gif {
          width: 90px;
          height: 90px;
          border-radius: 8px;
          background: #1e1e22;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .exercise-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #16161a;
          border: 1px solid #1e1e22;
          border-left: 3px solid var(--accent);
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
          min-height: 110px;
        }

        .card-body {
          flex: 1;
          min-width: 0;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .exercise-name {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #f0ede8;
          text-transform: capitalize;
          line-height: 1.2;
        }

        .category-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 2px 7px;
          border-radius: 20px;
          color: #0d0d0f;
          flex-shrink: 0;
        }

        .stats-row {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #f0ede8;
          line-height: 1;
        }

        .stat-label {
          font-size: 10px;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .prev-hint {
          margin-top: 8px;
          font-size: 12px;
          color: #6b6b72;
          font-style: italic;
          line-height: 1.3;
        }

        .delete-btn {
          position: absolute;
          top: 10px;
          right: 12px;
          background: none;
          border: none;
          color: #3a3a40;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
        }

        .delete-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.08);
        }

        .delete-btn.deleting {
          color: #555;
          cursor: default;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 20px;
          text-align: center;
          gap: 8px;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 8px;
          opacity: 0.4;
        }

        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #3a3a40;
        }

        .empty-sub {
          font-size: 13px;
          color: #2a2a2f;
        }

        .loading-wrap {
          display: flex;
          justify-content: center;
          padding: 48px 0;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid #1e1e22;
          border-top-color: #c8f542;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .error-box {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 14px 16px;
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .add-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 16px 20px;
          background: #c8f542;
          color: #0d0d0f;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: -0.2px;
        }

        .add-btn:hover {
          background: #d4f55a;
          transform: translateY(-1px);
        }

        .add-btn:active {
          transform: translateY(0);
        }

        .add-btn-icon {
          width: 26px;
          height: 20px;
          background: #0d0d0f;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          color: #c8f542;
          flex-shrink: 0;
        }
      `}</style>

      <div className="dashboard">
        <div className="dashboard-inner">
          <TodayHeader count={exercises.length} date={selectedDate} />
          <DateSearch selectedDate={selectedDate} onSearch={handleDateSearch} />
          <div className="section-label">Trening</div>

          <div className="content">
            {loading ? (
              <div className="loading-wrap"><div className="spinner" /></div>
            ) : error ? (
              <div className="error-box">⚠️ {error}</div>
            ) : exercises.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="exercise-list">
                {exercises.map((entry) => (
                  <ExerciseCard key={entry.userExerciseId} entry={entry} onDelete={handleDelete} prev={prevMap[entry.exerciseId]} />
                ))}
              </div>
            )}

            <div className="bottom-bar">
              <button className="add-btn" onClick={() => setModalOpen(true)}>
                <span className="add-btn-icon">+</span>
                Dodaj ćwiczenie
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={handleExerciseAdded}
        defaultDate={selectedDate}
      />
    </>
  );
}