import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceArea,
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

const axisTick = { fill: "var(--color-fg-muted)", fontSize: 11 };
const gridStroke = "var(--color-border-subtle)";

export function formatKg(value) {
  return `${value} kg`;
}

export default function E1RMProgressChart({ exerciseId }) {
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

    getExerciseProgress(exerciseId)
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
  }, [exerciseId]);

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

  const dataPoints = (progress?.dataPoints ?? []).filter(
    (point) => typeof point.maxE1RM === "number"
  );

  if (dataPoints.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
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

      <ResponsiveContainer width="100%" height={220}>
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
            dot={{ r: 3 }}
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

      <MuscleAnalytics analytics={progress.muscleAnalytics ?? []} />
    </motion.div>
  );
}

function MuscleAnalytics({ analytics }) {
  const [selectedKey, setSelectedKey] = useState(analytics[0]?.key ?? "");
  const selected = analytics.find((item) => item.key === selectedKey) ?? analytics[0];

  useEffect(() => {
    if (!analytics.some((item) => item.key === selectedKey)) {
      setSelectedKey(analytics[0]?.key ?? "");
    }
  }, [analytics, selectedKey]);

  if (!selected) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography sx={{ color: "var(--color-fg-muted)", fontSize: 12 }}>
          Objętość efektywna: hard sets / tydzień
        </Typography>
        <select
          value={selected.key}
          onChange={(event) => setSelectedKey(event.target.value)}
          style={{ background: "var(--color-bg-elevated)", color: "var(--color-fg-primary)", border: `1px solid ${gridStroke}`, borderRadius: 6, padding: "5px 8px" }}
        >
          {analytics.map((item) => <option key={item.key} value={item.key}>{item.name}</option>)}
        </select>
      </Box>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={selected.weeklyHardSets} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <ReferenceArea y1={10} y2={20} fill="#22c55e" fillOpacity={0.12} />
          <XAxis dataKey="week" tickFormatter={formatDate} tick={axisTick} axisLine={{ stroke: gridStroke }} />
          <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} serii`, "Hard sets"]} />
          <Bar dataKey="hardSets" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <Typography sx={{ color: "var(--color-fg-muted)", fontSize: 12, mt: 2, mb: 1 }}>
        Rozkład stresorów: zakresy powtórzeń
      </Typography>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={selected.repRanges} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="range" tickFormatter={(value) => `${value} powt.`} tick={axisTick} axisLine={{ stroke: gridStroke }} />
          <YAxis tick={axisTick} axisLine={{ stroke: gridStroke }} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} serii`, "Hard sets"]} />
          <Bar dataKey="hardSets" fill="var(--color-info)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
