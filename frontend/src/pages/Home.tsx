import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function AnimateIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delayClass = delay ? `delay-${delay}` : "";
  return (
    <div ref={ref} className={`scroll-reveal ${visible ? "visible" : ""} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const hasToken = !!localStorage.getItem("token");
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasToken) navigate("/meetings");
  }, [hasToken, navigate]);

  useEffect(() => {
    document.documentElement.classList.add("snap-home");
    return () => document.documentElement.classList.remove("snap-home");
  }, []);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.transform = `translateY(${window.scrollY * 0.35}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
            <span className="text-lg font-semibold tracking-tight">Ledger</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#how-it-works" className="hover:text-ledger-pink transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-ledger-pink transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-ledger-pink transition-colors">
              Pricing
            </a>
            {hasToken ? (
              <>
                <button
                  onClick={() => { localStorage.removeItem("token"); window.location.reload(); }}
                  className="hover:text-ledger-pink transition-colors"
                >
                  Log out
                </button>
                <button
                  onClick={() => navigate("/meetings")}
                  className="rounded-full bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
                >
                  Go to app
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="hover:text-ledger-pink transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="rounded-full bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
                >
                  Start free
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative overflow-hidden">
        {/* soft glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_55%)]" />

        {/* Hero */}
        <div ref={parallaxRef} className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
          <h1 className="hero-animate hero-animate-delay-1 max-w-3xl text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl lg:text-[3.5rem]">
            Your meetings,{" "}
            <span className="text-ledger-pink">finally accountable.</span>
          </h1>

          <p className="hero-animate hero-animate-delay-2 mt-6 max-w-xl text-balance text-slate-400 sm:text-base lg:text-lg">
            Ledger extracts decisions, owners, and risks from any meeting — and tracks them to completion.
          </p>

          <div className="hero-animate hero-animate-delay-3 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {hasToken ? (
              <button
                onClick={() => navigate("/meetings")}
                className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
              >
                Open app
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
                >
                  Get started free
                </button>
                <button
                  onClick={() => navigate("/demo")}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 px-8 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                >
                  See an example
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stat bar */}
        <AnimateIn className="relative border-y border-slate-800/40 bg-slate-900/20 py-4">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-slate-500 text-center">
              <span>Decisions captured</span>
              <div className="hidden sm:block h-4 w-px bg-slate-800" />
              <span>Tasks with owners</span>
              <div className="hidden sm:block h-4 w-px bg-slate-800" />
              <span>Risks flagged</span>
              <div className="hidden sm:block h-4 w-px bg-slate-800" />
              <span>Searchable across all meetings</span>
            </div>
          </div>
        </AnimateIn>

        {/* What you get section */}
        <AnimateIn className="relative py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-semibold text-slate-50 mb-4">
                  From transcript to record<br />in under 30 seconds
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Drop in any transcript — or record live. Ledger extracts every decision, assigns owners to tasks, flags risks, and builds a searchable record you can query months later.
                </p>
                <div className="space-y-3">
                  {[
                    "Decisions captured with confidence scores",
                    "Every action item has an owner and due date",
                    "Risks ranked by severity",
                    "Ask questions across your entire meeting history",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 text-ledger-pink shrink-0">—</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
                <div className="text-xs text-slate-600 mb-2 font-mono">Q3 Planning · 52 min</div>
                <div className="rounded-lg border border-emerald-900/40 bg-emerald-900/10 p-3">
                  <div className="text-xs text-emerald-500 font-medium mb-1.5">4 Decisions</div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 flex gap-2"><span className="text-emerald-400">✓</span>Launch beta to first 50 customers by April 15th</div>
                    <div className="text-xs text-slate-400 flex gap-2"><span className="text-emerald-400">✓</span>Freeze scope for v1 — no new features</div>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-900/30 bg-amber-900/10 p-3">
                  <div className="text-xs text-amber-500 font-medium mb-1.5">5 Action Items</div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-ledger-pink font-medium">Sarah</span>
                      <span className="text-slate-600">·</span>
                      Draft launch checklist
                      <span className="ml-auto text-slate-600">Apr 3</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-ledger-pink font-medium">Mike</span>
                      <span className="text-slate-600">·</span>
                      PostgreSQL migration
                      <span className="ml-auto text-slate-600">Apr 8</span>
                    </div>
                  </div>
                </div>
                <div className="pt-1 text-right">
                  <button onClick={() => navigate("/demo")} className="text-xs text-slate-500 hover:text-ledger-pink transition-colors">
                    View full example →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>


        {/* Differentiation / Wedge */}
        <section id="how-it-works" className="relative py-20 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl px-6">
            <AnimateIn className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs font-medium text-slate-400 mb-4">
                Why Ledger
              </div>
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                Built for one thing:{" "}
                <span className="text-ledger-pink">accountability</span>
              </h2>
              <p className="mt-4 text-slate-400 max-w-xl mx-auto">
                Every other tool summarizes your meeting. Ledger tracks who agreed to what, and makes sure it actually gets done.
              </p>
            </AnimateIn>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Paste or upload your transcript",
                  description: "Drop in a Zoom, Teams, or Meet transcript — or record live in the browser. Ledger works with any format.",
                  color: "text-ledger-pink",
                },
                {
                  step: "02",
                  title: "AI extracts decisions, tasks, and risks",
                  description: "In under 30 seconds, every decision is captured, every task has an owner, and every risk is flagged.",
                  color: "text-sky-400",
                },
                {
                  step: "03",
                  title: "Track execution across meetings",
                  description: "See which tasks are overdue, which decisions keep getting revisited, and which team members are overloaded.",
                  color: "text-emerald-400",
                },
              ].map((item, idx) => (
                <AnimateIn key={idx} delay={idx * 150}>
                  <div className="relative group">
                    <div className={`text-6xl font-bold ${item.color} opacity-20 mb-4 group-hover:opacity-40 transition-opacity`}>{item.step}</div>
                    <h3 className="text-xl font-medium text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                    {idx < 2 && (
                      <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-slate-700 text-xl">→</div>
                    )}
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="relative py-20 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl px-6">
            <AnimateIn className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                Everything your team needs to{" "}
                <span className="text-ledger-pink">stop repeating itself</span>
              </h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
                From raw transcript to actionable accountability record. No extra setup, no integrations required.
              </p>
            </AnimateIn>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "🎯",
                  title: "Automatic extraction",
                  description: "Decisions, tasks with owners, and risks pulled from any transcript — without you lifting a finger.",
                },
                {
                  icon: "📊",
                  title: "Meeting productivity score",
                  description: "Know which meetings drive outcomes and which ones are just talk. Improve over time.",
                },
                {
                  icon: "🔔",
                  title: "Accountability alerts",
                  description: "Get notified when tasks have no owner, when deadlines pass, or when a decision keeps being revisited.",
                },
                {
                  icon: "🔍",
                  title: "Semantic search",
                  description: "Search across every meeting, every decision, every action item. Find anything in seconds.",
                },
                {
                  icon: "🤖",
                  title: "Ask your meeting history",
                  description: "\"What did we decide about pricing?\" — ask in plain English, get answers from your actual meetings.",
                },
                {
                  icon: "📅",
                  title: "Calendar view",
                  description: "See your full meeting history by date. Quickly find what was decided when.",
                },
                {
                  icon: "👥",
                  title: "Participant tracking",
                  description: "Know who was in every meeting. See who owns the most tasks and who may be overloaded.",
                },
                {
                  icon: "📄",
                  title: "PDF export",
                  description: "Share clean, formatted meeting summaries with stakeholders who weren't in the room.",
                },
                {
                  icon: "✉️",
                  title: "Email follow-ups",
                  description: "Automatic email summaries sent to all participants after extraction. Everyone stays aligned.",
                },
              ].map((feature, idx) => (
                <AnimateIn key={idx} delay={Math.min((idx % 3) * 100, 300)}>
                  <div className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-6 hover:border-ledger-pink/50 hover:bg-slate-900/60 transition-all duration-200 h-full cursor-default">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl group-hover:bg-ledger-pink/20 group-hover:scale-110 transition-all duration-200">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-slate-100 group-hover:text-ledger-pink transition-colors">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="relative py-20 border-t border-slate-800/50">
          <div className="mx-auto max-w-4xl px-6">
            <AnimateIn className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-slate-400">
                Start free. Upgrade when your team grows.
              </p>
            </AnimateIn>

            <div className="grid gap-6 md:grid-cols-2">
              <AnimateIn delay={0}>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">Free</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-100">₹0</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">For individuals and small teams.</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {["10 meetings/month", "AI extraction", "Basic analytics", "PDF export", "Email support"].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full rounded-full border border-slate-700 py-3 text-sm font-medium text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
                  >
                    Get started free
                  </button>
                </div>
              </AnimateIn>

              <AnimateIn delay={150}>
                <div className="rounded-2xl border border-ledger-pink/50 bg-slate-900/50 p-8 relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-4 right-4 rounded-full bg-ledger-pink px-3 py-1 text-xs font-medium text-slate-950">
                    Most popular
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">Pro</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-100">₹1,499</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">For teams that need unlimited meetings and full analytics.</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {[
                      "Unlimited meetings",
                      "AI extraction + semantic search",
                      "Advanced analytics & trends",
                      "Calendar integrations",
                      "Team collaboration",
                      "Priority support",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-ledger-pink">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/signup")}
                    className="w-full rounded-full bg-ledger-pink py-3 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
                  >
                    Start free trial
                  </button>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-20 border-t border-slate-800/50">
          <AnimateIn className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl mb-4">
              Ready to try it?
            </h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">
              Free up to 10 meetings/month. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
              >
                Get started free
              </button>
              <button
                onClick={() => navigate("/demo")}
                className="inline-flex items-center justify-center rounded-full border border-slate-700/60 px-8 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
              >
                See an example
              </button>
            </div>
          </AnimateIn>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-ledger-pink shadow-[0_0_15px_rgba(244,114,182,0.5)]" />
                <span className="font-semibold">Ledger</span>
              </div>
              <p className="text-sm text-slate-500">© 2026 Ledger. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-slate-500">
                <a href="#" className="hover:text-ledger-pink transition-colors">Privacy</a>
                <a href="#" className="hover:text-ledger-pink transition-colors">Terms</a>
                <a href="#" className="hover:text-ledger-pink transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
