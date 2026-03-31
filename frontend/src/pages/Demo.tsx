import { useNavigate } from "react-router-dom";

const DEMO = {
  title: "Q3 Product Planning — Sprint Review",
  platform: "Zoom",
  duration: "52 minutes",
  date: "March 28, 2026",
  participants: ["Sarah Chen (PM)", "Mike Torres (Eng)", "Alex Kim (Design)", "Jordan Lee (CTO)"],
  decisions: [
    { summary: "Launch beta to first 50 customers by April 15th", confidence: 0.95 },
    { summary: "Freeze feature scope for v1 — no new features until post-launch", confidence: 0.91 },
    { summary: "Migrate to PostgreSQL before launch, not after", confidence: 0.87 },
    { summary: "Move weekly standup from 10am to 9am starting next week", confidence: 0.98 },
  ],
  action_items: [
    { owner: "Sarah Chen", description: "Draft v1 launch checklist and share with team", due: "Apr 3", status: "open" },
    { owner: "Mike Torres", description: "Complete PostgreSQL migration and run smoke tests", due: "Apr 8", status: "open" },
    { owner: "Alex Kim", description: "Finalize onboarding flow designs — 3 screens remaining", due: "Apr 5", status: "open" },
    { owner: "Jordan Lee", description: "Confirm beta customer list and send invites", due: "Apr 2", status: "open" },
    { owner: "Sarah Chen", description: "Set up analytics tracking for key launch metrics", due: "Apr 10", status: "open" },
  ],
  risks: [
    { description: "Database migration could delay launch if issues found late", severity: "high" },
    { description: "Beta customer list has not been finalized — blocks invite timeline", severity: "medium" },
    { description: "Onboarding designs are behind — could compress eng handoff window", severity: "medium" },
  ],
  metrics: {
    productivity_score: 8.4,
    classification: "Highly Productive",
    decisions_per_hour: 4.6,
    actions_with_owner: 5,
    actions_without_owner: 0,
  },
};

const platformColors: Record<string, string> = {
  Zoom: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function DemoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.08),_transparent_50%)]" />

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-ledger-pink shadow-[0_0_12px_rgba(244,114,182,0.6)]" />
              <span className="text-sm font-medium text-slate-300">Ledger</span>
            </div>
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              Demo — sample meeting
            </span>
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="rounded-full bg-ledger-pink px-5 py-2 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.6)] hover:bg-pink-400 transition-colors"
          >
            Process your own meetings →
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Meeting header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{DEMO.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span>{DEMO.date}</span>
              <span className="text-slate-700">·</span>
              <span>{DEMO.duration}</span>
              <span className="text-slate-700">·</span>
              <span>{DEMO.participants.length} participants</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${platformColors[DEMO.platform]}`}>
                {DEMO.platform}
              </span>
            </div>
          </div>

          {/* Productivity score */}
          <div className="shrink-0 rounded-2xl border border-emerald-800/40 bg-emerald-900/10 px-5 py-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{DEMO.metrics.productivity_score}</div>
            <div className="text-xs text-emerald-600 mt-0.5">{DEMO.metrics.classification}</div>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { value: DEMO.decisions.length, label: "Decisions", color: "text-emerald-400" },
            { value: DEMO.action_items.length, label: "Action Items", color: "text-amber-400" },
            { value: DEMO.metrics.actions_without_owner, label: "Unassigned Tasks", color: "text-red-400" },
            { value: DEMO.risks.length, label: "Risks Flagged", color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Decisions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-medium text-slate-200">Decisions ({DEMO.decisions.length})</h2>
              </div>
              <div className="space-y-2">
                {DEMO.decisions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-800/20 p-3 hover:bg-slate-800/40 transition-colors">
                    <span className="mt-0.5 text-emerald-400 shrink-0">✓</span>
                    <p className="text-sm text-slate-300 flex-1">{d.summary}</p>
                    <span className="shrink-0 text-xs text-slate-600">{Math.round(d.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
                <h2 className="font-medium text-slate-200">Action Items ({DEMO.action_items.length})</h2>
                <span className="ml-auto text-xs text-emerald-400">All assigned ✓</span>
              </div>
              <div className="space-y-2">
                {DEMO.action_items.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-800/60 bg-slate-800/20 p-3 hover:bg-slate-800/40 transition-colors">
                    <div className="mt-0.5 h-4 w-4 shrink-0 rounded border border-slate-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300">{a.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-ledger-pink font-medium">{a.owner}</span>
                        <span className="text-xs text-slate-600">due {a.due}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                  <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                </div>
                <h2 className="font-medium text-slate-200">Risks ({DEMO.risks.length})</h2>
              </div>
              <div className="space-y-2">
                {DEMO.risks.map((r, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${
                    r.severity === "high"
                      ? "border-red-900/40 bg-red-900/10"
                      : "border-amber-900/30 bg-amber-900/10"
                  }`}>
                    <span className={`mt-0.5 shrink-0 text-sm ${r.severity === "high" ? "text-red-400" : "text-amber-400"}`}>⚠</span>
                    <p className={`text-sm ${r.severity === "high" ? "text-red-300" : "text-amber-300"}`}>{r.description}</p>
                    <span className={`shrink-0 text-xs uppercase tracking-wider font-medium ${r.severity === "high" ? "text-red-500" : "text-amber-600"}`}>
                      {r.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Participants</h3>
              <div className="space-y-2">
                {DEMO.participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-ledger-pink/20 flex items-center justify-center text-xs font-medium text-ledger-pink shrink-0">
                      {p[0]}
                    </div>
                    <span className="text-sm text-slate-400">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Meeting Quality</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Productivity</span>
                    <span className="text-emerald-400">{DEMO.metrics.productivity_score}/10</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${DEMO.metrics.productivity_score * 10}%` }} />
                  </div>
                </div>
                <div className="pt-2 space-y-2 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Tasks with owner</span>
                    <span className="text-emerald-400">{DEMO.metrics.actions_with_owner}/{DEMO.action_items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decisions/hour</span>
                    <span className="text-slate-300">{DEMO.metrics.decisions_per_hour}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-ledger-pink/30 bg-ledger-pink/5 p-5 text-center">
              <p className="text-sm font-medium text-slate-200 mb-1">Ready to try it?</p>
              <p className="text-xs text-slate-500 mb-4">Process your own meetings. Free for up to 10/month.</p>
              <button
                onClick={() => navigate("/signup")}
                className="w-full rounded-full bg-ledger-pink py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
              >
                Start free →
              </button>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 w-full text-xs text-slate-500 hover:text-ledger-pink transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
