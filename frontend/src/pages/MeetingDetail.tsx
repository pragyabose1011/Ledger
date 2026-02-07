import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

/* ---------------- TYPES ---------------- */

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

type MeetingDetail = {
  id: string;
  title: string;
  platform?: string;
  transcript_id: string | null;
  transcript_content: string | null;
  has_extractions: boolean;
  decisions: Decision[];
  action_items: ActionItem[];
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


/* ---------------- COMPONENT ---------------- */

export default function MeetingDetailPage() {
  const { id } = useParams();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);


    /* ---------------- DATA FETCH + METRICS ---------------- */

  const fetchAll = async () => {
    setLoading(true);

    try {
      // 1) Meeting
      const meetingRes = await api.get(`/meetings/${id}`);
      setMeeting(meetingRes.data);

      // 2) Alerts (optional)
      try {
        const alertRes = await api.get(`/alerts/${id}`);
        setAlerts(alertRes.data);
      } catch (err) {
        console.error("Failed to load alerts", err);
        setAlerts([]);
      }

      // 3) Metrics (optional)
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
    fetchAll().catch((err) => {
      console.error("Failed to load data", err);
      setLoading(false);
    });
  }, [id]);


  /* ---------------- EXTRACTION ---------------- */

  const runExtraction = async () => {
    if (!meeting?.transcript_id) {
      alert("No transcript found for this meeting.");
      return;
    }

    try {
      setExtracting(true);

      await api.post("/extract/", {
        transcript_id: meeting.transcript_id,
      });

      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Extraction failed. Check backend logs.");
    } finally {
      setExtracting(false);
    }
  };

  /* ---------------- GUARD ---------------- */

  if (loading || !meeting) {
    return <div style={{ padding: 40 }}>Loading meeting…</div>;
  }

  /* ---------------- NORMALIZATION ---------------- */

  const transcriptLines =
    meeting.transcript_content
      ?.split("\n")
      .map((l) => l.trim())
      .filter(Boolean) ?? [];

  const decisionSentences = meeting.decisions
    .map((d) => d.source_sentence)
    .filter((s): s is string => Boolean(s));

  const actionSentences = meeting.action_items
    .map((a) => a.source_sentence)
    .filter((s): s is string => Boolean(s));

  /* ---------------- UI ---------------- */

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <Link to="/meetings">← Back to meetings</Link>

      <h1 style={{ marginTop: 16 }}>{meeting.title}</h1>
      <p style={{ color: "#7a1c1c" }}>{meeting.platform}</p>

      <button
        onClick={runExtraction}
        disabled={extracting}
        style={{
          marginTop: 12,
          padding: "10px 18px",
          fontSize: 14,
          borderRadius: 6,
          cursor: extracting ? "not-allowed" : "pointer",
        }}
      >
        {extracting ? "Extracting…" : "Run / Re-run Extraction"}
      </button>

      {/* ---------------- TRANSCRIPT ---------------- */}

      <h2 style={{ marginTop: 32 }}>Transcript</h2>

      {transcriptLines.length === 0 ? (
        <p style={{ color: "#888" }}>No transcript uploaded.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {transcriptLines.map((line, idx) => {
              const isDecision = decisionSentences.some((s) => line.includes(s));
              const isAction = actionSentences.some((s) => line.includes(s));

              let bg = "#fff";
              let border = "#ddd";
              let tooltip: string | undefined;

              if (isDecision && isAction) {
                bg = "#e0f2fe";
                border = "#3b82f6";
                tooltip = "Decision & Action Item";
              } else if (isDecision) {
                bg = "#ecfdf5";
                border = "#10b981";
                tooltip = "Decision";
              } else if (isAction) {
                bg = "#fffbeb";
                border = "#f59e0b";
                tooltip = "Action Item";
              }

              return (
                <li
                  key={idx}
                  title={tooltip}
                  style={{
                    background: bg,
                    borderLeft: `5px solid ${border}`,
                    padding: "8px 12px",
                    marginBottom: 6,
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                >
                  {line}
                </li>
              );
            })}
        </ul>
      )}

      {/* ---------------- DECISIONS ---------------- */}

      <h2 style={{ marginTop: 32 }}>Decisions</h2>

      {meeting.decisions.length === 0 ? (
        <p>No decisions recorded.</p>
      ) : (
        <ul>
          {meeting.decisions.map((d) => (
            <li key={d.id}>
              {d.summary}{" "}
              {d.confidence != null && (
                <span style={{ color: "#666", fontSize: 12 }}>
                  ({Math.round(d.confidence * 100)}% confidence)
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- ACTION ITEMS ---------------- */}

      <h2 style={{ marginTop: 32 }}>Action Items</h2>

      {meeting.action_items.length === 0 ? (
        <p>No action items.</p>
      ) : (
        <table
          style={{
            borderCollapse: "collapse",
            marginTop: 12,
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th style={th}>Description</th>
              <th style={th}>Owner</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {meeting.action_items.map((a) => (
              <tr key={a.id}>
                <td style={td}>
                  {a.description}
                  {a.confidence != null && (
                    <div style={{ color: "#666", fontSize: 12 }}>
                      {Math.round(a.confidence * 100)}% confidence
                    </div>
                  )}
                </td>
                <td style={td}>{a.owner ?? "-"}</td>
                <td style={td}>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* ---------------- PRODUCTIVITY SUMMARY ---------------- */}

      <h2 style={{ marginTop: 30 }}>📊 Productivity Metrics</h2>

      {metrics ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 12,
          }}
        >
          <div style={{ padding: 16, border: "1px solid #ddd" }}>
            <strong>Decisions</strong>
            <div>{metrics.decisions_count}</div>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd" }}>
            <strong>Action Items</strong>
            <div>{metrics.action_items_count}</div>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd" }}>
            <strong>Owned Actions</strong>
            <div>{metrics.actions_with_owner}</div>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd" }}>
            <strong>Unowned Actions</strong>
            <div>{metrics.actions_without_owner}</div>
          </div>

          <div style={{ padding: 16, border: "1px solid #ddd" }}>
            <strong>Has Outcomes</strong>
            <div>{metrics.has_outcomes ? "✅ Yes" : "❌ No"}</div>
          </div>

          <div
            style={{
              padding: 16,
              border: "2px solid #2563eb",
              fontWeight: "bold",
            }}
          >
            Productivity Score
            <div>{metrics.productivity_score}</div>
          </div>
        </div>
      ) : (
        <p>Loading metrics…</p>
      )}
      {/* ---------------- ALERTS ---------------- */}

      <h2 style={{ marginTop: 32 }}>Alerts</h2>

        {alerts.length === 0 ? (
          <p style={{ color: "#666" }}>No alerts 🎉</p>
        ) : (
          <ul>
            {alerts.map((a) => (
              <li key={a.id} style={{ color: "#b45309" }}>
                ⚠️ {a.message}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const th = {
  border: "1px solid #333",
  padding: 8,
  background: "#f3f3f3",
};

const td = {
  border: "1px solid #333",
  padding: 8,
};
