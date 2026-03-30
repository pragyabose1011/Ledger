import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { DashboardSkeleton } from "../components/Skeleton";

type Alert = {
  id: string;
  type: string;
  message: string;
  meeting_id: string;
  meeting_title: string;
  created_at: string | null;
};

type WeeklyMetric = {
  week: string;
  meetings: number;
  decisions: number;
  action_items: number;
};

type DashboardData = {
  meetings_count: number;
  decisions_count: number;
  action_items_count: number;
  open_action_items: number;
  productivity_score: number;
  weekly_metrics: WeeklyMetric[];
  alerts: Alert[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadDashboard();
  }, [navigate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/metrics/dashboard");
      setData(res.data);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err?.message || "Failed to load dashboard";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  const getProductivityLabel = (score: number): string => {
    if (score >= 8) return "Highly Productive";
    if (score >= 5) return "Productive";
    if (score >= 3) return "Moderate";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4 text-sm">{error}</p>
            <button onClick={loadDashboard} className="rounded-lg bg-ledger-pink px-4 py-2 text-sm text-slate-950">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-8 py-8 max-w-7xl">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Weekly metrics and alerts across all your meetings.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            value={data?.meetings_count ?? 0}
            label="Meetings"
            sub="Last 4 weeks"
            iconBg="bg-ledger-pink/10"
            iconColor="text-ledger-pink"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            }
          />
          <StatCard
            value={data?.decisions_count ?? 0}
            label="Decisions"
            sub="Captured"
            iconBg="bg-sky-500/10"
            iconColor="text-sky-400"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            value={data?.action_items_count ?? 0}
            label="Action Items"
            sub={`${data?.open_action_items ?? 0} open`}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-400"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            }
          />
          <StatCard
            value={data?.productivity_score ?? 0}
            label="Productivity"
            sub={getProductivityLabel(data?.productivity_score ?? 0)}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-400"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            }
          />
        </div>

        {/* Weekly + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Metrics */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-5">Weekly Activity</h2>
            {data?.weekly_metrics && data.weekly_metrics.some((w) => w.meetings > 0) ? (
              <div className="space-y-4">
                {data.weekly_metrics.map((week) => (
                  <div key={week.week}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-400">{week.week}</span>
                      <span className="text-xs text-slate-500">{week.meetings} meeting{week.meetings !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-1.5 rounded-full bg-ledger-pink/30 flex-1">
                        <div className="h-full rounded-full bg-ledger-pink" style={{ width: `${Math.min(100, (week.meetings / 10) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-xs text-emerald-400">{week.decisions} decisions</span>
                      <span className="text-xs text-amber-400">{week.action_items} actions</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No activity in the last 4 weeks</p>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-5">Alerts</h2>
            {data?.alerts && data.alerts.length > 0 ? (
              <div className="space-y-2">
                {data.alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => alert.meeting_id ? navigate(`/meetings/${alert.meeting_id}`) : null}
                    className="w-full text-left rounded-xl border border-amber-700/20 bg-amber-900/10 p-4 hover:bg-amber-900/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-amber-200">{alert.message}</p>
                        {alert.meeting_title && (
                          <p className="text-xs text-slate-500 mt-1">{alert.meeting_title}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500">All clear — no alerts</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/meetings")}
            className="rounded-full bg-ledger-pink px-5 py-2 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(228,133,182,0.4)] hover:bg-pink-400 transition-colors"
          >
            View All Meetings
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
          >
            Ask AI
          </button>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({
  value, label, sub, icon, iconBg, iconColor,
}: {
  value: number; label: string; sub: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors">
      <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-100">{value}</div>
      <div className="mt-1 text-sm text-slate-300">{label}</div>
      <div className="mt-0.5 text-xs text-slate-500">{sub}</div>
    </div>
  );
}