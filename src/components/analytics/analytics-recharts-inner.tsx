import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PRIMARY = "#2563EB";

const axisTick = {
  fontSize: 10,
  fontFamily: "JetBrains Mono, monospace",
  fill: "oklch(0.55 0.02 250)",
};

const tooltipStyle = {
  background: "oklch(0.995 0 0)",
  border: "1px solid oklch(0.9 0.01 250)",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.12)",
};

export function ActivityChartInner({
  chartData,
  range,
}: {
  chartData: { name: string; value: number }[];
  range: 7 | 30 | 90;
}) {
  const tickInterval = range === 90 ? 2 : range === 30 ? 4 : 0;

  return (
    <div className="h-52 w-full min-h-[208px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="activityBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.95} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} interval={tickInterval} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip
            cursor={{ fill: "oklch(0.546 0.185 257 / 0.06)" }}
            contentStyle={tooltipStyle}
            formatter={(value) => [value ?? 0, "Faollik"]}
          />
          <Bar dataKey="value" fill="url(#activityBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={range === 90 ? 28 : 18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendChartInner({ chartData, max }: { chartData: { name: string; value: number }[]; max: number }) {
  return (
    <div className="h-52 w-full min-h-[208px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="spendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.22} />
              <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 250)" vertical={false} />
          <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => (max >= 1000 ? `$${Math.round(Number(v) / 1000)}k` : `$${v}`)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, "Xarajat"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={PRIMARY}
            fill="url(#spendAreaGrad)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: PRIMARY, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: PRIMARY, stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
