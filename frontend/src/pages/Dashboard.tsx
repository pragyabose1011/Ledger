// /Users/pragyabose/Ledger/frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type WeekData = {
  week_start: string;
  meetings_count: number;
  decisions_count: number;
  action_items_count: number;
  avg_productivity_score: number;
};

type Alert = {
  id: string;
  type: string;
  message: string;
  meeting_id: string;
  created_at: string;
};

type Meeting = {
  id: string;
  title: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch weekly metrics
        try {
          const weeklyRes = await api.get("/metrics/weekly");
          setWeeks(weeklyRes.data.weeks || []);
        } catch (err) {
          console.error("Failed to load weekly metrics", err);
        }

        // Fetch all meetings
        const meetingsRes = await api.get("/meetings/");
        setMeetings(meetingsRes.data);

        // Fetch alerts for all meetings
        const allAlerts: Alert[] = [];
        for (const meeting of meetingsRes.data) {
          try {
            const alertRes = await api.get(`/alerts/${meeting.id}`);
            const meetingAlerts = alertRes.data.map((a: any) => ({
              ...a,
              meeting_id: meeting.id,
              meeting_title: meeting.title,
            }));
            allAlerts.push(...meetingAlerts);
          } catch (err) {
            // No alerts for this meeting
          }
        }
        setAlerts(allAlerts);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getMeetingTitle = (meetingId: string) => {
    const meeting = meetings.find((m) => m.id === meetingId);
    return meeting?.title || "Unknown Meeting";
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "no_owner": return "👤";
      case "overdue": return "⏰";
      case "no_outcomes": return "📭";
      case "never_acknowledged": return "🔕";
      case "decision_no_owner": return "🎯";
      case "repeated_issue": return "🔄";
      default: return "⚠️";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "overdue": return "border-red-500/30 bg-red-500/5 text-red-300";
      case "no_outcomes": return "border-amber-500/30 bg-amber-500/5 text-amber-300";
      case "repeated_issue": return "border-purple-500/30 bg-purple-500/5 text-purple-300";
      default: return "border-amber-500/30 bg-amber-500/5 text-amber-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  // Calculate totals
  const totalMeetings = weeks.reduce((sum, w) => sum + w.meetings_count, 0);
  const totalDecisions = weeks.reduce((sum, w) => sum + w.decisions_count, 0);
  const totalActions = weeks.reduce((sum, w) => sum + w.action_items_count, 0);
  const avgScore = weeks.length > 0
    ? (weeks.reduce((sum, w) => sum + w.avg_productivity_score, 0) / weeks.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.1),_transparent_50%)]" />

      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
            <span className="text-lg font-semibold tracking-tight">Ledger</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/chat")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Ask AI
            </button>
            <button
              onClick={() => navigate("/meetings")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Meetings
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Weekly metrics and alerts across all your meetings.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
            <div className="text-2xl font-bold text-ledger-pink">{totalMeetings}</div>
            <div className="mt-1 text-sm text-slate-400">Meetings (4 weeks)</div>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
            <div className="text-2xl font-bold text-ledger-pink">{totalDecisions}</div>
            <div className="mt-1 text-sm text-slate-400">Decisions</div>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
            <div className="text-2xl font-bold text-ledger-pink">{totalActions}</div>
            <div className="mt-1 text-sm text-slate-400">Action Items</div>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
            <div className="text-2xl font-bold text-ledger-pink">{avgScore}</div>
            <div className="mt-1 text-sm text-slate-400">Avg Productivity Score</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Metrics */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">📊 Weekly Metrics</h2>

            {weeks.length === 0 ? (
              <p className="text-sm text-slate-500">No data for the last 4 weeks.</p>
            ) : (
              <div className="space-y-4">
                {weeks.map((week, idx) => {
                  const weekDate = new Date(week.week_start);
                  const weekLabel = weekDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div key={idx} className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">Week of {weekLabel}</span>
                        <span className="rounded-full bg-ledger-pink/20 px-2 py-0.5 text-xs text-ledger-pink">
                          Score: {week.avg_productivity_score}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-semibold text-slate-100">{week.meetings_count}</div>
                          <div className="text-xs text-slate-500">Meetings</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-emerald-400">{week.decisions_count}</div>
                          <div className="text-xs text-slate-500">Decisions</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-amber-400">{week.action_items_count}</div>
                          <div className="text-xs text-slate-500">Actions</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts Inbox */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold">🔔 Alerts Inbox</h2>

            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <p className="text-sm text-slate-400">No alerts — everything looks good!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => navigate(`/meetings/${alert.meeting_id}`)}
                    className={`w-full text-left rounded-lg border p-3 transition-all hover:scale-[1.01] ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getAlertIcon(alert.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{alert.message}</p>
                        <p className="mt-1 text-xs text-slate-500 truncate">
                          {getMeetingTitle(alert.meeting_id)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/meetings")}
              className="rounded-full bg-ledger-pink px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors"
            >
              View All Meetings
            </button>
            <button
              onClick={() => navigate("/meetings")}
              className="rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
            >
              + New Meeting
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}