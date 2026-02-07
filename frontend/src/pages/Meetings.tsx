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
  const navigate = useNavigate();

  const loadMeetings = () => {
    api
      .get("/meetings/")
      .then((res) => setMeetings(res.data))
      .catch((err) => {
        console.error("Failed to load meetings", err);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadMeetings();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMeetings([]);
    navigate("/login");
  };

  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Meetings</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>

      {meetings.length === 0 ? (
        <p>No meetings found.</p>
      ) : (
        <table border={1} cellPadding={10}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Platform</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr
                key={m.id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/meetings/${m.id}`)}
              >
                <td>{m.title}</td>
                <td>{m.platform || "-"}</td>
                <td>{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}