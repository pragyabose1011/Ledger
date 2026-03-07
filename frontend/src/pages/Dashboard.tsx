import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full bg-pink-400 animate-pulse" />
          <span className="text-slate-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="rounded-lg bg-pink-400 px-4 py-2 text-sm text-slate-950"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.1),_transparent_50%)]" />

      {/* Header */}
      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
            <span className="text-lg font-semibold tracking-tight">Ledger</span>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate("/chat")}
              className="text-sm text-slate-400 hover:text-pink-400 transition-colors"
            >
              Ask AI
            </button>
            <button
              onClick={() => navigate("/meetings")}
              className="text-sm text-slate-400 hover:text-pink-400 transition-colors"
            >
              Meetings
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-pink-400 font-medium"
            >
              Home
            </button>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Weekly metrics and alerts across all your meetings.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            value={data?.meetings_count ?? 0}
            label="Meetings (4 weeks)"
          />
          <StatCard
            value={data?.decisions_count ?? 0}
            label="Decisions"
          />
          <StatCard
            value={data?.action_items_count ?? 0}
            label="Action Items"
          />
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="text-3xl font-bold text-pink-400">
              {data?.productivity_score ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Productivity Score</div>
            <div className="mt-1 text-xs text-slate-500">
              {getProductivityLabel(data?.productivity_score ?? 0)}
            </div>
          </div>
        </div>

        {/* Weekly Metrics + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Metrics */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-semibold mb-4">📊 Weekly Metrics</h2>
            {data?.weekly_metrics && data.weekly_metrics.some((w) => w.meetings > 0) ? (
              <div className="space-y-3">
                {data.weekly_metrics.map((week) => (
                  <div
                    key={week.week}
                    className="flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-300">
                      {week.week}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">
                        {week.meetings} meeting{week.meetings !== 1 ? "s" : ""}
                      </span>
                      <span className="text-green-400">
                        {week.decisions} decision{week.decisions !== 1 ? "s" : ""}
                      </span>
                      <span className="text-yellow-400">
                        {week.action_items} action{week.action_items !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No data for the last 4 weeks.</p>
            )}
          </div>

          {/* Alerts Inbox */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-semibold mb-4">🔔 Alerts Inbox</h2>
            {data?.alerts && data.alerts.length > 0 ? (
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() =>
                      alert.meeting_id
                        ? navigate(`/meetings/${alert.meeting_id}`)
                        : null
                    }
                    className="w-full text-left rounded-lg bg-yellow-900/20 border border-yellow-700/30 p-4 hover:bg-yellow-900/30 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">⚠️</span>
                      <div>
                        <p className="text-sm text-yellow-300">{alert.message}</p>
                        {alert.meeting_title && (
                          <p className="text-xs text-slate-500 mt-1">
                            {alert.meeting_title}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No alerts.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/meetings")}
              className="rounded-full bg-pink-400 px-6 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:bg-pink-300 transition-colors"
            >
              View All Meetings
            </button>
            <button
              onClick={() => navigate("/meetings/new")}
              className="rounded-full border border-slate-700 px-6 py-2.5 text-sm text-slate-300 hover:border-pink-400 hover:text-pink-400 transition-colors"
            >
              + New Meeting
            </button>
            <button
              onClick={() => navigate("/chat")}
              className="rounded-full border border-slate-700 px-6 py-2.5 text-sm text-slate-300 hover:border-pink-400 hover:text-pink-400 transition-colors"
            >
              💬 Ask AI
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="text-3xl font-bold text-pink-400">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}