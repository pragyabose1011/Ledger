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
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Zoom");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const loadMeetings = async (query?: string, platformF?: string) => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (platformF) params.append("platform", platformF);

      const res = await api.get(`/meetings/?${params.toString()}`);
      setMeetings(res.data);
      setFilteredMeetings(res.data);
    } catch (err) {
      console.error("Failed to load meetings", err);
    } finally {
      setSearching(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res = await api.get("/meetings/search/suggestions");
      setPlatforms(res.data.platforms || []);
    } catch (err) {
      console.error("Failed to load suggestions", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadMeetings();
    loadSuggestions();
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMeetings(searchQuery, platformFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, platformFilter]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMeetings([]);
    navigate("/login");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Please enter a meeting title");
      return;
    }

    try {
      setCreating(true);
      const res = await api.post("/meetings/", { title, platform });
      setShowModal(false);
      setTitle("");
      setPlatform("Zoom");
      navigate(`/meetings/${res.data.meeting_id}`);
    } catch (err) {
      console.error("Failed to create meeting", err);
      alert("Failed to create meeting");
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPlatformFilter("");
  };

  const hasFilters = searchQuery || platformFilter;

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
  onClick={() => navigate("/integrations")}
  className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
>
  Integrations
</button>
            <button
              onClick={() => navigate("/chat")}
              className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
            >
              Ask AI
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
            <h1 className="text-3xl font-semibold">Meetings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Search and manage your meeting insights.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-full bg-ledger-pink px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors"
          >
            + New Meeting
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, decisions, action items..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 pl-12 pr-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20 backdrop-blur"
            />
            {searching && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20 backdrop-blur"
            >
              <option value="">All Platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {hasFilters && (
          <p className="mb-4 text-sm text-slate-400">
            Found {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? "s" : ""}
            {searchQuery && <span> matching "{searchQuery}"</span>}
            {platformFilter && <span> on {platformFilter}</span>}
          </p>
        )}

        {meetings.length === 0 && !hasFilters ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-12 text-center backdrop-blur">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-slate-400">No meetings found.</p>
            <p className="mt-2 text-sm text-slate-500">
              Click "+ New Meeting" to get started.
            </p>
          </div>
        ) : meetings.length === 0 && hasFilters ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-12 text-center backdrop-blur">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-slate-400">No meetings match your search.</p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different search term or{" "}
              <button onClick={clearFilters} className="text-ledger-pink hover:underline">
                clear filters
              </button>
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

      {/* Create Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold">Create New Meeting</h2>

            <div className="mb-4">
              <label className="mb-1 block text-sm text-slate-300">Meeting Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Product Update Sync"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
              />
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm text-slate-300">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
              >
                <option value="Zoom">Zoom</option>
                <option value="Google Meet">Google Meet</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-ledger-pink px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}