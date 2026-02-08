import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/login";
import SignupPage from "./pages/Signup";
import Meetings from "./pages/Meetings";
import MeetingDetailPage from "./pages/MeetingDetail";
import Dashboard from "./pages/Dashboard";
import OAuthCallback from "./pages/OAuthCallback";
import ChatPage from "./pages/Chat";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/meetings" element={<Meetings />} />
      <Route path="/meetings/:id" element={<MeetingDetailPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;