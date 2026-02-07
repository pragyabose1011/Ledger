// /Users/pragyabose/Ledger/frontend/src/pages/MeetingDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Decision = {
  id: string;
  summary: string;
  source_sentence: string | null;
  confidence?: number | null;
};

type ActionItem = {
  id: string;
  description: string;
  status: string;
  owner: string | null;
  source_sentence: string | null;
  confidence?: number | null;
};

type Alert = {
  id: string;
  type: string;
  message: string;
};

type Risk = {
  id: string;
  description: string;
  source_sentence: string | null;
  confidence?: number | null;
};

type MeetingDetail = {
  id: string;
  title: string;
  platform?: string;
  transcript_id: string | null;
  transcript_content: string | null;
  has_extractions: boolean;
  decisions: Decision[];
  action_items: ActionItem[];
  risks: Risk[];
};

type Metrics = {
  meeting_id: string;
  decisions: number;
  action_items: number;
  productivity_score: number;
  classification: string;
  actions_with_owner: number;
  actions_without_owner: number;
  has_outcomes: boolean;
};

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const meetingRes = await api.get(`/meetings/${id}`);
      setMeeting(meetingRes.data);

      try {
        const alertRes = await api.get(`/alerts/${id}`);
        setAlerts(alertRes.data);
      } catch (err) {
        console.error("Failed to load alerts", err);
        setAlerts([]);
      }

      try {
        const metricsRes = await api.get(`/metrics/meeting/${id}`);
        setMetrics(metricsRes.data);
      } catch (err) {
        console.error("Failed to load metrics", err);
        setMetrics(null);
      }
    } catch (err) {
      console.error("Failed to load meeting", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  const runExtraction = async () => {
    if (!meeting?.transcript_id) {
      alert("No transcript found for this meeting.");
      return;
    }

    try {
      setExtracting(true);
      await api.post("/extract/", { transcript_id: meeting.transcript_id });
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Extraction failed. Check backend logs.");
    } finally {
      setExtracting(false);
    }
  };

  if (loading || !meeting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading meeting…</p>
      </div>
    );
  }

  const transcriptLines =
    meeting.transcript_content?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];

  const decisionSentences = meeting.decisions.map((d) => d.source_sentence).filter((s): s is string => Boolean(s));
  const actionSentences = meeting.action_items.map((a) => a.source_sentence).filter((s): s is string => Boolean(s));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.1),_transparent_50%)]" />

      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
              <span className="text-lg font-semibold tracking-tight">Ledger</span>
            </div>
            <span className="text-slate-600">•</span>
            <button onClick={() => navigate("/meetings")} className="text-sm text-slate-400 hover:text-ledger-pink transition-colors">
              ← Back to meetings
            </button>
          </div>

          <button onClick={runExtraction} disabled={extracting} className="rounded-full bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {extracting ? "Extracting…" : "Re-run Extraction"}
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">{meeting.title}</h1>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{meeting.platform || "Platform"}</span>
          </div>
          <p className="text-sm text-slate-400">View insights</p>
        </div>

        {alerts.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur">
            <h3 className="mb-2 text-sm font-medium text-amber-400">⚠️ Alerts</h3>
            <ul className="space-y-1">
              {alerts.map((a) => (
                <li key={a.id} className="text-sm text-amber-200/80">{a.message}</li>
              ))}
            </ul>
          </div>
        )}

        {metrics && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
              <div className="text-2xl font-bold text-ledger-pink">{metrics.decisions}</div>
              <div className="mt-1 text-sm text-slate-400">Decisions</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
              <div className="text-2xl font-bold text-ledger-pink">{metrics.action_items}</div>
              <div className="mt-1 text-sm text-slate-400">Action Items</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
              <div className="text-2xl font-bold text-ledger-pink">{metrics.productivity_score}</div>
              <div className="mt-1 text-sm text-slate-400">Productivity Score</div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur">
              <div className="text-sm font-medium text-slate-300 capitalize">{metrics.classification.replace(/_/g, " ")}</div>
              <div className="mt-1 text-sm text-slate-400">Classification</div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><span className="text-emerald-400">✓</span> Decisions</h2>
              {meeting.decisions.length === 0 ? (
                <p className="text-sm text-slate-500">No decisions recorded.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.decisions.map((d) => (
                    <li key={d.id} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                      <p className="text-sm text-slate-200">{d.summary}</p>
                      {d.confidence != null && <p className="mt-1 text-xs text-slate-500">{Math.round(d.confidence * 100)}% confidence</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><span className="text-red-400">⚠</span> Risks & Blockers</h2>
              {meeting.risks.length === 0 ? (
                <p className="text-sm text-slate-500">No risks identified.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.risks.map((r) => (
                    <li key={r.id} className="rounded-lg border border-red-900/30 bg-red-900/10 p-3">
                      <p className="text-sm text-red-200">{r.description}</p>
                      {r.confidence != null && <p className="mt-1 text-xs text-red-400/60">{Math.round(r.confidence * 100)}% confidence</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold"><span className="text-amber-400">◆</span> Action Items</h2>
              {meeting.action_items.length === 0 ? (
                <p className="text-sm text-slate-500">No action items.</p>
              ) : (
                <ul className="space-y-3">
                  {meeting.action_items.map((a) => (
                    <li key={a.id} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-200">{a.description}</p>
                        <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{a.status}</span>
                      </div>
                      {a.owner && <p className="mt-1 text-xs text-slate-500">Owner: {a.owner}</p>}
                      {a.confidence != null && <p className="mt-1 text-xs text-slate-500">{Math.round(a.confidence * 100)}% confidence</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
              <h2 className="mb-4 text-xl font-semibold">Transcript</h2>
              {transcriptLines.length === 0 ? (
                <p className="text-sm text-slate-500">No transcript uploaded.</p>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {transcriptLines.map((line, idx) => {
                    const isDecision = decisionSentences.some((s) => line.includes(s));
                    const isAction = actionSentences.some((s) => line.includes(s));
                    let borderColor = "border-slate-800";
                    let bgColor = "bg-slate-800/20";
                    if (isDecision && isAction) { borderColor = "border-blue-500/50"; bgColor = "bg-blue-500/10"; }
                    else if (isDecision) { borderColor = "border-emerald-500/50"; bgColor = "bg-emerald-500/10"; }
                    else if (isAction) { borderColor = "border-amber-500/50"; bgColor = "bg-amber-500/10"; }
                    return <div key={idx} className={`rounded-lg border ${borderColor} ${bgColor} p-2 text-xs text-slate-300`}>{line}</div>;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}