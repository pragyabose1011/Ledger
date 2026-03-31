import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import Layout from "../components/Layout";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  stripe_subscription_id: string | null;
};

type Colleague = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string | null;
  avatar_url: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

type Conversation = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_at: string;
};

type BillingStatus = {
  plan: "free" | "pro";
  status: string;
  current_period_end?: number;
};

type TabId = "account" | "billing" | "integrations" | "colleagues" | "chat";

const TABS: { id: TabId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "billing", label: "Billing" },
  { id: "integrations", label: "Integrations" },
  { id: "colleagues", label: "Colleagues" },
  { id: "chat", label: "Messages" },
];

const API_BASE = import.meta.env.VITE_API_URL || "";
const WS_BASE = API_BASE
  ? API_BASE.replace(/^http/, "ws")
  : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

function Avatar({
  url,
  name,
  size = "md",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-3xl" };
  return (
    <div
      className={`${sizes[size]} rounded-full bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700 shrink-0`}
    >
      {url ? (
        <img src={`${API_BASE}${url}`} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-ledger-pink">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, toggle: toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>(
    (searchParams.get("tab") as TabId) || "account"
  );

  const [profile, setProfile] = useState<Profile | null>(null);

  // Account tab
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwChanging, setPwChanging] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Billing tab
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingMsg, setBillingMsg] = useState("");

  // Integrations tab
  const [zoomOk, setZoomOk] = useState(false);
  const [teamsOk, setTeamsOk] = useState(false);
  const [meetOk, setMeetOk] = useState(false);

  // Colleagues tab
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [colleagueEmail, setColleagueEmail] = useState("");
  const [addingColleague, setAddingColleague] = useState(false);
  const [colleagueMsg, setColleagueMsg] = useState("");

  // Chat tab
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const activeTabRef = useRef<TabId>("account");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    api.get("/profile/me")
      .then((res) => {
        setProfile(res.data);
        profileRef.current = res.data;
        setName(res.data.name);
        setRole(res.data.role || "");
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  // Handle billing success redirect
  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      setBillingMsg("Payment successful! Your plan has been upgraded to Pro.");
      setActiveTab("billing");
      api.get("/billing/status").then((r) => setBilling(r.data)).catch(() => {});
      setSearchParams({ tab: "billing" }, { replace: true });
    }
  }, []);

  // Sync tab to URL and keep ref current
  useEffect(() => {
    activeTabRef.current = activeTab;
    setSearchParams({ tab: activeTab }, { replace: true });
    if (activeTab === "billing") {
      api.get("/billing/status").then((r) => setBilling(r.data)).catch(() => {});
    } else if (activeTab === "integrations") {
      api.get("/integrations/zoom/status").then((r) => setZoomOk(r.data.configured)).catch(() => {});
      api.get("/integrations/teams/status").then((r) => setTeamsOk(r.data.configured)).catch(() => {});
      api.get("/integrations/meet/status").then((r) => setMeetOk(r.data.configured)).catch(() => {});
    } else if (activeTab === "colleagues") {
      loadColleagues();
    } else if (activeTab === "chat") {
      loadConversations();
      connectWS();
    }
  }, [activeTab]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup WS on unmount
  useEffect(() => () => { wsRef.current?.close(); }, []);

  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${token}`);
    ws.onmessage = (e) => {
      const msg: Message = JSON.parse(e.data);
      setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
      const myId = profileRef.current?.id;
      setConversations((prev) =>
        prev.map((c) => {
          const otherId = msg.sender_id === myId ? msg.recipient_id : msg.sender_id;
          return c.user_id === otherId
            ? { ...c, last_message: msg.content, last_at: msg.created_at }
            : c;
        })
      );
    };
    ws.onclose = () => {
      setTimeout(() => { if (activeTabRef.current === "chat") connectWS(); }, 3000);
    };
    wsRef.current = ws;
  }, []);

  const loadColleagues = async () => {
    try { setColleagues((await api.get("/colleagues/")).data); } catch {}
  };

  const loadConversations = async () => {
    try { setConversations((await api.get("/messages/conversations")).data); } catch {}
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileMsg("");
    try {
      if (avatarFile) {
        const form = new FormData();
        form.append("file", avatarFile);
        const r = await api.post("/profile/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProfile((p) => p ? { ...p, avatar_url: r.data.avatar_url } : p);
        setAvatarPreview(null);
        setAvatarFile(null);
      }
      await api.put("/profile/me", { name, role: role || null });
      setProfile((p) => p ? { ...p, name, role: role || null } : p);
      setProfileMsg("Profile saved!");
    } catch (err: any) {
      setProfileMsg(err.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg("");
    if (newPassword !== confirmPassword) { setPwMsg("New passwords do not match"); return; }
    setPwChanging(true);
    try {
      await api.post("/profile/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwMsg("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwMsg(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPwChanging(false);
    }
  };

  const handleAddColleague = async () => {
    if (!colleagueEmail.trim()) return;
    setAddingColleague(true);
    setColleagueMsg("");
    try {
      const r = await api.post("/colleagues/", { email: colleagueEmail.trim() });
      setColleagues((p) => [...p, r.data]);
      setColleagueEmail("");
      setColleagueMsg("Colleague added!");
    } catch (err: any) {
      setColleagueMsg(err.response?.data?.detail || "Failed to add colleague");
    } finally {
      setAddingColleague(false);
    }
  };

  const handleRemoveColleague = async (id: string) => {
    try {
      await api.delete(`/colleagues/${id}`);
      setColleagues((p) => p.filter((c) => c.id !== id));
    } catch {}
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    try { setMessages((await api.get(`/messages/${conv.user_id}`)).data); } catch {}
  };

  const startChatWith = (c: Colleague) => {
    setActiveTab("chat");
    setTimeout(() => {
      const conv: Conversation = {
        user_id: c.user_id, name: c.name, avatar_url: c.avatar_url,
        last_message: "", last_at: "",
      };
      setActiveConv(conv);
      api.get(`/messages/${c.user_id}`).then((r) => setMessages(r.data)).catch(() => {});
      connectWS();
    }, 150);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !activeConv) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWS(); return;
    }
    wsRef.current.send(JSON.stringify({ to: activeConv.user_id, content: chatInput.trim() }));
    setChatInput("");
  };

  const handleUpgrade = async () => {
    try {
      const r = await api.post("/billing/create-checkout-session");
      window.location.href = r.data.url;
    } catch (err: any) {
      setBillingMsg(err.response?.data?.detail || "Failed to start checkout");
    }
  };

  const handleBillingPortal = async () => {
    try {
      const r = await api.post("/billing/portal");
      window.location.href = r.data.url;
    } catch (err: any) {
      setBillingMsg(err.response?.data?.detail || "Failed to open billing portal");
    }
  };

  const avatarSrc = avatarPreview || (profile?.avatar_url ? `${API_BASE}${profile.avatar_url}` : null);

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ledger-pink border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-8 py-8">
        {/* Profile hero */}
        <div className="mb-8 flex items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-ledger-pink/40">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-ledger-pink">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {activeTab === "account" && (
              <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-ledger-pink flex items-center justify-center cursor-pointer hover:bg-pink-400 transition-colors shadow-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                  }}
                />
                <svg className="h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-slate-400 text-sm">{profile.email}</p>
            {profile.role && <p className="text-slate-500 text-xs mt-0.5">{profile.role}</p>}
            <p className="text-slate-600 text-xs mt-1">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`rounded-full px-3 py-1 text-xs font-medium border ${
              billing?.plan === "pro"
                ? "bg-ledger-pink/10 text-ledger-pink border-ledger-pink/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}>
              {billing?.plan === "pro" ? "Pro" : "Free"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800/80 mb-8">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-ledger-pink text-ledger-pink"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Account ── */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="font-semibold mb-4">Personal Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 focus:border-ledger-pink focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Role / Title</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Product Manager"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-ledger-pink focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Email</label>
                  <input value={profile.email} disabled
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/20 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>
              {profileMsg && (
                <p className={`mt-3 text-sm ${profileMsg.includes("!") ? "text-emerald-400" : "text-red-400"}`}>
                  {profileMsg}
                </p>
              )}
              <button onClick={handleSaveProfile} disabled={saving}
                className="mt-4 rounded-lg bg-ledger-pink px-6 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>

            {/* Appearance */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="font-semibold mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-xl">
                    {theme === "dark" ? "🌙" : "☀️"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {theme === "dark" ? "Easy on the eyes at night" : "Clean and bright interface"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative h-7 w-13 rounded-full transition-colors duration-300 focus:outline-none ${
                    theme === "light" ? "bg-ledger-pink" : "bg-slate-700"
                  }`}
                  style={{ width: "52px" }}
                  role="switch"
                  aria-checked={theme === "light"}
                >
                  <span
                    className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300"
                    style={{ transform: theme === "light" ? "translateX(24px)" : "translateX(0)" }}
                  />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="font-semibold mb-1">Change Password</h2>
              <p className="text-sm text-slate-500 mb-5">Leave blank to keep your current password.</p>

              {/* Current password */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-1.5 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:border-ledger-pink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrent ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="mb-3">
                <label className="text-sm text-slate-400 mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create new password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:border-ledger-pink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    {showNew ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {/* Strength indicators */}
                {newPassword && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { label: "8+ chars", ok: newPassword.length >= 8 },
                      { label: "Uppercase", ok: /[A-Z]/.test(newPassword) },
                      { label: "Lowercase", ok: /[a-z]/.test(newPassword) },
                      { label: "Number", ok: /\d/.test(newPassword) },
                      { label: "Symbol", ok: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
                    ].map(({ label, ok }) => (
                      <span key={label} className={`text-xs px-2 py-0.5 rounded-full border ${
                        ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                           : "bg-slate-800 border-slate-700 text-slate-500"
                      }`}>
                        {ok ? "✓" : "·"} {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="mb-5">
                <label className="text-sm text-slate-400 mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className={`w-full rounded-lg border bg-slate-800/50 px-4 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-500/60 focus:border-red-500"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-emerald-500/60 focus:border-emerald-500"
                        : "border-slate-700 focus:border-ledger-pink"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirm ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
                )}
              </div>

              {pwMsg && (
                <div className={`mb-4 rounded-lg border p-3 text-sm ${
                  pwMsg.includes("successfully")
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>{pwMsg}</div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={pwChanging || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="rounded-lg bg-ledger-pink px-6 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pwChanging ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        )}

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {billingMsg && (
              <div className={`rounded-lg p-3 text-sm border ${
                billingMsg.includes("successful")
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>{billingMsg}</div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="font-semibold mb-4">Current Plan</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{billing?.plan === "pro" ? "Pro" : "Free"}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {billing?.plan === "pro"
                      ? `Active${billing.current_period_end
                          ? ` · renews ${new Date(billing.current_period_end * 1000).toLocaleDateString()}`
                          : ""}`
                      : "Up to 10 meetings/month"}
                  </p>
                </div>
                {billing?.plan === "pro" ? (
                  <button onClick={handleBillingPortal}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors">
                    Manage Billing
                  </button>
                ) : (
                  <button onClick={handleUpgrade}
                    className="rounded-lg bg-ledger-pink px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors shadow-[0_0_20px_rgba(244,114,182,0.5)]">
                    Upgrade to Pro — ₹1,499/mo
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  name: "Free", price: "₹0", active: billing?.plan !== "pro",
                  features: ["10 meetings/month", "AI extraction", "Basic analytics", "PDF export"],
                  color: "emerald",
                },
                {
                  name: "Pro", price: "₹1,499", active: billing?.plan === "pro",
                  features: ["Unlimited meetings", "AI extraction + RAG", "Advanced analytics", "Calendar integrations", "Team collaboration", "Priority support"],
                  color: "pink",
                },
              ].map((plan) => (
                <div key={plan.name} className={`rounded-2xl border p-6 ${
                  plan.active ? "border-ledger-pink/40 bg-ledger-pink/5" : "border-slate-800 bg-slate-900/30"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.active && <span className="text-xs text-ledger-pink font-medium">Current</span>}
                  </div>
                  <p className="text-2xl font-bold mb-4">
                    {plan.price}<span className="text-sm font-normal text-slate-400">/mo</span>
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className={plan.color === "pink" ? "text-ledger-pink" : "text-emerald-400"}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Integrations ── */}
        {activeTab === "integrations" && (
          <div className="space-y-4">
            {[
              { name: "Zoom", icon: "🎥", ok: zoomOk },
              { name: "Microsoft Teams", icon: "💬", ok: teamsOk },
              { name: "Google Meet", icon: "📹", ok: meetOk },
            ].map((int) => (
              <div key={int.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">{int.icon}</div>
                  <div>
                    <p className="font-medium">{int.name}</p>
                    <p className="text-sm text-slate-400">{int.ok ? "Connected" : "Not connected"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${int.ok ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <button
                    onClick={() => navigate("/integrations")}
                    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
                  >
                    {int.ok ? "Manage" : "Connect"}
                  </button>
                </div>
              </div>
            ))}
            <p className="text-sm text-slate-500 text-center pt-2">
              Full configuration available on the{" "}
              <button onClick={() => navigate("/integrations")} className="text-ledger-pink hover:underline">
                Integrations page
              </button>
            </p>
          </div>
        )}

        {/* ── Colleagues ── */}
        {activeTab === "colleagues" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="font-semibold mb-4">Add Colleague</h2>
              <div className="flex gap-3">
                <input
                  value={colleagueEmail}
                  onChange={(e) => setColleagueEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddColleague()}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-ledger-pink focus:outline-none"
                />
                <button onClick={handleAddColleague} disabled={addingColleague}
                  className="rounded-lg bg-ledger-pink px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50">
                  {addingColleague ? "Adding…" : "Add"}
                </button>
              </div>
              {colleagueMsg && (
                <p className={`mt-2 text-sm ${colleagueMsg.includes("!") ? "text-emerald-400" : "text-red-400"}`}>
                  {colleagueMsg}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {colleagues.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/20 p-10 text-center">
                  <p className="text-slate-500 text-sm">No colleagues yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Add them by email above.</p>
                </div>
              ) : colleagues.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex items-center gap-4">
                  <Avatar url={c.avatar_url} name={c.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-slate-500 text-xs truncate">{c.email}</p>
                    {c.role && <p className="text-slate-600 text-xs">{c.role}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startChatWith(c)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors">
                      Message
                    </button>
                    <button onClick={() => handleRemoveColleague(c.id)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-red-500/50 hover:text-red-400 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Chat ── */}
        {activeTab === "chat" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden flex" style={{ height: "62vh" }}>
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-800 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-800">
                <p className="text-sm font-medium text-slate-300">Messages</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-slate-600">No conversations yet.</p>
                  </div>
                ) : conversations.map((conv) => (
                  <button key={conv.user_id} onClick={() => openConversation(conv)}
                    className={`w-full text-left p-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${
                      activeConv?.user_id === conv.user_id ? "bg-slate-800/60" : ""
                    }`}>
                    <div className="flex items-center gap-2">
                      <Avatar url={conv.avatar_url} name={conv.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{conv.name}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-slate-800">
                <button onClick={() => setActiveTab("colleagues")}
                  className="w-full text-xs text-slate-500 hover:text-ledger-pink transition-colors">
                  + Start new conversation
                </button>
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 flex flex-col min-w-0">
              {activeConv ? (
                <>
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    <Avatar url={activeConv.avatar_url} name={activeConv.name} size="sm" />
                    <p className="font-medium text-sm">{activeConv.name}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {messages
                      .filter((m) =>
                        (m.sender_id === profile.id && m.recipient_id === activeConv.user_id) ||
                        (m.sender_id === activeConv.user_id && m.recipient_id === profile.id)
                      )
                      .map((m) => (
                        <div key={m.id} className={`flex ${m.sender_id === profile.id ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                            m.sender_id === profile.id
                              ? "bg-ledger-pink text-slate-950"
                              : "bg-slate-800 text-slate-100"
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t border-slate-800 flex gap-3">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder={`Message ${activeConv.name}…`}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-ledger-pink focus:outline-none"
                    />
                    <button onClick={sendMessage}
                      className="rounded-xl bg-ledger-pink px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors">
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-slate-500 text-sm">Select a conversation</p>
                    <p className="text-slate-600 text-xs mt-1">or message a colleague from the Colleagues tab</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
