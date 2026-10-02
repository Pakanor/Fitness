import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getExercisesByDate } from "../../api/exerciseAPI";
import Header from "../../components/layout/Header";
import FatigueAnalysis from "./FatigueAnalysis";
import WorkoutStartModal from "./WorkoutStartModal";
import { templateAPI } from "../../api/templateAPI";

const hubStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .hub-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  .hub-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #f0ede8;
    margin-bottom: 8px;
  }

  .hub-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 32px;
  }

  .today-card {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-left: 4px solid #c8f542;
    border-radius: 14px;
    padding: 24px;
    margin-bottom: 32px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }

  .today-card:hover {
    background: #1a1a1f;
    border-color: #c8f542;
  }

  .today-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .today-label {
    font-family: 'Syne', sans-serif;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #c8f542;
  }

  .today-count {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #c8f542;
  }

  .today-card-body {
    font-size: 15px;
    color: #f0ede8;
    font-weight: 500;
  }

  .today-card-hint {
    font-size: 13px;
    color: #555;
    margin-top: 8px;
  }

  .shortcuts-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .shortcut-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 14px;
    padding: 20px 24px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.1s;
    text-decoration: none;
    color: #f0ede8;
  }

  .shortcut-btn:hover {
    background: #1a1a1f;
    border-color: #333;
    transform: translateY(-1px);
  }

  .shortcut-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .shortcut-text {
    flex: 1;
  }

  .shortcut-title {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #f0ede8;
    margin-bottom: 2px;
  }

  .shortcut-desc {
    font-size: 12px;
    color: #666;
  }

  .shortcut-arrow {
    color: #444;
    font-size: 18px;
    flex-shrink: 0;
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
      <style>{hubStyles}</style>
      <div style={{ minHeight: '100vh', background: '#0d0d0f' }}>
        <Header />
        <div className="hub-container">
        <div className="hub-title">Ćwiczenia</div>
        <div className="hub-subtitle">
          {dayName}, {dateStr}
        </div>

        <div className="today-card" onClick={() => todayCount > 0 ? navigate("/exercise-start") : setShowStartModal(true)}>
          <div className="today-card-header">
            <span className="today-label">Dzisiejszy Trening</span>
            {todayCount > 0 && (
              <span className="today-count">{todayCount}</span>
            )}
          </div>
          <div className="today-card-body">
            {todayCount > 0
              ? `Masz ${todayCount} ${todayCount === 1 ? "ćwiczenie" : todayCount < 5 ? "ćwiczenia" : "ćwiczeń"} na dziś`
              : "Rozpocznij trening na dziś"}
          </div>
          <div className="today-card-hint">Kliknij aby kontynuować →</div>
        </div>

        <div className="shortcuts-grid">
          <div
            className="shortcut-btn"
            onClick={() => navigate("/exercises/records")}
          >
            <div
              className="shortcut-icon"
              style={{ background: "rgba(168,85,247,0.12)" }}
            >
              🏆
            </div>
            <div className="shortcut-text">
              <div className="shortcut-title">Rekordy i 1RM</div>
              <div className="shortcut-desc">
                Estymator siły maksymalnej i progresja
              </div>
            </div>
            <div className="shortcut-arrow">→</div>
          </div>

          <div
            className="shortcut-btn"
            onClick={() => navigate("/exercises/history")}
          >
            <div
              className="shortcut-icon"
              style={{ background: "rgba(59,130,246,0.12)" }}
            >
              📋
            </div>
            <div className="shortcut-text">
              <div className="shortcut-title">Historia Treningów</div>
              <div className="shortcut-desc">
                Przeglądaj poprzednie treningi
              </div>
            </div>
            <div className="shortcut-arrow">→</div>
          </div>
        </div>

        <FatigueAnalysis />
        </div>
      </div>

      {showStartModal && (
        <WorkoutStartModal
          onStartEmpty={handleStartEmpty}
          onStartFromTemplate={handleStartFromTemplate}
          onCopyPreviousByTemplate={handleCopyPreviousByTemplate}
          onClose={() => setShowStartModal(false)}
        />
      )}
    </>
  );
}
