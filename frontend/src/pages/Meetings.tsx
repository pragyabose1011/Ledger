import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import Layout from "../components/Layout";
import { useToast } from "../context/ToastContext";
import { MeetingsPageSkeleton } from "../components/Skeleton";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const platformColors: Record<string, string> = {
  Zoom: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Google Meet": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Microsoft Teams": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

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
  const { toast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
      setInitialLoading(false);
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

  const handleCreate = async () => {
    if (!title.trim()) {
      toast("Please enter a meeting title", "warning");
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
      toast("Failed to create meeting", "error");
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPlatformFilter("");
  };

  const hasFilters = searchQuery || platformFilter;

  if (initialLoading) {
    return (
      <Layout>
        <MeetingsPageSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-8 py-8 max-w-7xl">
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
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ledger-pink/10">
                    <svg className="h-5 w-5 text-ledger-pink" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${platformColors[m.platform || ""] || "bg-slate-800/60 text-slate-400 border-slate-700"}`}>
                    {m.platform || "Other"}
                  </div>
                </div>

                <h3 className="mb-2 text-base font-medium text-slate-100 group-hover:text-ledger-pink transition-colors line-clamp-2">
                  {m.title}
                </h3>

                <p className="text-xs text-slate-500">{timeAgo(m.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

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
    </Layout>
  );
}