import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

/* ---------------- TYPES ---------------- */

type Decision = {
  id: string;
  summary: string;
  source_sentence: string | null;
};

type ActionItem = {
  id: string;
  description: string;
  status: string;
  owner: string | null;
  source_sentence: string | null;
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
  decisions: number;
  action_items: number;
  productivity_score: number;
  classification: string;
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
      const meetingRes = await axios.get(
        `http://127.0.0.1:8000/meetings/${id}`
      );
      setMeeting(meetingRes.data);

      // 2) Alerts (optional)
      try {
        const alertRes = await axios.get(
          `http://127.0.0.1:8000/alerts/${id}`
        );
        setAlerts(alertRes.data);
      } catch (err) {
        console.error("Failed to load alerts", err);
        setAlerts([]);
      }

      // 3) Metrics (optional)
      try {
        const metricsRes = await axios.get(
          `http://127.0.0.1:8000/metrics/meeting/${id}`
        );
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

      await axios.post("http://127.0.0.1:8000/extract/", {
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
      <Link to="/">← Back to meetings</Link>

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
            let bg = "#fff";
            let border = "#ddd";

            if (decisionSentences.some((s) => line.includes(s))) {
              bg = "#ecfdf5";
              border = "#10b981";
            } else if (actionSentences.some((s) => line.includes(s))) {
              bg = "#fffbeb";
              border = "#f59e0b";
            }

            return (
              <li
                key={idx}
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
            <li key={d.id}>{d.summary}</li>
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
                <td style={td}>{a.description}</td>
                <td style={td}>{a.owner ?? "-"}</td>
                <td style={td}>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* ---------------- PRODUCTIVITY SUMMARY ---------------- */}

      <h2 style={{ marginTop: 32 }}>Productivity Summary</h2>

      {metrics && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            border: "1px solid #ddd",
            background:
              metrics.classification === "productive"
                ? "#fbd0ec"
                : metrics.classification === "needs_follow_up"
                ? "#feeda5"
                : "#ffb4b4",
          }}
        >
          <p>
            <strong>Decisions:</strong> {metrics.decisions}
          </p>
          <p>
            <strong>Action Items:</strong> {metrics.action_items}
          </p>
          <p>
            <strong>Classification:</strong>{" "}
            {metrics.classification.replace("_", " ")}
          </p>
        </div>
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
