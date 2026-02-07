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
      navigate("/meetings"); // go to meetings after login
    } catch (err) {
      console.error("Login failed", err);
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 400 }}>
      <h1 style={{ marginBottom: 16 }}>Sign in</h1>
      <p style={{ marginBottom: 16, color: "#555" }}>
        Use any email / name. If it doesn't exist yet, we'll create it.
      </p>
      <p style={{ marginBottom: 16, color: "#555" }}>
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <button
            type="button"
            onClick={async () => {
                try {
                setLoading(true);
                // Demo: hard-coded OAuth identity; in real life you'd get this from the provider
                await oauthLogin("demo-oauth@example.com", "Demo OAuth User", "demo");
                navigate("/meetings");
                } catch (err) {
                console.error("OAuth login failed", err);
                alert("OAuth login failed");
                } finally {
                setLoading(false);
                }
            }}
            style={{
                marginTop: 16,
                padding: "8px 16px",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
            }}
        >
        Continue with Demo OAuth
        </button>
    </div>
  );
}