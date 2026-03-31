import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setWidth(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none">
      <div
        style={{
          width: `${width}%`,
          background: "linear-gradient(to right, #e485b6, #f9a8d4, #e485b6)",
          backgroundSize: "200% 100%",
          animation: width > 0 ? "shimmer 2s linear infinite" : "none",
          transition: "width 60ms linear",
          boxShadow: "0 0 10px rgba(228,133,182,0.8), 0 0 20px rgba(228,133,182,0.4)",
        }}
        className="h-full"
      />
    </div>
  );
}
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
import ProfilePage from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DemoPage from "./pages/Demo";
import RoomPage from "./pages/Room";

// Redirect logged-in users away from login/signup
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/meetings" replace />;
  }
  return <>{children}</>;
}

// Redirect non-logged-in users to login
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <>
    <ScrollProgress />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
      <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetailPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/room/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
    </Routes>
    </>
  );
}

export default App;