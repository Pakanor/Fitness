import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getExercisesByDate } from "../../api/exerciseAPI";
import Header from "../../components/layout/Header";

const historyStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .history-page {
    max-width: 700px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: 'DM Sans', sans-serif;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .history-title {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #f0ede8;
  }

  .history-back {
    font-size: 14px;
    color: #c8f542;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    text-decoration: none;
  }

  .history-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }

  .history-day {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }

  .history-day:hover {
    background: #1a1a1f;
    border-color: #333;
  }

  .history-day-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .history-day-date {
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #f0ede8;
  }

  .history-day-count {
    font-size: 12px;
    color: #c8f542;
    font-weight: 600;
  }

  .history-day-exercises {
    font-size: 13px;
    color: #888;
  }

  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: #555;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.4;
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
`;

export default function TrainingHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadHistory = async () => {
      const days = [];
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }

      const results = [];
      for (const dateStr of days) {
        try {
          const exercises = await getExercisesByDate(dateStr);
          if (exercises.length > 0) {
            results.push({ date: dateStr, exercises });
          }
        } catch {}
      }
      setHistory(results);
      setLoading(false);
    };
    loadHistory();
  }, []);

  return (
    <>
      <style>{historyStyles}</style>
      <div style={{ minHeight: '100vh', background: '#0d0d0f' }}>
        <Header />
        <div className="history-page">
          <div className="history-header">
            <div className="history-title">Historia Treningów</div>
            <button className="history-back" onClick={() => navigate('/exercises')}>
              ← Powrót
            </button>
          </div>
        <div className="history-subtitle">Ostatnie 60 dni treningowych</div>

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Brak zapisanych treningów</p>
          </div>
        ) : (
          history.map((day) => {
            const parsed = new Date(day.date + "T12:00:00");
            const dayName = parsed.toLocaleDateString("pl-PL", {
              weekday: "long",
            });
            const dateStr = parsed.toLocaleDateString("pl-PL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const exerciseNames = [
              ...new Set(day.exercises.map((e) => e.name)),
            ].join(", ");

            return (
              <div
                key={day.date}
                className="history-day"
                onClick={() =>
                  navigate(`/exercise-start?date=${day.date}`)
                }
              >
                <div className="history-day-header">
                  <div className="history-day-date">
                    {dayName}, {dateStr}
                  </div>
                  <div className="history-day-count">
                    {day.exercises.length}{" "}
                    {day.exercises.length === 1 ? "ćwiczenie" : "ćwiczeń"}
                  </div>
                </div>
                <div className="history-day-exercises">{exerciseNames}</div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </>
  );
}
