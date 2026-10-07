import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
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

function getCalendarWeeks(startDate, endDate, activity) {
  const byDate = new Map(activity.map((day) => [day.date, day.hardSets]));
  const firstDate = new Date(`${startDate}T00:00:00`);
  const lastDate = new Date(`${endDate}T00:00:00`);
  const firstMonday = new Date(firstDate);
  firstMonday.setDate(firstMonday.getDate() - ((firstMonday.getDay() + 6) % 7));
  const lastSunday = new Date(lastDate);
  lastSunday.setDate(lastSunday.getDate() + (7 - lastSunday.getDay()) % 7);
  const weeks = [];
  const current = new Date(firstMonday);

  while (current <= lastSunday) {
    const week = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = [current.getFullYear(), current.getMonth() + 1, current.getDate()]
        .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
        .join("-");
      week.push({ date, hardSets: byDate.get(date) ?? 0, dayIndex });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export default function TrainingOverview({ startDate, endDate }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTrainingOverview(startDate, endDate, timeZone)
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((requestError) => { if (!cancelled) setError(requestError.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [startDate, endDate, timeZone]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: "var(--color-accent)" }} size={28} /></Box>;
  if (error) return <Typography sx={{ color: "#ef4444", py: 4, textAlign: "center" }}>{error}</Typography>;
  if (!overview) return null;

  const activity = overview.activity ?? [];
  const fallbackStart = activity[0]?.date ?? new Date().toISOString().slice(0, 10);
  const fallbackEnd = activity.at(-1)?.date ?? fallbackStart;
  const activityWeeks = getCalendarWeeks(startDate ?? fallbackStart, endDate ?? fallbackEnd, activity);
  const formatMuscleLabel = (value) => value.length > 14 ? `${value.slice(0, 13)}...` : value;

  return (
    <div className="analytics-overview-grid">
      <section className="analytics-panel analytics-panel-wide">
        <h2>Średnia objętość efektywna wg partii (hard sets / tydzień)</h2>
        <ResponsiveContainer width="100%" height={145}>
          <BarChart data={overview.muscleVolume} margin={{ top: 4, right: 12, bottom: 42, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <ReferenceArea y1={10} y2={20} fill="#22c55e" fillOpacity={0.12} />
            <ReferenceLine y={10} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
            <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
            <XAxis dataKey="name" tickFormatter={formatMuscleLabel} angle={-25} textAnchor="end" interval={0} tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} serii / tydzień`, "Średnia"]} />
            <Bar dataKey="hardSets" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="analytics-panel analytics-activity-panel">
        <h2>Częstotliwość treningów</h2>
        <div
          className="activity-heatmap"
          style={{
            gridTemplateColumns: `repeat(${Math.max(activityWeeks.length, 1)}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, minmax(12px, 1fr))",
          }}
        >
          {activityWeeks.flatMap((week, weekIndex) => week.map((day) => (
            <div
              key={day.date}
              className={`activity-cell activity-level-${day.hardSets === 0 ? 0 : day.hardSets <= 6 ? 1 : day.hardSets <= 14 ? 2 : 3}`}
              style={{ gridColumn: weekIndex + 1, gridRow: day.dayIndex + 1 }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          )))}
        </div>
        {hoveredDay && <div className="activity-tooltip">{hoveredDay.date}: {hoveredDay.hardSets} serii</div>}
        <div className="activity-legend"><span>mniej</span><i /><i /><i /><i /><span>więcej</span></div>
      </section>

      <section className="analytics-panel">
        <h2>Objętość tygodniowa vs średnie RPE</h2>
        <ResponsiveContainer width="100%" height={125}>
          <LineChart data={overview.weeklyTrend} margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
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
