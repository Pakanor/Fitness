import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getTrainingOverview } from "../../api/exerciseAPI";

const axisTick = { fill: "var(--color-fg-muted)", fontSize: 11 };
const gridStroke = "var(--color-border-subtle)";
const tooltipStyle = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-fg-disabled)",
  borderRadius: 8,
  color: "var(--color-fg-primary)",
  fontSize: 12,
};

function formatDate(value) {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCalendarDays(startDate, endDate, activity) {
  const byDate = new Map(activity.map((day) => [day.date, day.hardSets]));
  const days = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const date = current.toISOString().slice(0, 10);
    days.push({ date, hardSets: byDate.get(date) ?? 0 });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export default function TrainingOverview({ startDate, endDate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTrainingOverview(startDate, endDate)
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [startDate, endDate]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: "var(--color-accent)" }} size={28} /></Box>;
  if (error) return <Typography sx={{ color: "#ef4444", py: 4, textAlign: "center" }}>{error}</Typography>;
  if (!overview) return null;

  const activityDays = startDate && endDate
    ? getCalendarDays(startDate, endDate, overview.activity ?? [])
    : overview.activity ?? [];
  const maxHardSets = Math.max(...activityDays.map((day) => Number(day.hardSets)), 1);

  return (
    <div className="analytics-overview-grid">
      <section className="analytics-panel analytics-panel-wide">
        <h2>Objętość efektywna wg partii</h2>
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={overview.muscleVolume} margin={{ top: 8, right: 16, bottom: 55, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <ReferenceArea y1={10} y2={20} fill="#22c55e" fillOpacity={0.12} />
            <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} serii`, "Hard sets"]} />
            <Bar dataKey="hardSets" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="analytics-panel">
        <h2>Częstotliwość treningów</h2>
        <div className="activity-heatmap">
          {activityDays.map((day) => (
            <div key={day.date} className="activity-cell" title={`${day.date}: ${day.hardSets} serii`} style={{ opacity: day.hardSets ? 0.25 + Number(day.hardSets) / maxHardSets * 0.75 : 0.12 }} />
          ))}
        </div>
        <div className="activity-legend"><span>mniej</span><i /><i /><i /><i /><span>więcej</span></div>
      </section>

      <section className="analytics-panel analytics-panel-wide">
        <h2>Objętość tygodniowa vs średnie RPE</h2>
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={overview.weeklyTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="week" tickFormatter={formatDate} tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis yAxisId="sets" tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis yAxisId="rpe" orientation="right" domain={[0, 10]} tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line yAxisId="sets" type="monotone" dataKey="hardSets" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} name="Hard sets" />
            <Line yAxisId="rpe" type="monotone" dataKey="averageRpe" stroke="var(--color-info)" strokeWidth={2} dot={{ r: 3 }} name="Średnie RPE" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
