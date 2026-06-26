"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { getGroupMessages, sendGroupMessage, getGroup } from "@/lib/data";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronLeft, Send, Users } from "lucide-react";
import { useParams } from "next/navigation";
const GOLD = "#D4B06A";
const GRAD = [
  "linear-gradient(135deg,#E8D4A0,#C9A24D)",
  "linear-gradient(135deg,#C0D4BE,#7A9A78)",
  "linear-gradient(135deg,#D8C8E0,#9878B0)",
  "linear-gradient(135deg,#D4B8C0,#A87888)",
  "linear-gradient(135deg,#B8D0C8,#688C84)",
];

interface BMsg {
  _id: string;
  content: string;
  sender?: string;
  sender_name?: string;
  "Created Date"?: number;
}

function timeAgo(ts?: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function GroupChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAppStore();
  const groupId = id as string;

  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<BMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    load();
    // Poll every 8s for new messages
    pollRef.current = setInterval(loadMessages, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function load() {
    try {
      const [g, msgs] = await Promise.all([
        getGroup(groupId),
        getGroupMessages(groupId),
      ]);
      setGroup(g);
      setMessages(msgs);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const msgs = await getGroupMessages(groupId);
      setMessages(msgs);
    } catch {}
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text;
    setText("");

    // Optimistic
    const optimistic: BMsg = {
      _id: `opt-${Date.now()}`,
      content,
      sender: profile?._id,
      sender_name: profile?.first_name,
      "Created Date": Date.now(),
    };
    setMessages((m) => [...m, optimistic]);

    try {
      await sendGroupMessage(groupId, content);
      // Refetch to replace optimistic
      const updated = await getGroupMessages(groupId);
      setMessages(updated);
    } catch {
      // Optimistic stays — will sync on next poll
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading chat…" />;

  return (
    <div className="flex flex-col bg-bg" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card flex-shrink-0">
        <button
          onClick={() => router.push("/community")}
          className="flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
        >
          <ChevronLeft size={20} className="text-secondary" />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: GRAD[0] }}
        >
          <span className="text-xs font-bold text-white">
            {group?.name?.charAt(0) ?? "G"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary leading-tight truncate">
            {group?.name ?? "Group Chat"}
          </p>
          <div className="flex items-center gap-1">
            <Users size={10} className="text-muted" />
            <p className="text-2xs text-muted">
              {group?.member_count ?? 0} member
              {group?.member_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted">No messages yet.</p>
              <p className="text-2xs text-muted mt-1">
                Be the first to say hello!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender === profile?._id;
            return (
              <div
                key={msg._id}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-end"
                    style={{ background: GRAD[i % GRAD.length] }}
                  >
                    <span className="text-2xs font-bold text-white">
                      {(msg.sender_name || msg.sender || "U")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="max-w-[75%] flex flex-col">
                  {!isMe && msg.sender_name && (
                    <span className="text-2xs text-muted mb-0.5 pl-1">
                      {msg.sender_name}
                    </span>
                  )}
                  <div
                    className={`px-3.5 py-2.5 ${
                      isMe
                        ? "rounded-[18px_18px_4px_18px]"
                        : "bg-card border border-border rounded-[18px_18px_18px_4px]"
                    }`}
                    style={{ background: isMe ? GOLD : undefined }}
                  >
                    <p
                      className={`text-sm leading-relaxed ${isMe ? "text-white" : "text-primary"}`}
                    >
                      {msg.content}
                    </p>
                  </div>
                  <p
                    className={`text-2xs text-muted mt-0.5 ${isMe ? "text-right" : "text-left"}`}
                  >
                    {timeAgo(msg["Created Date"])}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex gap-2.5 items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${group?.name ?? "group"}…`}
            className="flex-1 bg-section border border-border rounded-pill px-4 py-2.5 text-sm
                       text-primary outline-none font-sans placeholder:text-muted"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-0
              ${text.trim() && !sending ? "cursor-pointer" : "cursor-not-allowed"}`}
            style={{ background: text.trim() && !sending ? GOLD : "#EDE8DF" }}
          >
            <Send
              size={15}
              color={text.trim() && !sending ? "#fff" : "#9A9094"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
