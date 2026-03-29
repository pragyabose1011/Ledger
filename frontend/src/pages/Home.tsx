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

  // Scroll snap for sections
  useEffect(() => {
    document.documentElement.classList.add("snap-home");
    return () => document.documentElement.classList.remove("snap-home");
  }, []);

  // Hero parallax
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
            <span className="text-lg font-semibold tracking-tight">
              Ledger
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-ledger-pink transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-ledger-pink transition-colors">
              How it works
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
                  Get started
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative overflow-hidden">
        {/* soft glow background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(56,189,248,0.08),_transparent_55%)]" />

        <div ref={parallaxRef} className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
          <div className="hero-animate hero-animate-delay-1 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-slate-900/70 px-4 py-1 text-xs font-medium text-ledger-pink shadow-[0_0_18px_rgba(244,114,182,0.6)] mb-6">
            <span className="h-2 w-2 rounded-full bg-ledger-pink animate-pulse" />
            <span>AI‑native meeting intelligence</span>
          </div>

          <h1 className="hero-animate hero-animate-delay-2 max-w-3xl text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Turn meetings into decisions —{" "}
            <span className="text-ledger-pink">automatically.</span>
          </h1>

          <p className="hero-animate hero-animate-delay-3 mt-6 max-w-2xl text-balance text-sm text-slate-300 sm:text-base lg:text-lg">
            Upload transcripts, extract action items, track decisions, identify risks,
            and measure meeting productivity — all powered by AI.
          </p>

          <div className="hero-animate hero-animate-delay-4 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {hasToken ? (
              <button
                onClick={() => navigate("/meetings")}
                className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
              >
                Go to app
                <span className="ml-2 text-base">→</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
                >
                  Get started free
                  <span className="ml-2 text-base">→</span>
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-8 py-3 text-sm font-medium text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          <p className="mt-8 text-xs text-slate-500">
            No credit card required • Free for up to 10 meetings/month
          </p>
        </div>

        {/* Demo Preview */}
        <AnimateIn className="relative mx-auto max-w-5xl px-6 pb-20">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-2 shadow-2xl shadow-pink-500/10">
            <div className="rounded-xl bg-slate-950 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs text-slate-500">Meeting: Q1 Planning Session</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-emerald-400">✓</span>
                    <span className="text-sm font-medium text-slate-300">Decisions</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded bg-slate-800/50 p-2 text-xs text-slate-400">Launch beta by March 15th</div>
                    <div className="rounded bg-slate-800/50 p-2 text-xs text-slate-400">Hire 2 more engineers</div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-amber-400">◆</span>
                    <span className="text-sm font-medium text-slate-300">Action Items</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded bg-slate-800/50 p-2 text-xs text-slate-400">
                      <span className="text-ledger-pink">@Sarah</span> Draft roadmap doc
                    </div>
                    <div className="rounded bg-slate-800/50 p-2 text-xs text-slate-400">
                      <span className="text-ledger-pink">@Mike</span> Set up CI/CD pipeline
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-red-400">⚠</span>
                    <span className="text-sm font-medium text-slate-300">Risks</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded bg-red-900/20 border border-red-900/30 p-2 text-xs text-red-300">Timeline may slip if hiring delayed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* Features */}
        <section id="features" className="relative py-20 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl px-6">
            <AnimateIn className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                Everything you need to make meetings{" "}
                <span className="text-ledger-pink">productive</span>
              </h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
                Stop losing track of what was decided. Ledger automatically extracts the important stuff so you can focus on execution.
              </p>
            </AnimateIn>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "🎯",
                  title: "AI Extraction",
                  description: "Automatically extract decisions, action items, and risks from any meeting transcript.",
                },
                {
                  icon: "📊",
                  title: "Productivity Metrics",
                  description: "Track meeting effectiveness with productivity scores and classifications.",
                },
                {
                  icon: "🔔",
                  title: "Smart Alerts",
                  description: "Get notified about unassigned actions, missing deadlines, and unproductive meetings.",
                },
                {
                  icon: "👥",
                  title: "Participant Tracking",
                  description: "Keep track of who attended and who's responsible for what.",
                },
                {
                  icon: "📅",
                  title: "Calendar View",
                  description: "See all your meetings at a glance with our intuitive calendar interface.",
                },
                {
                  icon: "📄",
                  title: "PDF Export",
                  description: "Export meeting summaries as beautiful PDF reports to share with stakeholders.",
                },
                {
                  icon: "🔍",
                  title: "Powerful Search",
                  description: "Search across all meetings, decisions, and action items instantly.",
                },
                {
                  icon: "🤖",
                  title: "Ask AI",
                  description: "Ask questions about your meeting history and get instant answers.",
                },
                {
                  icon: "✉️",
                  title: "Email Notifications",
                  description: "Automatic email summaries and action item assignments to participants.",
                },
              ].map((feature, idx) => (
                <AnimateIn key={idx} delay={Math.min((idx % 3) * 100, 300)}>
                  <div className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-6 hover:border-ledger-pink/50 hover:bg-slate-900/50 transition-all h-full">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl group-hover:bg-ledger-pink/20 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-slate-100">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative py-20 border-t border-slate-800/50">
          <div className="mx-auto max-w-6xl px-6">
            <AnimateIn className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
                Get started in minutes. No complex setup required.
              </p>
            </AnimateIn>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload transcript",
                  description: "Paste your meeting transcript or connect your favorite meeting tool.",
                },
                {
                  step: "02",
                  title: "AI extracts insights",
                  description: "Our AI analyzes the transcript and extracts decisions, actions, and risks.",
                },
                {
                  step: "03",
                  title: "Track & execute",
                  description: "Review insights, assign owners, track progress, and get things done.",
                },
              ].map((item, idx) => (
                <AnimateIn key={idx} delay={idx * 150}>
                  <div className="relative">
                    <div className="text-6xl font-bold text-ledger-pink/20 mb-4">{item.step}</div>
                    <h3 className="text-xl font-medium text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.description}</p>
                    {idx < 2 && (
                      <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-slate-700">
                        →
                      </div>
                    )}
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
                Start free, upgrade when you need more.
              </p>
            </AnimateIn>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Free tier */}
              <AnimateIn delay={0}>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 h-full">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">Free</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-100">$0</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
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

              {/* Pro tier */}
              <AnimateIn delay={150}>
                <div className="rounded-2xl border border-ledger-pink/50 bg-slate-900/50 p-8 relative overflow-hidden h-full">
                  <div className="absolute top-4 right-4 rounded-full bg-ledger-pink px-3 py-1 text-xs font-medium text-slate-950">
                    Popular
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-slate-100">Pro</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-slate-100">$19</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {["Unlimited meetings", "AI extraction + RAG", "Advanced analytics", "Calendar integrations", "Team collaboration", "Priority support"].map((item, idx) => (
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

        {/* CTA */}
        <section className="relative py-20 border-t border-slate-800/50">
          <AnimateIn className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-semibold text-slate-50 sm:text-4xl mb-6">
              Ready to make your meetings{" "}
              <span className="text-ledger-pink">count</span>?
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of teams who use Ledger to turn meetings into action.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="inline-flex items-center justify-center rounded-full bg-ledger-pink px-8 py-4 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
            >
              Get started for free
              <span className="ml-2 text-base">→</span>
            </button>
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
              <p className="text-sm text-slate-500">
                © 2026 Ledger. All rights reserved.
              </p>
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