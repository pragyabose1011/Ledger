import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

const navItems = [
  {
    path: "/meetings",
    label: "Meetings",
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    path: "/calendar",
    label: "Calendar",
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    path: "/chat",
    label: "Ask AI",
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    path: "/integrations",
    label: "Integrations",
    icon: (
      <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showNameModal, setShowNameModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const openNameModal = () => {
    setMeetingTitle("");
    setShowNameModal(true);
  };

  const createMeeting = async () => {
    setCreating(true);
    try {
      const r = await api.post("/rooms/create", { title: meetingTitle.trim() });
      setShowNameModal(false);
      navigate(`/room/${r.data.room_id}`);
    } catch {
      // silently ignore — user stays on modal
    } finally {
      setCreating(false);
    }
  };

  const isActive = (path: string) =>
    path === "/meetings"
      ? location.pathname === "/meetings" || location.pathname.startsWith("/meetings/")
      : location.pathname === path;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(228,133,182,0.07),_transparent_55%)]" />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-slate-800/70 bg-slate-950/90 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-slate-800/60 px-5">
          <button onClick={() => navigate("/meetings")} className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-ledger-pink shadow-[0_0_18px_rgba(228,133,182,0.6)]" />
            <span className="text-[15px] font-semibold tracking-tight">Ledger</span>
          </button>
        </div>

        {/* New Meeting */}
        <div className="px-3 py-3 border-b border-slate-800/60">
          <button
            onClick={openNameModal}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ledger-pink/10 border border-ledger-pink/20 px-3 py-2.5 text-sm font-medium text-ledger-pink hover:bg-ledger-pink/20 transition-colors"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Meeting
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-ledger-pink/10 text-ledger-pink"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <span className={`transition-colors ${active ? "text-ledger-pink" : "text-slate-500 group-hover:text-slate-300"}`}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ledger-pink" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-800/60 px-3 py-3">
          <div className="space-y-0.5">
            <button
              onClick={() => navigate("/profile")}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                location.pathname === "/profile"
                  ? "bg-ledger-pink/10 text-ledger-pink"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              <span className={`shrink-0 transition-colors ${location.pathname === "/profile" ? "text-ledger-pink" : "text-slate-500 group-hover:text-slate-300"}`}>
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Settings
            </button>
            <button
              onClick={logout}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <span className="shrink-0 text-slate-600 transition-colors group-hover:text-red-400">
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </span>
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="relative z-10 ml-[220px] flex min-h-screen flex-1 flex-col">
        {children}
      </div>

      {/* New Meeting Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-8 w-8 rounded-full bg-ledger-pink/20 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-ledger-pink" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">Name your meeting</h2>
              </div>
              <p className="text-sm text-slate-500 ml-11">Give this meeting a title so you can find it later.</p>
            </div>

            <input
              autoFocus
              type="text"
              value={meetingTitle}
              onChange={e => setMeetingTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !creating && createMeeting()}
              placeholder="e.g. Q3 Planning, Design Review…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-ledger-pink/50 focus:outline-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createMeeting}
                disabled={creating}
                className="flex-1 rounded-xl bg-ledger-pink px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-60"
              >
                {creating ? "Starting…" : "Start meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
