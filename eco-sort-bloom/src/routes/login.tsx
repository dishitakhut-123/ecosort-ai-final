import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import heroImage from "@/assets/hero-botanical.jpg";
import { EcoSortWordmark } from "@/components/eco/logo";
import { signIn } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Operator Sign In — EcoSort" },
      {
        name: "description",
        content:
          "Sign in to the EcoSort operational dashboard for live bin fill telemetry and classification feeds.",
      },
      { property: "og:title", content: "Operator Sign In — EcoSort" },
      {
        property: "og:description",
        content: "Access live EcoSort telemetry for your facility.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signIn(email || "operator@ecosort.io");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <img
        src={heroImage}
        alt="Sunlit linen with eucalyptus sprigs and dried sage"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linen/70" />

      <div className="relative w-full max-w-sm">
        <Link to="/" className="mb-6 block w-fit">
          <EcoSortWordmark />
        </Link>

        <form onSubmit={handleSubmit} className="card-paper w-full p-7 shadow-lift backdrop-blur-sm">
          <h1 className="text-display text-2xl text-primary">Operator log in</h1>
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline-offset-4 hover:text-primary hover:underline">
            ← Back to EcoSort
          </Link>
        </p>
      </div>
    </main>
  );
}
