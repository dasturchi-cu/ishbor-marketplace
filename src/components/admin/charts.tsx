import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartStyle = {
  fontSize: 11,
  fontFamily: "JetBrains Mono, monospace",
  fill: "oklch(0.55 0.02 250)",
};

export function AdminLineChart({
  title,
  data,
  dataKey = "value",
  color = "#2563EB",
  formatValue,
}: {
  title: string;
  data: { month: string; value: number }[];
  dataKey?: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" vertical={false} />
              <XAxis dataKey="month" tick={chartStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartStyle} axisLine={false} tickLine={false} width={48} tickFormatter={formatValue} />
              <Tooltip
                contentStyle={{ background: "oklch(0.995 0 0)", border: "1px solid oklch(0.9 0.01 250)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [formatValue ? formatValue(v) : v, title]}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${title})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminBarChart({
  title,
  data,
  dataKey = "value",
  color = "#2563EB",
}: {
  title: string;
  data: { name: string; value: number }[];
  dataKey?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" horizontal={false} />
              <XAxis type="number" tick={chartStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={chartStyle} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ background: "oklch(0.995 0 0)", border: "1px solid oklch(0.9 0.01 250)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
