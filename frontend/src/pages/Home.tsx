import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const hasToken = !!localStorage.getItem("token");

  useEffect(() => {
    // Optional: auto-send logged-in users straight to dashboard
    if (hasToken) {
      navigate("/meetings");
    }
  }, [hasToken, navigate]);

  return (
    <div style={{ padding: 40, maxWidth: 600 }}>
      <h1>Ledger</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>
        AI-native meeting intelligence. Turn transcripts into decisions, actions, and insights.
      </p>

      {!hasToken ? (
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
        >
          Get started – Sign up / Sign in
        </button>
      ) : (
        <button
          onClick={() => navigate("/meetings")}
          style={{ padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
        >
          Go to dashboard
        </button>
      )}
    </div>
  );
}