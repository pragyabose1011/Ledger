import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api, parseApiError } from "../lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rules = [
    { label: "8+ chars",   ok: password.length >= 8 },
    { label: "Uppercase",  ok: /[A-Z]/.test(password) },
    { label: "Lowercase",  ok: /[a-z]/.test(password) },
    { label: "Number",     ok: /\d/.test(password) },
    { label: "Symbol",     ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (!rules.every((r) => r.ok)) { setError("Password does not meet all requirements"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      navigate("/login?reset=1");
    } catch (err: any) {
      setError(parseApiError(err, "Failed to reset password"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-ledger-pink hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.15),_transparent_50%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-ledger-pink shadow-[0_0_40px_rgba(244,114,182,0.7)]" />
          <h1 className="text-3xl font-bold">New Password</h1>
          <p className="mt-2 text-slate-400">Choose a strong password</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">New Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300">
                  {show
                    ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {password && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {rules.map(({ label, ok }) => (
                    <span key={label} className={`text-xs px-2 py-0.5 rounded-full border ${ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                      {ok ? "✓" : "·"} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Confirm Password</label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className={`w-full rounded-lg border bg-slate-800/50 px-4 py-2.5 text-slate-100 focus:outline-none ${confirm && confirm !== password ? "border-red-500/60" : confirm && confirm === password ? "border-emerald-500/60" : "border-slate-700 focus:border-ledger-pink"}`}
                placeholder="••••••••"
              />
              {confirm && confirm !== password && <p className="mt-1 text-xs text-red-400">Passwords don't match</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !rules.every((r) => r.ok) || password !== confirm}
              className="w-full rounded-lg bg-ledger-pink py-2.5 text-sm font-medium text-slate-950 hover:bg-pink-400 transition-colors disabled:opacity-40"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
