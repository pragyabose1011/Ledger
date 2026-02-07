import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const hasToken = !!localStorage.getItem("token");

  useEffect(() => {
    if (hasToken) {
      // optional: skip marketing for logged-in users
      // navigate("/meetings");
    }
  }, [hasToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
            <span className="text-lg font-semibold tracking-tight">
              Ledger
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <button className="hover:text-ledger-pink transition-colors">
              Features
            </button>
            <button className="hover:text-ledger-pink transition-colors">
              How it works
            </button>
            <button className="hover:text-ledger-pink transition-colors">
              Pricing
            </button>
            <button
              onClick={() => navigate("/login")}
              className="hover:text-ledger-pink transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
            >
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden">
        {/* soft glow background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_55%)]" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-slate-900/70 px-4 py-1 text-xs font-medium text-ledger-pink shadow-[0_0_18px_rgba(244,114,182,0.6)] mb-6">
            <span className="h-2 w-2 rounded-full bg-ledger-pink" />
            <span>AI‑native meeting intelligence</span>
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            Turn meetings into decisions —{" "}
            <span className="text-ledger-pink">automatically.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-balance text-sm text-slate-300 sm:text-base">
            Record meetings, generate transcripts, extract actions, track
            confidence, and measure whether your meetings are actually
            productive — all in real time.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
            >
              Get started
              <span className="ml-2 text-base">→</span>
            </button>
            <button
              onClick={() => navigate("/meetings")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              View dashboard
            </button>
          </div>

          {/* Subline */}
          <p className="mt-8 text-xs text-slate-400">
            You focus on the conversation. Ledger handles the rest.
          </p>
        </div>
      </main>
    </div>
  );
}