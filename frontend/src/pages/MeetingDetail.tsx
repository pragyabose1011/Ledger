import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

type Decision = {
  id: string;
  summary: string;
  source_sentence?: string;
};

type ActionItem = {
  id: string;
  description: string;
  status: string;
  owner?: string;
  source_sentence?: string;
};

type MeetingDetail = {
  id: string;
  title: string;
  platform?: string;
  transcript_id?: string | null;
  transcript_content?: string | null;
  has_extractions: boolean;
  decisions: Decision[];
  action_items: ActionItem[];
};

export default function MeetingDetailPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const fetchMeeting = async () => {
    setLoading(true);
    const res = await axios.get(
      `http://127.0.0.1:8000/meetings/${id}`
    );
    setMeeting(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeeting().catch(console.error);
  }, [id]);

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

      await fetchMeeting();
    } catch (err) {
      console.error(err);
      alert("Extraction failed. Check backend logs.");
    } finally {
      setExtracting(false);
    }
  };

  if (loading && !meeting) {
    return <div style={{ padding: 40 }}>Loading meeting…</div>;
  }
  const transcriptLines = meeting.transcript_content
  ? meeting.transcript_content.split("\n")
  : [];

const decisionSentences = new Set(
  meeting.decisions
    .map((d) => d.source_sentence)
    .filter(Boolean)
);

const actionSentences = new Set(
  meeting.action_items
    .map((a) => a.source_sentence)
    .filter(Boolean)
);

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");


  return (
    <div style={{ padding: 40 }}>
      <Link to="/">← Back to meetings</Link>

      <h1 style={{ fontSize: 28, marginTop: 20 }}>
        {meeting.title}
      </h1>
      <p style={{ color: "#666" }}>{meeting.platform}</p>

      {/* 🔘 Extraction Button */}
      <button
        onClick={runExtraction}
        disabled={extracting}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          fontSize: 14,
          cursor: extracting ? "not-allowed" : "pointer",
        }}
      >
        {extracting ? "Extracting…" : "Run / Re-run Extraction"}
      </button>

      {/* 📜 TRANSCRIPT VIEWER (C2) */}
      <h2 style={{ marginTop: 30 }}>Transcript</h2>
      {transcriptLines.length === 0 ? (
  <p style={{ color: "#888" }}>
    No transcript uploaded for this meeting.
  </p>
) : (
  <ul style={{ listStyle: "none", paddingLeft: 0 }}>
    {transcriptLines.map((line, idx) => {
      let background = "transparent";

      if (decisionSentences.has(line)) {
        background = "#d1fae5"; // 🟩 decision
      } else if (actionSentences.has(line)) {
        background = "#fef3c7"; // 🟨 action
      }

      return (
        <li
          key={idx}
          style={{
            background,
            padding: "6px 8px",
            borderRadius: 6,
            marginBottom: 4,
            fontSize: 14,
          }}
        >
          {line}
        </li>
      );
    })}
  </ul>
)}


      {/* 📌 Decisions */}
      <h2 style={{ marginTop: 30 }}>Decisions</h2>
      {meeting.decisions.length === 0 ? (
        <p>No decisions recorded.</p>
      ) : (
        <ul>
          {meeting.decisions.map((d) => (
            <li key={d.id}>{d.summary}</li>
          ))}
        </ul>
      )}

      {/* ✅ Action Items */}
      <h2 style={{ marginTop: 30 }}>Action Items</h2>
      {meeting.action_items.length === 0 ? (
        <p>No action items.</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Owner</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {meeting.action_items.map((a) => (
              <tr key={a.id}>
                <td>{a.description}</td>
                <td>{a.owner || "-"}</td>
                <td>{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
