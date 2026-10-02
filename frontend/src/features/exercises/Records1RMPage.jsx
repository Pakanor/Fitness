import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Header from "../../components/layout/Header";

const API_BASE = "";

const LIFT_COLORS = {
  0: "#c8f542",
  1: "#3b82f6",
  2: "#ef4444",
  3: "#a855f7",
  4: "#f59e0b",
  5: "#06b6d4",
};

const recordsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .records-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: 'DM Sans', sans-serif;
  }

  .records-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .records-title {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: #f0ede8;
  }

  .records-back {
    font-size: 14px;
    color: #c8f542;
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Sans', sans-serif;
    text-decoration: none;
  }

  .records-subtitle {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
  }

  .rm-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 12px;
    margin-bottom: 28px;
  }

  .rm-card {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 12px;
    padding: 18px 16px;
    text-align: center;
  }

  .rm-card-name {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #888;
    margin-bottom: 8px;
  }

  .rm-card-value {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #f0ede8;
    line-height: 1;
  }

  .rm-card-unit {
    font-size: 14px;
    color: #666;
    font-weight: 400;
  }

  .chart-section {
    background: #16161a;
    border: 1px solid #1e1e22;
    border-radius: 14px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .chart-label {
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 16px;
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

export default function Records1RMPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/records/1rm-progression`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Błąd pobierania danych");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allChartData = {};
  if (data?.lifts) {
    data.lifts.forEach((lift, idx) => {
      lift.history.forEach((h) => {
        const key = new Date(h.date).toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "short",
        });
        if (!allChartData[key]) allChartData[key] = { date: key };
        allChartData[key][lift.liftName] = h.estimated1RM;
      });
    });
  }

  const chartData = Object.values(allChartData);

  return (
    <>
      <style>{recordsStyles}</style>
      <div style={{ minHeight: '100vh', background: '#0d0d0f' }}>
        <Header />
        <div className="records-page">
          <div className="records-header">
            <div className="records-title">Rekordy i 1RM</div>
            <button className="records-back" onClick={() => navigate('/exercises')}>
              ← Powrót
            </button>
          </div>
        <div className="records-subtitle">
          Estymator siły maksymalnej (wzór Epley) i progresja
        </div>

        {loading ? (
          <div className="loading-wrap">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 10,
              padding: 14,
              color: "#ef4444",
              fontSize: 14,
            }}
          >
            ⚠️ {error}
          </div>
        ) : !data?.lifts?.length ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Brak danych o rekordach</p>
            <p style={{ fontSize: 13, color: "#444", marginTop: 8 }}>
              Dodaj ćwiczenia z wagą i powtórzeniami, aby zobaczyć estymowany 1RM
            </p>
          </div>
        ) : (
          <>
            <div className="rm-cards">
              {data.lifts.map((lift, idx) => (
                <div className="rm-card" key={lift.liftName}>
                  <div className="rm-card-name">{lift.liftName}</div>
                  <div
                    className="rm-card-value"
                    style={{ color: LIFT_COLORS[idx % 6] }}
                  >
                    {lift.current1RM.toFixed(1)}
                    <span className="rm-card-unit"> kg</span>
                  </div>
                </div>
              ))}
            </div>

            {chartData.length > 1 && (
              <div className="chart-section">
                <div className="chart-label">Progresja 1RM w czasie</div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#666", fontSize: 11 }}
                      axisLine={{ stroke: "#1e1e22" }}
                    />
                    <YAxis
                      tick={{ fill: "#666", fontSize: 11 }}
                      axisLine={{ stroke: "#1e1e22" }}
                      label={{
                        value: "kg",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#666",
                        fontSize: 11,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1f",
                        border: "1px solid #333",
                        borderRadius: 8,
                        color: "#f0ede8",
                        fontSize: 12,
                      }}
                    />
                    {data.lifts.map((lift, idx) => (
                      <Line
                        key={lift.liftName}
                        type="monotone"
                        dataKey={lift.liftName}
                        stroke={LIFT_COLORS[idx % 6]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name={lift.liftName}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  );
}
