import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  background: "#1a1a1f",
  border: "1px solid #333",
  borderRadius: 8,
  color: "#f0ede8",
  fontSize: 12,
};

const axisTick = { fill: "#666", fontSize: 11 };
const gridStroke = "#1e1e22";

function formatKg(value) {
  return `${value} kg`;
}

export default function ExerciseProgressChart({ open, exerciseId, exerciseName, onClose }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !exerciseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

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
  }, [open, exerciseId]);

  const dataPoints = progress?.dataPoints ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { background: "#111114", border: "1px solid #1e1e22" } }}
    >
      <DialogTitle
        sx={{
          color: "#f0ede8",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Progresja 1RM — {exerciseName}</span>
        <IconButton onClick={onClose} sx={{ color: "#666" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#c8f542" }} size={28} />
          </Box>
        )}

        {error && !loading && (
          <Typography sx={{ color: "#ef4444", py: 4, textAlign: "center" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && dataPoints.length === 0 && (
          <Typography sx={{ color: "#666", py: 4, textAlign: "center" }}>
            Brak zalogowanych serii dla tego ćwiczenia.
          </Typography>
        )}

        {!loading && !error && dataPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2,
                fontFamily: "'Syne', sans-serif",
              }}
            >
              <Typography sx={{ color: "#666", fontSize: 13 }}>
                Rekord e1RM:{" "}
                <span style={{ color: "#c8f542", fontWeight: 700 }}>
                  {formatKg(progress.allTimeMaxE1RM)}
                </span>
              </Typography>
            </Box>

            <Box sx={{ color: "#666", fontSize: 13, mb: 1 }}>
              Progresja 1RM w czasie
            </Box>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dataPoints} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="date" tick={axisTick} axisLine={{ stroke: gridStroke }} />
                <YAxis
                  tick={axisTick}
                  axisLine={{ stroke: gridStroke }}
                  label={{
                    value: "kg",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#666",
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
                  stroke="#c8f542"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="e1RM"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
