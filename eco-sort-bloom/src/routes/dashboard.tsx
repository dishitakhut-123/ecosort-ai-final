import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Gauge, Radio, Timer, LogOut } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EcoSortWordmark } from "@/components/eco/logo";
import { getOperator, signOut } from "@/lib/session";
import { useTelemetry } from "@/lib/telemetry";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Operational Monitoring Hub — EcoSort" },
      {
        name: "description",
        content:
          "Live EcoSort dashboard: wet and dry bin fill telemetry, classification confidence log and daily stream balance.",
      },
      { property: "og:title", content: "Operational Monitoring Hub — EcoSort" },
      {
        property: "og:description",
        content: "Live bin fill telemetry, classification log and daily wet/dry stream balance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [operator, setOperator] = useState<string | null>(null);
  const t = useTelemetry();

  useEffect(() => {
    const op = getOperator();
    if (!op) navigate({ to: "/login", replace: true });
    else setOperator(op);
  }, [navigate]);

  if (!operator) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
          <EcoSortWordmark />
          <span className="flex items-center gap-2 rounded-full border border-border bg-eucalyptus px-3 py-1 text-xs text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss" />
            </span>
            Live • Stream Active
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{operator}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm text-primary">
              {operator.slice(0, 2).toUpperCase()}
            </span>
            <button
              onClick={() => {
                signOut();
                navigate({ to: "/login", replace: true });
              }}
              aria-label="Sign out"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors duration-300 ease-out hover:bg-secondary hover:text-primary"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Section A — Bin cards */}
        <section className="grid gap-5 lg:grid-cols-2">
          <BinCard
            title="Wet Waste Bin"
            subtitle="Organic stream"
            fill={t.wetFill}
            tone="clay"
            last={t.lastWet}
          />
          <BinCard
            title="Dry Waste Bin"
            subtitle="Inorganic / recyclable stream"
            fill={t.dryFill}
            tone="slate"
            last={t.lastDry}
            split={{ paper: t.paperShare, plastic: 100 - t.paperShare }}
          />
        </section>

        {/* Section B — Segregation log + Daily stream balance graph */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="card-paper lg:col-span-2">
            <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg text-primary">Segregation Log</h2>
              <span className="text-xs text-muted-foreground">Real-time feed</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-sage">
                    <th className="px-6 py-3 font-normal">Time</th>
                    <th className="px-3 py-3 font-normal">Material</th>
                    <th className="px-3 py-3 font-normal">Confidence</th>
                    <th className="px-3 py-3 font-normal">Destination</th>
                    <th className="px-6 py-3 font-normal">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {t.feed.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-border transition-colors duration-300 ease-out hover:bg-muted"
                    >
                      <td className="px-6 py-3 tabular text-muted-foreground">{d.time}</td>
                      <td className="px-3 py-3 text-foreground">{d.material}</td>
                      <td className="px-3 py-3 tabular text-foreground">{d.confidence}%</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            d.stream === "wet"
                              ? "bg-clay-soft text-clay"
                              : "bg-slate-soft text-slate-ocean"
                          }`}
                        >
                          {d.stream === "wet" ? "Wet bin" : "Dry bin"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{d.servo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-paper p-6">
            <h2 className="text-lg text-primary">Daily Stream Balance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Wet vs dry volume, operating day</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Wet / organic", value: t.wetShareOfDay },
                      { name: "Dry / recyclable", value: 100 - t.wetShareOfDay },
                    ]}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                    stroke="none"
                  >
                    <Cell fill="var(--clay)" />
                    <Cell fill="var(--slate-ocean)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `${v}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i className="h-2 w-2 rounded-full bg-clay" /> Wet / organic
                </span>
                <span className="tabular text-foreground">{t.wetShareOfDay}%</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <i className="h-2 w-2 rounded-full bg-slate-ocean" /> Dry / recyclable
                </span>
                <span className="tabular text-foreground">{100 - t.wetShareOfDay}%</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section C — Telemetry stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={Activity}
            label="Waste cycles today"
            value={t.cycles.toLocaleString()}
            note="+6.4% vs yesterday"
          />
          <Stat icon={Timer} label="Average routing latency" value="1.62s" note="Target < 1.8s" />
          <Stat icon={Gauge} label="Optical feed" value="Connected" note="Uptime 99.4% · 12d" />
          <Stat
            icon={Radio}
            label="Firebase heartbeat"
            value={`${t.heartbeat % 60}s`}
            note="Synchronised just now"
          />
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="card-paper p-5 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center gap-2 text-sage">
        <Icon className="h-4 w-4" strokeWidth={1.4} />
        <span className="text-xs uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-3 text-display text-3xl tabular text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function BinCard({
  title,
  subtitle,
  fill,
  tone,
  last,
  split,
}: {
  title: string;
  subtitle: string;
  fill: number;
  tone: "clay" | "slate";
  last: string;
  split?: { paper: number; plastic: number };
}) {
  const accent = tone === "clay" ? "text-clay" : "text-slate-ocean";
  const wash = tone === "clay" ? "bg-clay-soft" : "bg-slate-soft";
  const bar = tone === "clay" ? "bg-clay" : "bg-slate-ocean";
  const alert = fill >= 80;

  return (
    <article className="card-paper flex gap-6 p-6 hover:shadow-lift">
      <div className="flex-1">
        <p className={`text-xs uppercase tracking-[0.16em] ${accent}`}>{subtitle}</p>
        <h2 className="mt-1.5 text-xl text-primary">{title}</h2>

        <p className={`mt-6 text-display text-6xl tabular ${accent}`}>{fill}%</p>
        <p className="text-sm text-muted-foreground">Current capacity</p>

        <span
          className={`mt-5 inline-block rounded-full px-3 py-1 text-xs ${
            alert ? "bg-persimmon/15 text-persimmon" : "bg-eucalyptus text-primary"
          }`}
        >
          {alert ? "Requires emptying" : tone === "clay" ? "Optimal" : "Collecting normally"}
        </span>

        <p className="mt-5 text-sm text-muted-foreground">
          Last deposited · <span className="text-foreground">{last}</span>
        </p>

        {split && (
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Paper {split.paper}%</span>
              <span>Plastics {split.plastic}%</span>
            </div>
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${wash}`}>
              <div
                className={`fill-transition h-full rounded-full ${bar}`}
                style={{ width: `${split.paper}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Vertical fluid gauge */}
      <div className={`relative w-16 shrink-0 overflow-hidden rounded-2xl border border-border ${wash}`}>
        <div
          className={`fill-transition absolute bottom-0 left-0 w-full ${bar} opacity-90`}
          style={{ height: `${fill}%` }}
        />
        <div className="absolute inset-0 flex flex-col justify-between p-2 text-[10px] text-muted-foreground">
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>
      </div>
    </article>
  );
}
