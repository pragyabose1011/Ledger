import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";

type Participant = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

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
  acknowledged_at?: string | null;
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
  participants: Participant[];
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

type TranscriptLine = {
  speaker: string | null;
  message: string;
  isDecision: boolean;
  isAction: boolean;
  isRisk: boolean;
};

// Generate consistent colors for speakers
const speakerColors: Record<string, string> = {};
const colorPalette = [
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
];

function getSpeakerColor(speaker: string): string {
  if (!speakerColors[speaker]) {
    const idx = Object.keys(speakerColors).length % colorPalette.length;
    speakerColors[speaker] = colorPalette[idx];
  }
  return speakerColors[speaker];
}

function parseTranscriptLine(line: string): { speaker: string | null; message: string } {
  const match = line.match(/^(?:\[?([A-Za-z][A-Za-z0-9\s]*?)\]?\s*:\s*)(.+)$/);
  if (match) {
    return { speaker: match[1].trim(), message: match[2].trim() };
  }
  return { speaker: null, message: line };
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [exporting, setExporting] = useState(false);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Live recording state
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<{
    summary: string;
    questions: string[];
    action_items: string[];
    decisions: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTranscriptRef = useRef("");
  const liveScrollRef = useRef<HTMLDivElement>(null);

  // Add near other handler functions:

  const handleAudioUpload = async () => {
    if (!audioFile) {
      toast("Please select an audio file", "warning");
      return;
    }

    try {
      setUploadingAudio(true);
      setUploadProgress("Uploading file...");

      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("meeting_id", id!);
      formData.append("use_local_whisper", "false");

      setUploadProgress("Transcribing audio (this may take a minute)...");

      const res = await api.post("/upload/audio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadProgress("Running AI extraction...");
      
      // Auto-run extraction
      await api.post("/extract/", { transcript_id: res.data.transcript_id });

      setShowAudioUpload(false);
      setAudioFile(null);
      setUploadProgress("");
      await fetchAll();
      
      toast("Audio transcribed and extracted successfully!", "success");
    } catch (err: any) {
      console.error("Audio upload failed", err);
      toast(err?.response?.data?.detail || "Failed to transcribe audio", "error");
    } finally {
      setUploadingAudio(false);
      setUploadProgress("");
    }
  };

  // Keep ref in sync so interval closure always reads current transcript
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
    if (liveScrollRef.current) {
      liveScrollRef.current.scrollTop = liveScrollRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, []);

  const fetchAiSuggestions = async () => {
    if (liveTranscriptRef.current.length < 40) return;
    setAiLoading(true);
    try {
      const res = await api.post("/live/assist", {
        transcript: liveTranscriptRef.current,
        meeting_title: meeting?.title || "Meeting",
      });
      setAiSuggestions(res.data);
    } catch (err) {
      console.error("AI assist failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast("Live recording requires Chrome or Edge", "warning");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t + " ";
        else interim += t;
      }
      if (finalChunk) setLiveTranscript((prev) => prev + finalChunk);
      setInterimText(interim);
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech") return;
      console.error("Speech recognition error", e.error);
    };

    // Auto-restart on silence (Web Speech API stops after a pause)
    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setLiveTranscript("");
    setInterimText("");
    setAiSuggestions(null);

    // Poll AI every 15 seconds
    aiIntervalRef.current = setInterval(fetchAiSuggestions, 15000);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (aiIntervalRef.current) {
      clearInterval(aiIntervalRef.current);
      aiIntervalRef.current = null;
    }
    setIsRecording(false);
    setInterimText("");

    const finalTranscript = liveTranscriptRef.current.trim();
    if (finalTranscript.length < 10) return;

    try {
      setUploading(true);
      const res = await api.post("/transcripts/", {
        meeting_id: id,
        content: `Live Recording\n\n${finalTranscript}`,
      });
      await api.post("/extract/", { transcript_id: res.data.transcript_id });
      setLiveTranscript("");
      await fetchAll();
    } catch (err) {
      console.error("Failed to save live transcript", err);
    } finally {
      setUploading(false);
    }
  };

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
      toast("Please upload a transcript first", "warning");
      return;
    }

    try {
      setExtracting(true);
      await api.post("/extract/", { transcript_id: meeting.transcript_id });
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast("Extraction failed — check backend logs", "error");
    } finally {
      setExtracting(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipantEmail.trim()) return;

    try {
      setAddingParticipant(true);
      await api.post(`/meetings/${id}/participants`, {
        email: newParticipantEmail,
        name: newParticipantEmail.split("@")[0],
        role: "attendee",
      });
      setNewParticipantEmail("");
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to add participant", "error");
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!confirm("Remove this participant?")) return;

    try {
      await api.delete(`/meetings/${id}/participants/${userId}`);
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data);
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to remove participant", "error");
    }
  };

  const handleUploadTranscript = async () => {
    if (!transcriptText.trim()) {
      toast("Please paste a transcript", "warning");
      return;
    }

    try {
      setUploading(true);
      const res = await api.post("/transcripts/", {
        meeting_id: id,
        content: transcriptText,
      });
      await api.post("/extract/", { transcript_id: res.data.transcript_id });
      setShowUploadModal(false);
      setTranscriptText("");
      await fetchAll();
    } catch (err) {
      console.error("Failed to upload transcript", err);
      toast("Failed to upload transcript", "error");
    } finally {
      setUploading(false);
    }
  };

  const toggleActionDone = async (actionId: string, currentStatus: string) => {
    try {
      if (currentStatus === "done") {
        await api.post(`/action-items/${actionId}/reopen`);
      } else {
        await api.post(`/action-items/${actionId}/done`);
      }
      await fetchAll();
    } catch (err) {
      console.error("Failed to update action item", err);
    }
  };

  const acknowledgeAction = async (actionId: string) => {
    try {
      await api.post(`/action-items/${actionId}/acknowledge`);
      await fetchAll();
    } catch (err) {
      console.error("Failed to acknowledge action item", err);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await api.get(`/export/meeting/${id}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const safeTitle = meeting?.title.replace(/[^a-zA-Z0-9-_ ]/g, "") || "meeting";
      link.setAttribute("download", `ledger-${safeTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      toast("Failed to export PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !meeting) {
    return (
      <Layout>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
            <span className="text-slate-400 text-sm">Loading meeting…</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse transcript with speaker detection and highlight matching
  const rawLines = meeting.transcript_content?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const decisionSentences = meeting.decisions.map((d) => d.source_sentence).filter((s): s is string => Boolean(s));
  const actionSentences = meeting.action_items.map((a) => a.source_sentence).filter((s): s is string => Boolean(s));
  const riskSentences = meeting.risks.map((r) => r.source_sentence).filter((s): s is string => Boolean(s));

  const transcriptLines: TranscriptLine[] = rawLines.map((line) => {
    const { speaker, message } = parseTranscriptLine(line);
    const fullLine = line;
    return {
      speaker,
      message,
      isDecision: decisionSentences.some((s) => fullLine.includes(s) || message.includes(s)),
      isAction: actionSentences.some((s) => fullLine.includes(s) || message.includes(s)),
      isRisk: riskSentences.some((s) => fullLine.includes(s) || message.includes(s)),
    };
  });

  const speakers = [...new Set(transcriptLines.map((l) => l.speaker).filter((s): s is string => Boolean(s)))];

  return (
    <Layout>
      {/* Page header bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/meetings")}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Meetings
            </button>
            <span className="text-slate-700">/</span>
            <span className="text-sm text-slate-300 font-medium truncate max-w-xs">{meeting.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {!meeting.transcript_id && (
              <>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded-lg border border-ledger-pink/60 px-3 py-1.5 text-sm font-medium text-ledger-pink hover:bg-ledger-pink/10 transition-colors"
                >
                  Upload Transcript
                </button>
                <button
                  onClick={() => setShowAudioUpload(true)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Upload Audio
                </button>
              </>
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "border border-slate-700 text-slate-300 hover:border-ledger-pink hover:text-ledger-pink"
              }`}
            >
              {isRecording ? (
                <><span className="h-2 w-2 rounded-full bg-white animate-pulse" />Stop</>
              ) : (
                <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>Record</>
              )}
            </button>
            {meeting.has_extractions && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-slate-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {exporting ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                {exporting ? "Exporting…" : "Export PDF"}
              </button>
            )}
            <button
              onClick={runExtraction}
              disabled={extracting || !meeting.transcript_id}
              className="rounded-lg bg-ledger-pink px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extracting ? "Extracting…" : "Re-run AI"}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Upload Modal */}
      {showAudioUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold">Upload Audio / Video</h2>
            <p className="mb-4 text-sm text-slate-400">We'll automatically transcribe it using AI.</p>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm text-slate-300">Select file</label>
              <input
                type="file"
                accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm,.ogg"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-ledger-pink file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-pink-400"
              />
              <p className="mt-1.5 text-xs text-slate-500">MP3, MP4, WAV, M4A, WebM, OGG · Max 25MB</p>
            </div>
            {audioFile && (
              <div className="mb-4 rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-ledger-pink/20 flex items-center justify-center text-ledger-pink text-sm">♪</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{audioFile.name}</p>
                  <p className="text-xs text-slate-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            {uploadProgress && (
              <div className="mb-4 rounded-lg border border-ledger-pink/30 bg-ledger-pink/5 px-4 py-2.5 flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
                <p className="text-sm text-ledger-pink">{uploadProgress}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowAudioUpload(false); setAudioFile(null); }} disabled={uploadingAudio}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleAudioUpload} disabled={uploadingAudio || !audioFile}
                className="flex-1 rounded-lg bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50">
                {uploadingAudio ? "Processing…" : "Transcribe"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">{meeting.title}</h1>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">{meeting.platform || "Platform"}</span>
          </div>
          <p className="text-sm text-slate-400">View insights</p>
        </div>

        {!meeting.transcript_id && (
          <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 text-center backdrop-blur">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-slate-300 mb-2">No transcript uploaded yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Upload a transcript to extract decisions, action items, and risks.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="rounded-full bg-ledger-pink px-6 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
            >
              Upload Transcript
            </button>
          </div>
        )}

        {/* Participants Section */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Participants
              <span className="text-sm text-slate-500 font-normal">
                ({meeting?.participants?.length || 0})
              </span>
            </h2>
          </div>

          {/* Add Participant Form */}
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="Add participant by email..."
              value={newParticipantEmail}
              onChange={(e) => setNewParticipantEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-ledger-pink focus:outline-none"
            />
            <button
              onClick={handleAddParticipant}
              disabled={addingParticipant || !newParticipantEmail.trim()}
              className="rounded-lg bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 hover:bg-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addingParticipant ? "..." : "Add"}
            </button>
          </div>

          {/* Participants List */}
          {meeting?.participants && meeting.participants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meeting.participants.map((p) => (
                <div
                  key={p.id}
                  className="group flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-xs font-medium text-white">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-200">{p.name}</span>
                    {p.role && <span className="text-xs text-slate-500">{p.role}</span>}
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="ml-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                    title="Remove participant"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No participants added yet</p>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur">
            <h3 className="mb-2 text-sm font-medium text-amber-400">⚠️ Alerts</h3>
            <ul className="space-y-1">
              {alerts.map((a) => (
                <li key={a.id} className="text-sm text-amber-200/80">
                  {a.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {metrics && meeting.transcript_id && (
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

        {meeting.transcript_id && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <span className="text-emerald-400">✓</span> Decisions
                </h2>
                {meeting.decisions.length === 0 ? (
                  <p className="text-sm text-slate-500">No decisions recorded.</p>
                ) : (
                  <ul className="space-y-3">
                    {meeting.decisions.map((d) => (
                      <li key={d.id} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                        <p className="text-sm text-slate-200">{d.summary}</p>
                        {d.confidence != null && (
                          <p className="mt-1 text-xs text-slate-500">{Math.round(d.confidence * 100)}% confidence</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <span className="text-red-400">⚠</span> Risks & Blockers
                </h2>
                {meeting.risks.length === 0 ? (
                  <p className="text-sm text-slate-500">No risks identified.</p>
                ) : (
                  <ul className="space-y-3">
                    {meeting.risks.map((r) => (
                      <li key={r.id} className="rounded-lg border border-red-900/30 bg-red-900/10 p-3">
                        <p className="text-sm text-red-200">{r.description}</p>
                        {r.confidence != null && (
                          <p className="mt-1 text-xs text-red-400/60">{Math.round(r.confidence * 100)}% confidence</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <span className="text-amber-400">◆</span> Action Items
                </h2>
                {meeting.action_items.length === 0 ? (
                  <p className="text-sm text-slate-500">No action items.</p>
                ) : (
                  <ul className="space-y-3">
                    {meeting.action_items.map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-lg border p-3 ${
                          a.status === "done" ? "border-emerald-800/50 bg-emerald-900/10" : "border-slate-800 bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleActionDone(a.id, a.status)}
                            className={`mt-0.5 h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                              a.status === "done"
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-slate-600 hover:border-ledger-pink"
                            }`}
                          >
                            {a.status === "done" && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${a.status === "done" ? "text-slate-400 line-through" : "text-slate-200"}`}>
                              {a.description}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {a.owner && (
                                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">{a.owner}</span>
                              )}

                              {a.status === "done" ? (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">✓ Done</span>
                              ) : a.acknowledged_at ? (
                                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">✓ Acknowledged</span>
                              ) : (
                                <button
                                  onClick={() => acknowledgeAction(a.id)}
                                  className="rounded-full border border-blue-500/50 px-2 py-0.5 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
                                >
                                  Acknowledge
                                </button>
                              )}

                              {a.confidence != null && <span className="text-xs text-slate-500">{Math.round(a.confidence * 100)}%</span>}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Enhanced Transcript Display */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Transcript</h2>
                  <button onClick={() => setShowUploadModal(true)} className="text-xs text-ledger-pink hover:underline">
                    Replace transcript
                  </button>
                </div>

                {speakers.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {speakers.map((speaker) => (
                      <span key={speaker} className={`rounded-full border px-2 py-0.5 text-xs ${getSpeakerColor(speaker)}`}>
                        {speaker}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Decision
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span> Action
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span> Risk
                  </span>
                </div>

                {transcriptLines.length === 0 ? (
                  <p className="text-sm text-slate-500">No transcript uploaded.</p>
                ) : (
                  <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
                    {transcriptLines.map((line, idx) => {
                      let highlightClass = "";
                      let borderIndicator = "";

                      if (line.isDecision && line.isAction) {
                        highlightClass = "bg-blue-500/10";
                        borderIndicator = "border-l-4 border-l-blue-500";
                      } else if (line.isDecision) {
                        highlightClass = "bg-emerald-500/5";
                        borderIndicator = "border-l-4 border-l-emerald-500";
                      } else if (line.isAction) {
                        highlightClass = "bg-amber-500/5";
                        borderIndicator = "border-l-4 border-l-amber-500";
                      } else if (line.isRisk) {
                        highlightClass = "bg-red-500/5";
                        borderIndicator = "border-l-4 border-l-red-500";
                      }

                      return (
                        <div key={idx} className={`rounded-lg border border-slate-800/50 bg-slate-800/20 p-3 ${highlightClass} ${borderIndicator}`}>
                          {line.speaker ? (
                            <div className="flex items-start gap-3">
                              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getSpeakerColor(line.speaker)}`}>
                                {line.speaker}
                              </span>
                              <p className="text-sm text-slate-300 leading-relaxed">{line.message}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 leading-relaxed">{line.message}</p>
                          )}

                          {(line.isDecision || line.isAction || line.isRisk) && (
                            <div className="mt-2 flex gap-2">
                              {line.isDecision && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">Decision</span>
                              )}
                              {line.isAction && (
                                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">Action Item</span>
                              )}
                              {line.isRisk && (
                                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">Risk</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Recording Panel */}
      {isRecording && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md shadow-2xl"
          style={{ maxHeight: "45vh" }}>
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-100">Recording Live</span>
              <span className="text-xs text-slate-500">{liveTranscript.split(" ").filter(Boolean).length} words</span>
            </div>
            <div className="flex items-center gap-3">
              {aiLoading && (
                <div className="flex items-center gap-1.5 text-xs text-ledger-pink">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
                  AI thinking…
                </div>
              )}
              <button
                onClick={stopRecording}
                className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-400 transition-colors"
              >
                Stop & Save
              </button>
            </div>
          </div>

          <div className="flex h-full" style={{ height: "calc(45vh - 53px)" }}>
            {/* Live transcript */}
            <div className="flex-1 overflow-y-auto p-4" ref={liveScrollRef}>
              <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                {liveTranscript}
                {interimText && (
                  <span className="text-slate-500 italic">{interimText}</span>
                )}
                {!liveTranscript && !interimText && (
                  <span className="text-slate-600">Listening… start speaking to see your transcript here.</span>
                )}
              </p>
            </div>

            {/* AI suggestions sidebar */}
            <div className="w-80 shrink-0 border-l border-slate-800 overflow-y-auto p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ledger-pink">AI Suggestions</p>
              {!aiSuggestions && !aiLoading && (
                <p className="text-xs text-slate-600">Suggestions appear after ~15 seconds of speech.</p>
              )}
              {aiSuggestions && (
                <div className="space-y-4">
                  {aiSuggestions.summary && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-slate-400">Summary</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{aiSuggestions.summary}</p>
                    </div>
                  )}
                  {aiSuggestions.decisions.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-emerald-400">Decisions</p>
                      <ul className="space-y-1">
                        {aiSuggestions.decisions.map((d, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                            <span className="text-emerald-500 shrink-0">✓</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.action_items.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-amber-400">Action Items</p>
                      <ul className="space-y-1">
                        {aiSuggestions.action_items.map((a, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                            <span className="text-amber-500 shrink-0">◆</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiSuggestions.questions.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-blue-400">Open Questions</p>
                      <ul className="space-y-1">
                        {aiSuggestions.questions.map((q, i) => (
                          <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                            <span className="text-blue-500 shrink-0">?</span>{q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Transcript Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold">Upload Transcript</h2>
            <p className="mb-4 text-sm text-slate-400">
              Paste your meeting transcript below. Use <code className="rounded bg-slate-800 px-1 text-ledger-pink">Speaker: message</code> format
              for speaker labels.
            </p>

            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Alice: We need to ship version 2 by Friday.
Bob: I will prepare the migration plan by Thursday.
Charlie: If QA finds major bugs, we might miss Friday.
Alice: Let's do a code freeze on Wednesday."
              rows={12}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20 font-mono"
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setTranscriptText("");
                }}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadTranscript}
                disabled={uploading}
                className="flex-1 rounded-lg bg-ledger-pink px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading & Extracting…" : "Upload & Extract"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}