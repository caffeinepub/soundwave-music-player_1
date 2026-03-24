import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
/**
 * AIChat — Floating ChatGPT-style AI assistant for Soundwave.
 *
 * Uses OpenAI gpt-4o-mini.
 * Set VITE_OPENAI_API_KEY in your .env to enable real responses.
 * Falls back to smart local logic if no key is set.
 */
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { songs } from "../data/songs";
import { BOLLYWOOD_ARTISTS, HOLLYWOOD_ARTISTS } from "./artistData";

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

// Build system prompt with full app data context
function buildSystemPrompt(): string {
  const songList = songs.map((s) => `"${s.title}" by ${s.artist}`).join(", ");
  const bollywood = BOLLYWOOD_ARTISTS.map((a) => a.name).join(", ");
  const hollywood = HOLLYWOOD_ARTISTS.map((a) => a.name).join(", ");

  // Inject user history from localStorage for personalised context
  let historyContext = "";
  try {
    const recent = JSON.parse(localStorage.getItem("sw_recent") ?? "[]") as {
      title?: string;
      artist?: string;
    }[];
    const liked = JSON.parse(localStorage.getItem("sw_liked") ?? "[]") as {
      title?: string;
      artist?: string;
    }[];
    const searches = JSON.parse(
      localStorage.getItem("sw_search_history") ?? "[]",
    ) as string[];
    if (recent.length)
      historyContext += `\nRecently played: ${recent
        .slice(0, 5)
        .map((s) => `"${s.title}" by ${s.artist}`)
        .join(", ")}.`;
    if (liked.length)
      historyContext += `\nLiked songs: ${liked
        .slice(0, 5)
        .map((s) => `"${s.title}" by ${s.artist}`)
        .join(", ")}.`;
    if (searches.length)
      historyContext += `\nRecent searches: ${searches.slice(0, 5).join(", ")}.`;
  } catch (_) {
    // ignore localStorage errors
  }

  return `You are Soundwave AI, a premium music assistant integrated inside the Soundwave streaming app.
You help users discover music, suggest playlists, and answer queries about songs and artists.

App catalogue includes these songs: ${songList}.
Bollywood artists available: ${bollywood}.
Global artists available: ${hollywood}.${historyContext}

Your personality:
- Enthusiastic, knowledgeable, concise
- Respond in 2-4 sentences max unless asked for a list
- When suggesting songs or playlists, mention specific tracks from the catalogue when relevant
- Use music terminology naturally
- Format lists with bullet points when helpful

Capabilities:
- Recommend songs by mood, genre, time of day
- Suggest workout, chill, focus, party playlists
- Describe artists and their style
- Answer music trivia
- Help users discover similar artists`;
}

async function callOpenAI(
  history: Message[],
  userText: string,
): Promise<string> {
  if (!OPENAI_KEY) {
    return localFallback(userText);
  }

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    })),
    { role: "user" as const, content: userText },
  ];

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 400,
      temperature: 0.85,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return text.trim() || "I couldn't generate a response. Please try again.";
}

// Smart local fallback when no API key is set
function localFallback(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("chill") || q.includes("relax")) {
    return 'For a chill vibe, I\'d recommend "Chill Hours" by Lo-Fi Beats, "Ocean Drive" by Miami Sound, and "Forest Walk" by Nature Beats. Perfect for winding down.';
  }
  if (q.includes("workout") || q.includes("energy") || q.includes("gym")) {
    return 'For your workout, try "Electric Feel" by MGMT Vibes and "Neon Dreams" by Synthwave Club — both have high-energy beats that\'ll keep you pumped!';
  }
  if (q.includes("focus") || q.includes("study")) {
    return 'For focus and studying, "Soft Piano" by Classical Mood and "Space Walk" by Astral Project are excellent choices — minimal distractions, deep flow.';
  }
  if (q.includes("trending") || q.includes("popular")) {
    return 'Trending right now: The Weeknd, Taylor Swift, and Arijit Singh are dominating charts globally. Check out "Midnight Glow" and "Neon Dreams" on Soundwave.';
  }
  if (q.includes("bollywood") || q.includes("hindi")) {
    return "For Bollywood hits, Arijit Singh and Shreya Ghoshal are must-listens. Try searching their names in the search bar to find their top tracks!";
  }
  if (q.includes("party")) {
    return 'Party mode: "Retro Funk" by Groove Machine and "Electric Feel" by MGMT Vibes will keep the crowd moving. Also check the Festival Mode playlist!';
  }
  if (q.includes("sad") || q.includes("heartbreak")) {
    return 'For emotional moments, "Midnight Glow" by Luna Ray and "Purple Haze" by Jimi Vibes have beautiful melancholic energy. Sometimes sad music is the best therapy.';
  }
  return `I can help you with song recommendations, playlists, and music discovery! Try asking me to:\n• \"Suggest chill music for tonight\"\n• \"What's good for a workout?\"\n• \"Play something like Arijit Singh\"`;
}

