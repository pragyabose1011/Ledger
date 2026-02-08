import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    meeting_title: string;
    meeting_id: string;
    excerpt: string;
    score: number;
  }>;
  model?: string;
};

type Stats = {
  total_chunks: number;
  total_meetings: number;
  indexed: boolean;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadStats();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadStats = async () => {
    try {
      const res = await api.get("/rag/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load RAG stats", err);
    }
  };

  const handleIndexAll = async () => {
    try {
      setIndexing(true);
      await api.post("/rag/index-all");
      await loadStats();
    } catch (err) {
      console.error("Failed to index meetings", err);
      alert("Failed to index meetings. Check console for details.");
    } finally {
      setIndexing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/rag/query", {
        query: userMessage.content,
        top_k: 5,
        use_local_llm: useLocalLLM,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources,
        model: res.data.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.response?.data?.detail || err.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.1),_transparent_50%)]" />

      {/* Header */}
      <header className="relative border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-ledger-pink shadow-[0_0_25px_rgba(244,114,182,0.7)]" />
              <span className="text-lg font-semibold tracking-tight">Ledger</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400">Ask your meetings</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/meetings")}
              className="text-sm text-slate-400 hover:text-ledger-pink transition-colors"
            >
              Meetings
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-slate-400 hover:text-ledger-pink transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="relative border-b border-slate-800/50 bg-slate-900/30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            {stats && (
              <>
                <span>{stats.total_meetings} meetings indexed</span>
                <span className="text-slate-600">•</span>
                <span>{stats.total_chunks} text chunks</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocalLLM}
                onChange={(e) => setUseLocalLLM(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-ledger-pink focus:ring-ledger-pink"
              />
              Use local LLM (Ollama)
            </label>
            <button
              onClick={handleIndexAll}
              disabled={indexing}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors disabled:opacity-50"
            >
              {indexing ? "Indexing..." : "Re-index all meetings"}
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Ask about your meetings</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                I can search through all your meeting transcripts and answer questions like:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What did we decide about the pricing model?",
                  "Who is responsible for the API redesign?",
                  "What risks were mentioned in recent meetings?",
                  "Summarize last week's discussions",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 hover:border-ledger-pink hover:text-ledger-pink transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-ledger-pink text-slate-950"
                    : "bg-slate-800/50 border border-slate-700"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Sources:</p>
                    <div className="space-y-2">
                      {message.sources.map((source, idx) => (
                        <button
                          key={idx}
                          onClick={() => navigate(`/meetings/${source.meeting_id}`)}
                          className="block w-full text-left rounded-lg bg-slate-900/50 p-2 text-xs hover:bg-slate-900 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-ledger-pink font-medium">
                              {source.meeting_title}
                            </span>
                            <span className="text-slate-500">
                              {Math.round(source.score * 100)}% match
                            </span>
                          </div>
                          <p className="text-slate-400 line-clamp-2">{source.excerpt}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model used */}
                {message.model && (
                  <p className="mt-2 text-xs text-slate-500">via {message.model}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-ledger-pink animate-pulse" />
                  <div className="h-2 w-2 rounded-full bg-ledger-pink animate-pulse delay-100" />
                  <div className="h-2 w-2 rounded-full bg-ledger-pink animate-pulse delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="relative border-t border-slate-800 bg-slate-950/80 backdrop-blur">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your meetings..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-ledger-pink focus:outline-none focus:ring-2 focus:ring-ledger-pink/20"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-ledger-pink px-6 py-3 text-sm font-medium text-slate-950 shadow-[0_0_20px_rgba(244,114,182,0.5)] hover:bg-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}