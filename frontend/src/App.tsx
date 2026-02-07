import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Meetings from "./pages/Meetings";
import MeetingDetailPage from "./pages/MeetingDetail";
import Login from "./pages/login";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/meetings" element={<Meetings />} />
      <Route path="/meetings/:id" element={<MeetingDetailPage />} />
    </Routes>
  );
}