const SUGGESTIONS = [
  "Chill music for tonight",
  "Workout playlist",
  "Trending songs",
  "Sad but beautiful",
];

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hey! I'm Soundwave AI ✨ Ask me anything — mood playlists, song recommendations, artist info. What are you feeling?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages — messages is used as a change trigger, not read inside
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages triggers scroll-to-bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now(), role: "user", text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await callOpenAI(messages, userText);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: reply },
      ]);
    } catch (err) {
      console.error("[AIChat] OpenAI error:", err);
      const fallback = localFallback(userText);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: fallback },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* ── Floating Action Button ──────────────────────────────── */}
      <motion.button
        type="button"
        data-ocid="ai.chat.fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className="fixed z-[200] flex items-center justify-center rounded-full shadow-2xl"
        style={{
          bottom: 104,
          right: 24,
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, #1DB954, #00b8ff)",
          boxShadow:
            "0 0 24px rgba(29,185,84,0.55), 0 4px 20px rgba(0,0,0,0.4)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} color="#000" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sparkles size={22} color="#000" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            data-ocid="ai.chat.panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed z-[199] flex flex-col"
            style={{
              bottom: 168,
              right: 16,
              width: "clamp(300px, 90vw, 380px)",
              height: "clamp(400px, 55vh, 520px)",
              background: "rgba(12, 14, 22, 0.92)",
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(29,185,84,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 34,
                  height: 34,
                  background: "linear-gradient(135deg, #1DB954, #8B5CF6)",
                  flexShrink: 0,
                }}
              >
                <Bot size={16} color="#fff" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">
                  Soundwave AI
                </div>
                <div className="text-xs" style={{ color: "#1DB954" }}>
                  {OPENAI_KEY ? "● GPT-4o mini" : "● Smart assistant"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
              style={{ scrollBehavior: "smooth" }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? {
                            background:
                              "linear-gradient(135deg, #1DB954, #00b8ff)",
                            color: "#000",
                            fontWeight: 500,
                            borderBottomRightRadius: 6,
                          }
                        : {
                            background: "rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.9)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderBottomLeftRadius: 6,
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderBottomLeftRadius: 6,
                    }}
                  >
                    <div className="typing-dot" />
                    <div
                      className="typing-dot"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <div
                      className="typing-dot"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions (show only on first message) */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105"
                    style={{
                      background: "rgba(29,185,84,0.12)",
                      border: "1px solid rgba(29,185,84,0.25)",
                      color: "#1DB954",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div
              className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{
                  color: "#fff",
                  caretColor: "#1DB954",
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="flex items-center justify-center rounded-full transition-all"
                style={{
                  width: 34,
                  height: 34,
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg, #1DB954, #00b8ff)"
                      : "rgba(255,255,255,0.08)",
                  flexShrink: 0,
                  border: "none",
                }}
              >
                {loading ? (
                  <Loader2 size={14} color="#fff" className="animate-spin" />
                ) : (
                  <Send size={14} color={input.trim() ? "#000" : "#555"} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export { BOLLYWOOD_ARTISTS, HOLLYWOOD_ARTISTS };
