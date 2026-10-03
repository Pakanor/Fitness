import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  LineChart,
  Line,
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
          Rekord e1RM:{" "}
          <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
            {formatKg(progress.allTimeMaxE1RM)}
          </span>
        </Typography>
      </Box>

      <Box sx={{ color: "var(--color-fg-muted)", fontSize: 12, mb: 1, textAlign: "center" }}>
        Progresja e1RM w czasie
      </Box>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={dataPoints}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis dataKey="date" tick={axisTick} axisLine={{ stroke: gridStroke }} />
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
            formatter={(value) => [formatKg(value), "e1RM"]}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="maxE1RM"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="e1RM"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
