import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signup(name, email, password);
      navigate("/meetings");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
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
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-slate-400">Start managing your meeting insights</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
                placeholder="Pragya Bose"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-ledger-pink py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-ledger-pink hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}