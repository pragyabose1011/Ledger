import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type IntegrationStatus = {
  configured: boolean;
  auth_url: string | null;
};

type ZoomRecording = {
  meeting_id: string;
  topic: string;
  start_time: string;
  duration: number;
  file_type: string;
  file_size: number;
  download_url: string;
};

export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [zoomStatus, setZoomStatus] = useState<IntegrationStatus | null>(null);
  const [teamsStatus, setTeamsStatus] = useState<IntegrationStatus | null>(null);
  const [meetStatus, setMeetStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Zoom recordings
  const [zoomToken, setZoomToken] = useState("");
  const [recordings, setRecordings] = useState<ZoomRecording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadStatuses();
  }, [navigate]);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const [zoom, teams, meet] = await Promise.all([
        api.get("/integrations/zoom/status"),
        api.get("/integrations/teams/status"),
        api.get("/integrations/meet/status"),
      ]);
      setZoomStatus(zoom.data);
      setTeamsStatus(teams.data);
      setMeetStatus(meet.data);
    } catch (err) {
      console.error("Failed to load integration statuses", err);
    } finally {
      setLoading(false);
    }
  };

  const loadZoomRecordings = async () => {
    if (!zoomToken) {
      alert("Please enter your Zoom access token");
      return;
    }

    try {
      setLoadingRecordings(true);
      const res = await api.get(`/integrations/zoom/recordings?access_token=${zoomToken}`);
      setRecordings(res.data.recordings);
    } catch (err) {
      console.error("Failed to load recordings", err);
      alert("Failed to load recordings. Check your access token.");
    } finally {
      setLoadingRecordings(false);
    }
  };

  const importRecording = async (recording: ZoomRecording) => {
    try {
      setImporting(recording.meeting_id);
      const res = await api.post("/integrations/zoom/import", {
        access_token: zoomToken,
        meeting_uuid: recording.meeting_id,
        topic: recording.topic,
        download_url: recording.download_url,
        file_type: recording.file_type,
      });

      alert(`Imported: ${recording.topic}`);
      
      // Navigate to the new meeting
      navigate(`/meetings/${res.data.meeting_id}`);
    } catch (err) {
      console.error("Failed to import recording", err);
      alert("Failed to import recording");
    } finally {
      setImporting(null);
    }
  };

  const integrations = [
    {
      name: "Zoom",
      icon: "📹",
      status: zoomStatus,
      color: "blue",
      description: "Import recordings from Zoom meetings.",
    },
    {
      name: "Microsoft Teams",
      icon: "💼",
      status: teamsStatus,
      color: "purple",
      description: "Import recordings from Microsoft Teams meetings.",
    },
    {
      name: "Google Meet",
      icon: "🎥",
      status: meetStatus,
      color: "green",
      description: "Import recordings from Google Meet.",
    },
  ];

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
              onClick={() => navigate("/meetings")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Meetings
            </button>
            <button
              onClick={() => navigate("/calendar")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Calendar
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Integrations</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect your meeting platforms to import recordings automatically.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Integration Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-10">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                      {integration.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{integration.name}</h3>
                      <span
                        className={`text-xs ${
                          integration.status?.configured
                            ? "text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        {integration.status?.configured ? "✓ Configured" : "Not configured"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mb-4">{integration.description}</p>

                  {integration.status?.configured ? (
                    <button
                      onClick={() => window.open(integration.status?.auth_url || "", "_blank")}
                      className="w-full rounded-lg bg-ledger-pink px-4 py-2 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors"
                    >
                      Connect {integration.name}
                    </button>
                  ) : (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Add {integration.name} credentials to .env to enable
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Zoom Recordings Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-xl font-semibold mb-4">Import Zoom Recordings</h2>
              
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Paste your Zoom access token..."
                  value={zoomToken}
                  onChange={(e) => setZoomToken(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-ledger-pink focus:outline-none"
                />
                <button
                  onClick={loadZoomRecordings}
                  disabled={loadingRecordings}
                  className="rounded-lg bg-ledger-pink px-6 py-2 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50"
                >
                  {loadingRecordings ? "Loading..." : "Load Recordings"}
                </button>
              </div>

              {recordings.length > 0 ? (
                <div className="space-y-3">
                  {recordings.map((recording) => (
                    <div
                      key={`${recording.meeting_id}-${recording.file_type}`}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-200 truncate">
                          {recording.topic}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span>
                            {new Date(recording.start_time).toLocaleDateString()}
                          </span>
                          <span>{recording.duration} min</span>
                          <span className="uppercase">{recording.file_type}</span>
                          <span>
                            {(recording.file_size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => importRecording(recording)}
                        disabled={importing === recording.meeting_id}
                        className="rounded-lg border border-ledger-pink px-4 py-2 text-sm font-medium text-ledger-pink hover:bg-ledger-pink hover:text-slate-950 transition-colors disabled:opacity-50"
                      >
                        {importing === recording.meeting_id ? "Importing..." : "Import"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No recordings loaded yet.</p>
                  <p className="text-sm mt-1">
                    Enter your Zoom access token and click "Load Recordings"
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}