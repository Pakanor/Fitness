import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
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
      </section>

      <Box sx={{ color: "var(--color-fg-muted)", fontSize: 11, mt: 1, px: 1 }}>
        Wskazówka: Brak podanego RPE w treningu oznacza założenie serii do załamania, co może zaniżać wyliczaną siłę na wykresie.
      </Box>

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

      <section className="analytics-panel">
        <h2>Rozkład zakresów powtórzeń</h2>
        <ResponsiveContainer width="100%" height={170}>
          <PieChart>
            <Pie data={progress.repRanges ?? []} dataKey="sets" nameKey="range" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {(progress.repRanges ?? []).map((entry, index) => <Cell key={entry.range} fill={["var(--color-accent)", "var(--color-info)", "var(--color-success)"][index % 3]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} serii`, "Zakres"]} />
          </PieChart>
        </ResponsiveContainer>
      </section>
      </div>

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
      <ResponsiveContainer width="100%" height={165}>
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
      <ResponsiveContainer width="100%" height={145}>
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
