import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getExercisesByDate } from "../../api/exerciseAPI";
import Header from "../../components/layout/Header";
import WorkoutStartModal from "./WorkoutStartModal";
import { templateAPI } from "../../api/templateAPI";
import '../../styles/tokens.css';

const ExerciseHubStyles = `
  .hub-page {
    min-height: 100vh;
    background: var(--color-bg-base);
    display: flex;
    flex-direction: column;
  }

  .hub-main {
    flex: 1;
    max-width: var(--container-narrow);
    width: 100%;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4) var(--space-10);
    display: flex;
    flex-direction: column;
  }

  .hub-header {
    margin-bottom: var(--space-8);
  }

  .hub-title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-bottom: var(--space-2);
  }

  .hub-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--color-fg-primary);
  }

  .hub-date {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--color-fg-muted);
    white-space: nowrap;
  }

  .hub-subtitle {
    font-size: 14px;
    color: var(--color-fg-secondary);
  }

  .today-section {
    margin-bottom: var(--space-8);
  }

  .today-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-left: 4px solid var(--color-accent);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base), transform var(--transition-fast), box-shadow var(--transition-base);
  }

  .today-card:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-accent);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .today-card:active {
    transform: translateY(0);
  }

  .today-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .today-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--color-accent);
  }

  .today-count {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 800;
    color: var(--color-accent);
    line-height: 1;
  }

  .today-card-body {
    font-size: 15px;
    color: var(--color-fg-primary);
    font-weight: 500;
    margin-bottom: var(--space-2);
  }

  .today-card-hint {
    font-size: 12px;
    color: var(--color-fg-disabled);
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .shortcuts-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .shortcut-btn {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-5);
    cursor: pointer;
    transition: border-color var(--transition-base), background var(--transition-base), transform var(--transition-fast), box-shadow var(--transition-base);
    text-decoration: none;
    color: var(--color-fg-primary);
  }

  .shortcut-btn:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border-default);
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
  }

  .shortcut-btn:active {
    transform: translateX(0);
  }

  .shortcut-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  .shortcut-icon--purple {
    background: var(--color-info-dim);
  }

  .shortcut-icon--blue {
    background: var(--color-info-dim);
  }

  .shortcut-text {
    flex: 1;
    min-width: 0;
  }

  .shortcut-title {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-fg-primary);
    margin-bottom: var(--space-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shortcut-desc {
    font-size: 12px;
    color: var(--color-fg-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shortcut-arrow {
    color: var(--color-fg-disabled);
    font-size: 18px;
    flex-shrink: 0;
    transition: transform var(--transition-fast), color var(--transition-fast);
  }

  .shortcut-btn:hover .shortcut-arrow {
    transform: translateX(4px);
    color: var(--color-accent);
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: fadeIn var(--transition-base) ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 600px) {
    .hub-title {
      font-size: 22px;
    }

    .today-count {
      font-size: 22px;
    }

    .shortcut-btn {
      padding: var(--space-3) var(--space-4);
    }

    .shortcut-icon {
      width: 40px;
      height: 40px;
    }
  }
`;

export default function ExerciseHub() {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [todayDate] = useState(new Date().toISOString().slice(0, 10));
  const [showStartModal, setShowStartModal] = useState(false);

  useEffect(() => {
    getExercisesByDate(todayDate)
      .then((data) => setTodayCount(data.length))
      .catch(() => {});
  }, [todayDate]);

  const parsed = new Date(todayDate + "T12:00:00");
  const dayName = parsed.toLocaleDateString("pl-PL", { weekday: "long" });
  const dateStr = parsed.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });

  const handleStartEmpty = () => {
    setShowStartModal(false);
    navigate("/exercise-start");
  };

  const handleStartFromTemplate = async (templateId) => {
    try {
      await templateAPI.startFromTemplate(templateId);
    } catch (e) {
      console.error("Error starting from template:", e);
    }
    setShowStartModal(false);
    navigate("/exercise-start");
  };

  const handleCopyPreviousByTemplate = async (templateId) => {
    try {
      await templateAPI.copyPreviousByTemplate(templateId);
    } catch (e) {
      console.error("Error copying previous workout by template:", e);
    }
    setShowStartModal(false);
    navigate("/exercise-start");
  };

  return (
    <>
      <style>{ExerciseHubStyles}</style>
      <div className="hub-page">
        <Header />
        <main className="hub-main" role="main">
          <div className="hub-header">
            <div className="hub-title-row">
              <h1 className="hub-title">Ćwiczenia</h1>
              <time className="hub-date" dateTime={todayDate}>
                {dayName}, {dateStr}
              </time>
            </div>
            <p className="hub-subtitle">Dzisiejszy plan treningowy</p>
          </div>

          <section className="today-section" aria-labelledby="today-heading">
            <div
              className="today-card"
              onClick={() => todayCount > 0 ? navigate("/exercise-start") : setShowStartModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); todayCount > 0 ? navigate("/exercise-start") : setShowStartModal(true); }}}
              aria-label={todayCount > 0 ? `Kontynuuj dzisiejszy trening (${todayCount} ćwiczeń)` : 'Rozpocznij dzisiejszy trening'}
            >
              <div className="today-card-header">
                <span className="today-label" id="today-heading">Dzisiejszy Trening</span>
                {todayCount > 0 && (
                  <span className="today-count" aria-label={`${todayCount} ćwiczeń`}>{todayCount}</span>
                )}
              </div>
              <div className="today-card-body">
                {todayCount > 0
                  ? `Masz ${todayCount} ${todayCount === 1 ? "ćwiczenie" : todayCount < 5 ? "ćwiczenia" : "ćwiczeń"} na dziś`
                  : "Rozpocznij trening na dziś"}
              </div>
              <div className="today-card-hint">
                <span aria-hidden="true">→</span> Kliknij aby kontynuować
              </div>
            </div>
          </section>

          <section className="shortcuts-section" aria-label="Szybkie akcje">
            <a
              href="/records"
              className="shortcut-btn"
              onClick={(e) => { e.preventDefault(); navigate("/records"); }}
            >
              <div className="shortcut-icon shortcut-icon--purple" aria-hidden="true">🏆</div>
              <div className="shortcut-text">
                <div className="shortcut-title">Rekordy życiowe</div>
                <div className="shortcut-desc">Najlepsze wyniki i progresja e1RM</div>
              </div>
              <div className="shortcut-arrow" aria-hidden="true">→</div>
            </a>

            <a
              href="/exercises/history"
              className="shortcut-btn"
              onClick={(e) => { e.preventDefault(); navigate("/exercises/history"); }}
            >
              <div className="shortcut-icon shortcut-icon--blue" aria-hidden="true">📋</div>
              <div className="shortcut-text">
                <div className="shortcut-title">Historia Treningów</div>
                <div className="shortcut-desc">Przeglądaj poprzednie treningi</div>
              </div>
              <div className="shortcut-arrow" aria-hidden="true">→</div>
            </a>
          </section>
        </main>

        {showStartModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <WorkoutStartModal
              onStartEmpty={handleStartEmpty}
              onStartFromTemplate={handleStartFromTemplate}
              onCopyPreviousByTemplate={handleCopyPreviousByTemplate}
              onClose={() => setShowStartModal(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}