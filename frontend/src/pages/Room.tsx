import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const API_BASE = import.meta.env.VITE_API_URL || "";
const WS_BASE = API_BASE
  ? API_BASE.replace(/^http/, "ws")
  : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "🎉", "💯", "🙌"];

type Peer = {
  id: string;
  name: string;
  avatar_url: string | null;
  stream?: MediaStream;
  muted?: boolean;
  videoOff?: boolean;
};

type ChatMsg = {
  id: string;
  from: string;
  name: string;
  content: string;
};

type FloatingReaction = {
  id: string;
  emoji: string;
  name: string;
  x: number;
};

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [myId, setMyId] = useState<string | null>(null);
  const [myName, setMyName] = useState("");
  const [roomTitle, setRoomTitle] = useState("Meeting");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [sharing, setSharing] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load user + room info
  useEffect(() => {
    api.get("/profile/me")
      .then(r => { setMyId(r.data.id); setMyName(r.data.name); })
      .catch(() => navigate("/login"));
    if (roomId) {
      api.get(`/rooms/${roomId}`).then(r => setRoomTitle(r.data.title)).catch(() => {});
    }
  }, [roomId, navigate]);

  // Get local media
  useEffect(() => {
    let acquired: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(s => { acquired = s; setLocalStream(s); localStreamRef.current = s; })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          .then(s => { acquired = s; setLocalStream(s); localStreamRef.current = s; })
          .catch(() => {});
      });
    return () => { acquired?.getTracks().forEach(t => t.stop()); };
  }, []);

  // When stream becomes available, add tracks to existing peer connections
  useEffect(() => {
    if (!localStream) return;
    pcs.current.forEach(pc => {
      const existingKinds = pc.getSenders().map(s => s.track?.kind).filter(Boolean);
      localStream.getTracks().forEach(track => {
        if (!existingKinds.includes(track.kind)) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  const createPC = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }

    pc.ontrack = ({ streams }) => {
      const stream = streams[0];
      setPeers(prev => {
        const next = new Map(prev);
        const p = next.get(peerId);
        if (p) next.set(peerId, { ...p, stream });
        return next;
      });
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        wsRef.current?.send(JSON.stringify({ type: "ice", to: peerId, candidate: candidate.toJSON() }));
      }
    };

    pcs.current.set(peerId, pc);
    return pc;
  }, []);

  // WebSocket signaling
  useEffect(() => {
    if (!roomId || !myId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/room/${roomId}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "peer_joined") {
        setPeers(prev => {
          const next = new Map(prev);
          if (!next.has(msg.user.id)) next.set(msg.user.id, { id: msg.user.id, name: msg.user.name, avatar_url: msg.user.avatar_url });
          return next;
        });
        if (msg.should_offer) {
          const pc = createPC(msg.user.id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: "offer", to: msg.user.id, sdp: offer.sdp }));
        }
      } else if (msg.type === "offer") {
        const pc = createPC(msg.from);
        await pc.setRemoteDescription({ type: "offer", sdp: msg.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", to: msg.from, sdp: answer.sdp }));
      } else if (msg.type === "answer") {
        const pc = pcs.current.get(msg.from);
        if (pc) await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
      } else if (msg.type === "ice") {
        const pc = pcs.current.get(msg.from);
        if (pc) try { await pc.addIceCandidate(msg.candidate); } catch {}
      } else if (msg.type === "peer_left") {
        pcs.current.get(msg.user_id)?.close();
        pcs.current.delete(msg.user_id);
        setPeers(prev => { const next = new Map(prev); next.delete(msg.user_id); return next; });
      } else if (msg.type === "chat") {
        setChatMessages(prev => [...prev, { id: Math.random().toString(36), from: msg.from, name: msg.name, content: msg.content }]);
        setUnread(n => n + 1);
      } else if (msg.type === "reaction") {
        spawnReaction(msg.emoji, msg.name);
      } else if (msg.type === "media_state") {
        setPeers(prev => {
          const next = new Map(prev);
          const p = next.get(msg.from);
          if (p) next.set(msg.from, { ...p, muted: !msg.audio, videoOff: !msg.video });
          return next;
        });
      }
    };

    return () => {
      ws.close();
      pcs.current.forEach(pc => pc.close());
      pcs.current.clear();
    };
  }, [roomId, myId, createPC]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { if (showChat) setUnread(0); }, [showChat]);

  const spawnReaction = (emoji: string, name: string) => {
    const id = Math.random().toString(36);
    const x = Math.random() * 60 + 20;
    setFloatingReactions(prev => [...prev, { id, emoji, name, x }]);
    setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
  };

  const toggleAudio = () => {
    const track = localStream?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioOn(track.enabled);
    wsRef.current?.send(JSON.stringify({ type: "media_state", audio: track.enabled, video: videoOn }));
  };

  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoOn(track.enabled);
    wsRef.current?.send(JSON.stringify({ type: "media_state", audio: audioOn, video: track.enabled }));
  };

  const toggleScreen = async () => {
    if (sharing) {
      screenStream?.getTracks().forEach(t => t.stop());
      setScreenStream(null);
      setSharing(false);
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        pcs.current.forEach(pc => {
          pc.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(videoTrack);
        });
      }
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screen.getVideoTracks()[0];
        setScreenStream(screen);
        setSharing(true);
        pcs.current.forEach(pc => {
          pc.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => {
          setSharing(false);
          setScreenStream(null);
          const videoTrack = localStream?.getVideoTracks()[0];
          if (videoTrack) {
            pcs.current.forEach(pc => {
              pc.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(videoTrack);
            });
          }
        };
      } catch {}
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    wsRef.current?.send(JSON.stringify({ type: "chat", content: chatInput.trim() }));
    setChatMessages(prev => [...prev, { id: Math.random().toString(36), from: myId!, name: "You", content: chatInput.trim() }]);
    setChatInput("");
  };

  const sendReaction = (emoji: string) => {
    wsRef.current?.send(JSON.stringify({ type: "reaction", emoji }));
    spawnReaction(emoji, "You");
    setShowReactions(false);
  };

  const endCall = () => {
    localStream?.getTracks().forEach(t => t.stop());
    screenStream?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    navigate("/meetings");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allTiles = [
    { id: myId || "me", name: myName || "You", avatar_url: null, isLocal: true, stream: sharing ? screenStream : localStream, muted: !audioOn, videoOff: !videoOn },
    ...Array.from(peers.values()).map(p => ({ ...p, isLocal: false })),
  ];
  const count = allTiles.length;
  const gridCols = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count <= 4 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col select-none">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-ledger-pink shadow-[0_0_12px_rgba(244,114,182,0.6)]" />
          <span className="text-sm font-medium text-slate-200">{roomTitle}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : roomId}
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {count} participant{count !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Video + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="relative flex-1 p-3 overflow-hidden">
          <div className={`grid gap-3 h-full ${gridCols}`}>
            {allTiles.map(tile => (
              <VideoTile key={tile.id} {...tile} myId={myId} />
            ))}
          </div>

          {/* Floating emoji reactions */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {floatingReactions.map(r => (
              <div
                key={r.id}
                className="absolute bottom-24 flex flex-col items-center gap-1 animate-float-up"
                style={{ left: `${r.x}%` }}
              >
                <span className="text-4xl drop-shadow-lg">{r.emoji}</span>
                <span className="text-[11px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full font-medium">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-72 shrink-0 flex flex-col border-l border-slate-800/60 bg-slate-900/50">
            <div className="px-4 py-3 border-b border-slate-800/60 text-sm font-medium text-slate-300">
              Meeting chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chatMessages.length === 0 && (
                <p className="text-xs text-slate-600 text-center mt-4">No messages yet</p>
              )}
              {chatMessages.map(m => (
                <div key={m.id} className={`flex flex-col gap-0.5 ${m.from === myId ? "items-end" : "items-start"}`}>
                  <span className="text-[11px] text-slate-500">{m.name}</span>
                  <div className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] break-words ${
                    m.from === myId ? "bg-ledger-pink/20 text-ledger-pink" : "bg-slate-800 text-slate-300"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-slate-800/60">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Message…"
                  className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-ledger-pink/50"
                />
                <button onClick={sendChat} className="rounded-lg bg-ledger-pink px-3 py-2 text-slate-950 hover:bg-pink-400 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="shrink-0 border-t border-slate-800/60 bg-slate-900/80 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <Btn
            onClick={toggleAudio}
            danger={!audioOn}
            label={audioOn ? "Mute" : "Unmute"}
            icon={audioOn ? <MicOnIcon /> : <MicOffIcon />}
          />
          <Btn
            onClick={toggleVideo}
            danger={!videoOn}
            label={videoOn ? "Stop video" : "Start video"}
            icon={videoOn ? <CamOnIcon /> : <CamOffIcon />}
          />
          <Btn
            onClick={toggleScreen}
            accent={sharing}
            label={sharing ? "Stop share" : "Share screen"}
            icon={<ScreenIcon />}
          />

          {/* Reactions */}
          <div className="relative">
            <Btn
              onClick={() => setShowReactions(v => !v)}
              active={showReactions}
              label="React"
              icon={<span className="text-lg leading-none">😊</span>}
            />
            {showReactions && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-2 flex gap-1 shadow-xl z-50">
                {REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="text-2xl p-1.5 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="relative">
            <Btn
              onClick={() => setShowChat(v => !v)}
              active={showChat}
              label="Chat"
              icon={<ChatIcon />}
            />
            {unread > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-ledger-pink text-slate-950 text-[10px] font-bold flex items-center justify-center pointer-events-none">
                {unread}
              </span>
            )}
          </div>

          <div className="mx-2 h-8 w-px bg-slate-700/60" />

          <button
            onClick={endCall}
            className="flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 hover:bg-red-500/25 transition-colors"
          >
            <PhoneOffIcon />
            End
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoTile({ name, isLocal, stream, muted, videoOff }: {
  id: string; name: string; isLocal: boolean;
  stream?: MediaStream | null; muted?: boolean; videoOff?: boolean; myId: string | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().length > 0 && !videoOff;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/40 flex items-center justify-center min-h-0">
      {hasVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl font-bold text-ledger-pink">
            {name[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-slate-500">{name}</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <span className="rounded-lg bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-medium text-white">
          {name}{isLocal ? " (You)" : ""}
        </span>
        {muted && (
          <span className="rounded-lg bg-red-500/80 p-1">
            <MicOffIcon size="sm" />
          </span>
        )}
      </div>
    </div>
  );
}

function Btn({ onClick, label, icon, danger, accent, active }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  danger?: boolean; accent?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 transition-all min-w-[56px] ${
        danger
          ? "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
          : accent
          ? "bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25"
          : active
          ? "bg-slate-700 border border-slate-600 text-slate-100"
          : "bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
      }`}
    >
      <span>{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function MicOnIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicOffIcon({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3 w-3" : "h-5 w-5";
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 00-3 3M3 3l18 18" />
    </svg>
  );
}

function CamOnIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function CamOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9A2.25 2.25 0 014.5 5.25h1.372M3 3l18 18" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m1.5 13.5c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.091.852l1.106 4.423c.11.44-.054.902-.417 1.173l-1.293.97a1.062 1.062 0 00-.38 1.21 12.035 12.035 0 007.143 7.143c.441.162.928-.004 1.21-.38l.97-1.293a1.125 1.125 0 011.173-.417l4.423 1.106c.5.125.852.575.852 1.091V19.5a2.25 2.25 0 01-2.25 2.25h-2.25z" />
    </svg>
  );
}
