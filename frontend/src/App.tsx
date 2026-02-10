import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/login";
import SignupPage from "./pages/Signup";
import Meetings from "./pages/Meetings";
import MeetingDetailPage from "./pages/MeetingDetail";
import Dashboard from "./pages/Dashboard";
import OAuthCallback from "./pages/OAuthCallback";
import CalendarPage from "./pages/Calendar";
import ChatPage from "./pages/Chat";
import IntegrationsPage from "./pages/Integrations";


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
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
    </Routes>
  );
}

export default App;