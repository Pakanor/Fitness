import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getExerciseProgress } from "../../api/exerciseAPI";

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
function ProgressTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  return (
    <Box sx={{ ...tooltipStyle, p: 1.25 }}>
      <div>Data: {formatDate(point.date)}</div>
      <div>e1RM: {formatKg(point.maxE1RM)}</div>
      <div>Top set: {formatKg(point.topSetWeight)} x {point.topSetReps}</div>
      <div>RPE: {point.topSetRpe ?? "-"}</div>
    </Box>
  );
}

function ConfidenceDot({ cx, cy, payload, uncertain = false }) {
  if (cx == null || cy == null) return null;

  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={uncertain ? "var(--color-fg-muted)" : "var(--color-accent)"} opacity={uncertain ? 0.65 : 1} />
      {uncertain && <text x={cx + 6} y={cy - 6} fill="var(--color-fg-muted)" fontSize={10}>!</text>}
    </g>
  );
}

const axisTick = { fill: "var(--color-fg-muted)", fontSize: 11 };
const gridStroke = "var(--color-border-subtle)";

export function formatKg(value) {
  return `${value} kg`;
}

export default function E1RMProgressChart({ exerciseId, startDate, endDate }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exerciseId) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setProgress(null);

    getExerciseProgress(exerciseId, startDate, endDate)
      .then((data) => {
        if (!cancelled) setProgress(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseId, startDate, endDate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress sx={{ color: "var(--color-accent)" }} size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography sx={{ color: "#ef4444", py: 3, textAlign: "center" }}>
        {error}
      </Typography>
    );
  }

  const dataPoints = [...(progress?.dataPoints ?? [])]
    .filter((point) => typeof point.maxE1RM === "number")
    .sort((left, right) => left.date.localeCompare(right.date));

  if (!progress) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi"><span>All-Time PR</span><strong>{formatKg(progress.allTimePrWeight)} x {progress.allTimePrReps}</strong></div>
        <div className="analytics-kpi"><span>Best e1RM</span><strong>{formatKg(progress.allTimeMaxE1RM)}</strong></div>
        <div className="analytics-kpi"><span>Wykonane serie</span><strong>{progress.totalSets}</strong></div>
        <div className="analytics-kpi"><span>Ostatnio wykonywane</span><strong>{progress.lastPerformedDate ?? "-"}</strong></div>
      </div>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 1,
          fontFamily: "'Syne', sans-serif",
        }}
      >
        <Typography sx={{ color: "var(--color-fg-muted)", fontSize: 13 }}>
          Najwyższe e1RM:{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
            {formatKg(progress.allTimeMaxE1RM)}
          </span>
        </Typography>
      </Box>

      <Box sx={{ color: "var(--color-fg-muted)", fontSize: 12, mb: 1, textAlign: "center" }}>
        Siła w każdej sesji
      </Box>

      <div className="analytics-detail-grid">
      <section className="analytics-panel analytics-panel-wide">
      <h2>Progresja e1RM i Top Set</h2>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart
          data={dataPoints}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="date"
            type="category"
            allowDuplicatedCategory={false}
            tickFormatter={formatDate}
            tick={axisTick}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            tick={axisTick}
            axisLine={{ stroke: gridStroke }}
            label={{
              value: "kg",
              angle: -90,
              position: "insideLeft",
              fill: "var(--color-fg-muted)",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            content={<ProgressTooltip />}
          />
          <Line
            type="monotone"
            dataKey="maxE1RM"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={(props) => <ConfidenceDot {...props} uncertain={!props.payload.hasRpe} />}
            name="e1RM"
          />
          <Line
            type="monotone"
            dataKey="topSetWeight"
            stroke="var(--color-info)"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Top set"
          />
        </LineChart>
      </ResponsiveContainer>
        <Box sx={{ color: "var(--color-fg-muted)", fontSize: 10, mt: 0.5 }}>
          Wskazówka: brak RPE oznacza założenie serii do załamania i może zaniżać wyliczaną siłę.
        </Box>
      </section>

      <section className="analytics-panel">
        <h2>Tonaż i powtórzenia w sesji</h2>
        <ResponsiveContainer width="100%" height={170}>
          <ComposedChart data={progress.workload ?? []} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis yAxisId="tonnage" tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <YAxis yAxisId="reps" orientation="right" tick={axisTick} axisLine={{ stroke: gridStroke }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar yAxisId="tonnage" dataKey="tonnage" fill="var(--color-accent)" name="Tonaż (kg)" radius={[3, 3, 0, 0]} />
            <Line yAxisId="reps" type="monotone" dataKey="averageReps" stroke="var(--color-info)" strokeWidth={2} name="Średnie powtórzenia" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      </div>

    </motion.div>
  );
}

