// /Users/pragyabose/Ledger/frontend/src/pages/Meetings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Meeting = {
  id: string;
  title: string;
  platform?: string;
  created_at: string;
};

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const navigate = useNavigate();

  const loadMeetings = () => {
    api
      .get("/meetings/")
      .then((res) => setMeetings(res.data))
      .catch((err) => {
        console.error("Failed to load meetings", err);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadMeetings();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMeetings([]);
    navigate("/login");
  };

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
              onClick={() => navigate("/")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-4 py-1.5 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Upcoming Meetings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Ledger prepares your meetings automatically.
            </p>
          </div>
        </div>

        {meetings.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-12 text-center backdrop-blur">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-slate-400">No meetings found.</p>
            <p className="mt-2 text-sm text-slate-500">
              Create your first meeting to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetings.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(`/meetings/${m.id}`)}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 text-left backdrop-blur transition-all hover:border-ledger-pink/50 hover:shadow-[0_0_30px_rgba(244,114,182,0.15)]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ledger-pink/10 text-ledger-pink shadow-[0_0_20px_rgba(244,114,182,0.3)]">
                    <span className="text-xl">📊</span>
                  </div>
                  <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                    {m.platform || "Platform"}
                  </div>
                </div>

                <h3 className="mb-2 text-lg font-medium text-slate-100 group-hover:text-ledger-pink transition-colors">
                  {m.title}
                </h3>

                <p className="text-sm text-slate-400">
                  {new Date(m.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}