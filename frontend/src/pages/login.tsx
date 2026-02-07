// /Users/pragyabose/Ledger/frontend/src/pages/login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, oauthLogin } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("pragya@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      navigate("/meetings");
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_55%)]" />

      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
            <span className="text-lg font-semibold tracking-tight">Ledger</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-slate-300 hover:text-ledger-pink transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-md flex-col px-6 py-20">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 backdrop-blur">
          <h1 className="mb-2 text-2xl font-semibold">Sign in to Ledger</h1>
          <p className="mb-6 text-sm text-slate-400">
            Use any email. If it doesn't exist, we'll create an account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ledger-pink px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(244,114,182,0.7)] hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                await oauthLogin("demo-oauth@example.com", "Demo OAuth User", "demo");
                navigate("/meetings");
              } catch (err) {
                console.error("OAuth login failed", err);
                alert("OAuth login failed");
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-6 py-2.5 text-sm text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Continue with Demo OAuth
          </button>
        </div>
      </main>
    </div>
  );
}