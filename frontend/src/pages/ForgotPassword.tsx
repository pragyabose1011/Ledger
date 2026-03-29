import { useState } from "react";
import { Link } from "react-router-dom";
import { api, parseApiError } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [devToken, setDevToken] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg(""); setDevToken("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMsg(res.data.message);
      if (res.data.dev_token) setDevToken(res.data.dev_token);
    } catch (err: any) {
      setError(parseApiError(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.15),_transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-ledger-pink shadow-[0_0_40px_rgba(244,114,182,0.7)]" />
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 text-slate-400">Enter your email to receive a reset link</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
          {msg ? (
            <div className="text-center space-y-4">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-400">
                {msg}
              </div>
              {devToken && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-left text-xs">
                  <p className="text-amber-400 font-medium mb-1">Dev mode — copy this token:</p>
                  <code className="text-amber-300 break-all">{devToken}</code>
                  <Link
                    to={`/reset-password?token=${devToken}`}
                    className="block mt-3 text-ledger-pink hover:underline text-center"
                  >
                    → Go to reset page
                  </Link>
                </div>
              )}
              <Link to="/login" className="block text-sm text-ledger-pink hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>
              )}
              <div>
                <label className="mb-1 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-ledger-pink py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <p className="text-center text-sm text-slate-400">
                <Link to="/login" className="text-ledger-pink hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
