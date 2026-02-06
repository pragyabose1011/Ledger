import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type Meeting = {
  id: string;
  title: string;
  platform?: string;
  created_at: string;
};

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/meetings")
      .then((res) => setMeetings(res.data))
      .catch((err) => {
        console.error("Failed to load meetings", err);
      });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Meetings</h1>

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
