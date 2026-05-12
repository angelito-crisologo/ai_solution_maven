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
import {
  ADMIN_CHART_COLORS,
  type ChartValueFormat
} from "../chart-constants";

const COLOR_PRIMARY = ADMIN_CHART_COLORS.primary;
const AXIS_STROKE = "#cbd5e1"; // slate-300
const TICK_FILL = "#475569"; // slate-600
const GRID_STROKE = "#e2e8f0"; // slate-200

function formatDateTick(value: string) {
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

function formatUsdTick(value: number) {
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(4)}`;
}

function formatIntTick(value: number) {
  return value.toLocaleString();
}

function pickTickFormatter(format?: ChartValueFormat) {
  if (format === "usd") return formatUsdTick;
  if (format === "ms") return formatMsTick;
  if (format === "bytes") return formatBytesTick;
  if (format === "int") return formatIntTick;
  return undefined;
}

function pickValueFormatter(format?: ChartValueFormat) {
  return pickTickFormatter(format) ?? formatIntTick;
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
  xKey?: string;
  series: LineSeries[];
  // Discriminator string — functions can't cross the server→client boundary.
  valueFormat?: ChartValueFormat;
  ariaLabel?: string;
};

export function DailyLineChart({
  data,
  xKey = "date",
  series,
  valueFormat,
  ariaLabel
}: DailyLineChartProps) {
  const tickFormatter = pickTickFormatter(valueFormat);
  const valueFormatter = pickValueFormatter(valueFormat);
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
            tickFormatter={tickFormatter}
            width={60}
          />
          <Tooltip
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return String(value);
              return valueFormatter(n);
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
  valueFormat?: ChartValueFormat;
};

export function CategoryBarChart({
  data,
  xKey,
  yKey,
  yLabel,
  ariaLabel,
  color = COLOR_PRIMARY,
  valueFormat
}: BarChartProps) {
  const tickFormatter = pickTickFormatter(valueFormat);
  const valueFormatter = pickValueFormatter(valueFormat);
  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} stroke={AXIS_STROKE} tick={{ fontSize: 11, fill: TICK_FILL }} />
          <YAxis
            stroke={AXIS_STROKE}
            tick={{ fontSize: 11, fill: TICK_FILL }}
            tickFormatter={tickFormatter}
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
              return valueFormatter(n);
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
  xValueFormat?: ChartValueFormat;
  yValueFormat?: ChartValueFormat;
  ariaLabel?: string;
};

export function FileSizeScatter({
  data,
  xLabel,
  yLabel,
  xValueFormat = "bytes",
  yValueFormat = "ms",
  ariaLabel
}: ScatterChartProps) {
  const xTickFormatter = pickTickFormatter(xValueFormat);
  const yTickFormatter = pickTickFormatter(yValueFormat);
  const xValueFormatter = pickValueFormatter(xValueFormat);
  const yValueFormatter = pickValueFormatter(yValueFormat);
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
            tickFormatter={xTickFormatter}
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
            tickFormatter={yTickFormatter}
            width={60}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (!Number.isFinite(n)) return [String(value), String(name)];
              if (name === "x") return [xValueFormatter(n), xLabel];
              return [yValueFormatter(n), yLabel];
            }}
          />
          <Scatter data={data} fill={COLOR_PRIMARY} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
