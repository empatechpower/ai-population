"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { getPost, getComments, createComment, likePost } from "@/lib/data";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronLeft, Heart, Send } from "lucide-react";
import { useParams } from "next/navigation";
const GOLD = "#D4B06A";

const GRAD = [
  "linear-gradient(135deg,#E8D4A0,#C9A24D)",
  "linear-gradient(135deg,#C0D4BE,#7A9A78)",
  "linear-gradient(135deg,#D8C8E0,#9878B0)",
  "linear-gradient(135deg,#D4B8C0,#A87888)",
  "linear-gradient(135deg,#B8D0C8,#688C84)",
];

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

function getInitials(id?: string) {
  if (!id) return "U";
  return id.slice(0, 2).toUpperCase();
}

interface BPost {
  _id: string;
  content: string;
  likes?: number;
  author?: string;
  "Created Date"?: number;
}
interface BComment {
  _id: string;
  content: string;
  author?: string;
  "Created Date"?: number;
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAppStore();
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<BComment[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const postId = id as string;

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([
          getPost(postId),
          getComments(postId),
        ]);
        setPost(p);
        setComments(c);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleReply() {
    if (!reply.trim() || sending) return;
    setSending(true);
    const text = reply;
    setReply("");
    try {
      await createComment(postId, text);
      // Optimistic add while we refetch
      setComments((c) => [
        ...c,
        {
          _id: Date.now().toString(),
          content: text,
          author: profile?._id,
          "Created Date": Date.now(),
        },
      ]);
      // Refetch for real data
      const updated = await getComments(postId);
      setComments(updated);
    } catch {
      // Keep optimistic entry on error
    } finally {
      setSending(false);
    }
  }

  async function handleLike() {
    setLiked((v) => !v);
    try {
      await likePost(postId);
    } catch {}
  }

  if (loading) return <LoadingScreen message="Loading post…" />;

  return (
    <div className="min-h-full bg-bg pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        <button
          onClick={() => router.push("/community")}
          className="flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
        >
          <ChevronLeft size={20} className="text-secondary" />
          <span className="text-sm text-secondary">Back</span>
        </button>
        <span className="text-sm font-semibold text-primary mx-auto">Post</span>
        <div className="w-16" />
      </div>

      {/* Post */}
      {post && (
        <div className="px-5 pt-4 mb-4">
          <div className="bg-card border border-border rounded-3xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: GRAD[0] }}
              >
                <span className="text-xs font-bold text-white">
                  {getInitials(post.author)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">
                  Community Member
                </p>
                <p className="text-2xs text-muted">
                  {timeAgo(post["Created Date"])}
                </p>
              </div>
            </div>
            <p className="text-sm text-primary leading-relaxed mb-4">
              {post.content}
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0"
              >
                <Heart
                  size={16}
                  color={liked ? "#E57373" : "#9A9094"}
                  fill={liked ? "#E57373" : "none"}
                />
                <span className="text-xs text-muted">
                  {(post.likes || 0) + (liked ? 1 : 0)}
                </span>
              </button>
              <span className="text-xs text-muted">
                {comments.length} {comments.length === 1 ? "reply" : "replies"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="px-5">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
        </p>
        <div className="flex flex-col gap-2.5 mb-6">
          {comments.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">
              No replies yet. Be the first to respond.
            </p>
          ) : (
            comments.map((c, i) => (
              <div
                key={c._id}
                className="bg-card border border-border rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: GRAD[(i + 1) % GRAD.length] }}
                  >
                    <span className="text-2xs font-bold text-white">
                      {getInitials(c.author)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {c.author === profile?._id ? "You" : "Community Member"}
                  </span>
                  <span className="text-2xs text-muted ml-auto">
                    {timeAgo(c["Created Date"])}
                  </span>
                </div>
                <p className="text-sm text-primary leading-relaxed pl-9">
                  {c.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply input — fixed above bottom nav */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border px-5 py-3 z-40">
        <div className="flex gap-2.5 items-center">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
            placeholder="Write a reply…"
            className="flex-1 bg-section border border-border rounded-pill px-4 py-2.5 text-sm
                       text-primary outline-none font-sans placeholder:text-muted"
          />
          <button
            onClick={handleReply}
            disabled={!reply.trim() || sending}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-0
              ${reply.trim() && !sending ? "cursor-pointer" : "cursor-not-allowed"}`}
            style={{ background: reply.trim() && !sending ? GOLD : "#EDE8DF" }}
          >
            <Send
              size={15}
              color={reply.trim() && !sending ? "#fff" : "#9A9094"}
            />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
