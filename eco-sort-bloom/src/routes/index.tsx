import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Recycle, Waves, ArrowRight } from "lucide-react";

import heroImage from "@/assets/hero-botanical.jpg";
import { EcoSortWordmark } from "@/components/eco/logo";
import { signIn } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoSort — Telemetry & Stewardship" },
      {
        name: "description",
        content:
          "Sign in to EcoSort: optical waste classification, servo-driven dual-stream routing and live bin fill telemetry for facility operators.",
      },
      { property: "og:title", content: "EcoSort — Telemetry & Stewardship" },
      {
        property: "og:description",
        content:
          "Optical classification, servo-driven routing and live fill telemetry for circular waste stewardship.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Camera,
    title: "Zero-Touch Sorting",
    body: "An optical stream watches the chute; an IR trigger wakes classification the moment an item drops.",
  },
  {
    icon: Recycle,
    title: "Dual-Stream Routing",
    body: "A single servo arm commits each item to the organic or dry recyclable compartment within two seconds.",
  },
  {
    icon: Waves,
    title: "Dynamic Fill Telemetry",
    body: "Ultrasonic depth sensing reports compartment capacity continuously, so collection is scheduled, not guessed.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn(email || "operator@ecosort.io");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-[1fr_38%]">
        {/* Editorial column */}
        <div className="px-6 py-10 sm:px-12 lg:px-16 lg:py-14">
          <header className="flex items-center justify-between">
            <EcoSortWordmark />
            <Link
              to="/login"
              className="text-sm text-sage underline-offset-4 transition-colors duration-300 ease-out hover:text-primary hover:underline"
            >
              Log in
            </Link>
          </header>

          <section className="mt-16 max-w-2xl lg:mt-24">
            <p className="text-xs uppercase tracking-[0.22em] text-sage">
              EcoSort Telemetry &amp; Stewardship
            </p>
            <h1 className="mt-6 text-display text-4xl leading-[1.08] text-primary sm:text-5xl lg:text-6xl">
              Sorting complexity into circular balance.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              EcoSort is a hardware–software symbiosis. A camera classifies each item as it falls, a
              servo-driven gate routes it into the organic or dry stream, and capacitance and
              ultrasonic sensing report fill depth back in real time — so a facility knows the state
              of every bin without opening a single lid.
            </p>
          </section>

          <section className="mt-14 grid gap-4 sm:grid-cols-3 lg:mt-20">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="card-paper group p-5 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <f.icon className="h-5 w-5 text-sage" strokeWidth={1.4} />
                <h2 className="mt-4 text-base text-primary">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </section>

          <p className="mt-14 text-xs text-muted-foreground lg:mt-20">
            Facility 04 · Bengaluru South · Optical feed calibrated 06:12
          </p>
        </div>

        {/* Sign-in column */}
        <div className="relative min-h-[560px] border-t border-border lg:border-l lg:border-t-0">
          <img
            src={heroImage}
            alt="Sunlit linen with eucalyptus sprigs, dried sage and a terracotta vessel"
            width={1024}
            height={1408}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linen/45" />
          <div className="relative flex min-h-full items-center justify-center p-6 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="card-paper w-full max-w-sm p-7 shadow-lift backdrop-blur-sm"
            >
              <h2 className="text-display text-2xl text-primary">Operator sign in</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Access live telemetry for your facility.
              </p>

              <label className="mt-7 block text-xs uppercase tracking-[0.14em] text-sage">
                Operator email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@facility.eco"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-300 ease-out placeholder:text-muted-foreground/70 focus:border-sage"
              />

              <label className="mt-5 block text-xs uppercase tracking-[0.14em] text-sage">
                Access key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••••"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-300 ease-out placeholder:text-muted-foreground/70 focus:border-sage"
              />

              <button
                type="submit"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 ease-out hover:bg-moss/90 hover:shadow-lift"
              >
                Access Dashboard
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </button>

              <a
                href="mailto:access@ecosort.io"
                className="mt-4 block text-center text-sm text-sage underline-offset-4 transition-colors duration-300 ease-out hover:text-primary hover:underline"
              >
                Request Facility Access
              </a>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
