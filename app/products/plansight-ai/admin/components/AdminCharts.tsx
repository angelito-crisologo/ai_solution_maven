"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const COLOR_PRIMARY = "#0e7490"; // cyan-700
const COLOR_SECONDARY = "#7c3aed"; // violet-600
const COLOR_DANGER = "#b91c1c"; // red-700
const AXIS_STROKE = "#cbd5e1"; // slate-300
const TICK_FILL = "#475569"; // slate-600
const GRID_STROKE = "#e2e8f0"; // slate-200

function formatDateTick(value: string) {
  // expects "YYYY-MM-DD"
  return value.slice(5); // "MM-DD"
}

function formatBytesTick(value: number) {
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)}MB`;
  if (value >= 1024) return `${Math.round(value / 1024)}KB`;
  return `${value}B`;
}

function formatMsTick(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${value}ms`;
}

// ---------------------------------------------------------------------------
// Line chart — daily counts (uploads, AI cost, share views)
// ---------------------------------------------------------------------------

type LineSeries = {
  dataKey: string;
  label: string;
  color: string;
};

type DailyLineChartProps = {
  data: Array<Record<string, string | number>>;
  /** name of the date field on each row, default "date" */
  xKey?: string;
  series: LineSeries[];
  yFormatter?: (value: number) => string;
  ariaLabel?: string;
};

export function DailyLineChart({
  data,
  xKey = "date",
  series,
  yFormatter,
  ariaLabel
}: DailyLineChartProps) {
  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={formatDateTick}
          />
          <YAxis
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={yFormatter}
            width={60}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return String(value);
              return yFormatter ? yFormatter(n) : n.toLocaleString();
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar chart — failure stages, cost by feature
// ---------------------------------------------------------------------------

type BarChartProps = {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  yLabel?: string;
  ariaLabel?: string;
  color?: string;
  yFormatter?: (value: number) => string;
};

export function CategoryBarChart({
  data,
  xKey,
  yKey,
  yLabel,
  ariaLabel,
  color = COLOR_PRIMARY,
  yFormatter
}: BarChartProps) {
  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: TICK_FILL }} />
          <YAxis
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={yFormatter}
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 11, fill: TICK_FILL } }
                : undefined
            }
            width={60}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return String(value);
              return yFormatter ? yFormatter(n) : n.toLocaleString();
            }}
          />
          <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scatter chart — file size vs parse time
// ---------------------------------------------------------------------------

type ScatterDatum = {
  x: number;
  y: number;
};

type ScatterChartProps = {
  data: ScatterDatum[];
  xLabel: string;
  yLabel: string;
  xFormatter?: (value: number) => string;
  yFormatter?: (value: number) => string;
  ariaLabel?: string;
};

export function FileSizeScatter({
  data,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
  ariaLabel
}: ScatterChartProps) {
  return (
    <div className="h-72 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 8, right: 16, bottom: 30, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={xFormatter ?? formatBytesTick}
            label={{
              value: xLabel,
              position: "insideBottom",
              offset: -10,
              style: { fontSize: 11, fill: TICK_FILL }
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={yFormatter ?? formatMsTick}
            width={60}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return [String(value), String(name)];
              if (name === "x") return [xFormatter ? xFormatter(n) : formatBytesTick(n), xLabel];
              return [yFormatter ? yFormatter(n) : formatMsTick(n), yLabel];
            }}
          />
          <Scatter data={data} fill={COLOR_PRIMARY} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// Re-export colors for callers that want consistent palette.
export const ADMIN_CHART_COLORS = {
  primary: COLOR_PRIMARY,
  secondary: COLOR_SECONDARY,
  danger: COLOR_DANGER
} as const;
