import { Routes, Route } from "react-router-dom";
import Meetings from "./pages/Meetings";
import MeetingDetailPage from "./pages/MeetingDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Meetings />} />
      <Route path="/meetings/:id" element={<MeetingDetailPage />} />
    </Routes>
  );
}





