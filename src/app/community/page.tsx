"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import {
  getPosts,
  createPost,
  likePost,
  getMyGroups,
  getAllGroups,
  getGroupPosts,
  createGroupPost,
  getGroupMessages,
  sendGroupMessage,
} from "@/lib/data";
import { triggerJoinGroup, triggerLeaveGroup } from "@/lib/workflows";
// import { uploadImage, validateImageFile } from "@/lib/cloudinary";
import { uploadImage, validateImageFile } from "@/lib/cloudinary";
import {
  Heart,
  Bookmark,
  Send,
  Search,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  Plus,
  Check,
  Hash,
  Feather,
  MoreHorizontal,
  Paperclip,
  Sparkles,
} from "lucide-react";

type Tab = "feed" | "groups" | "chat";

const GOLD = "#D4B06A";
const CHAMP = "#C9A24D";
const SAGE = "#A8B9A5";
const SUCCESS = "#1F7A5A";

const GRAD = [
  "linear-gradient(135deg,#E8D4A0,#C9A24D)",
  "linear-gradient(135deg,#C0D4BE,#7A9A78)",
  "linear-gradient(135deg,#D8C8E0,#9878B0)",
  "linear-gradient(135deg,#D4B8C0,#A87888)",
  "linear-gradient(135deg,#B8D0C8,#688C84)",
];

const FEED_FILTERS = [
  "My Groups",
  "Nutrition",
  "Movement",
  "Wellness",
  "Support",
];

interface BPost {
  _id: string;
  content: string;
  likes?: number;
  author?: string;
  author_name?: string;
  group?: string;
  image_url?: string;
  Image?: string;
  "Created Date"?: number;
}
interface BGroup {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  member_count?: number;
}
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

function groupInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function CommunityPage() {
  useProfile();
  const { profile } = useAppStore();
  const router = useRouter();

  // ── Main state ────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<BPost[]>([]);
  const [myGroups, setMyGroups] = useState<BGroup[]>([]);
  const [allGroups, setAllGroups] = useState<BGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BGroup | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState("My Groups");
  const [groupFilter, setGroupFilter] = useState("All");

  // ── New post overlay state ────────────────────────────────
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Chat overlay state ────────────────────────────────────
  const [chatGroup, setChatGroup] = useState<BGroup | null>(null);
  const [chatMessages, setChatMessages] = useState<BMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile) return;
    loadGroups();
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    loadFeed();
  }, [profile, selectedGroup]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Data loading ──────────────────────────────────────────
  async function loadGroups() {
    try {
      const [mine, all] = await Promise.all([getMyGroups(), getAllGroups()]);
      setMyGroups(mine);
      setAllGroups(all);
      if (mine.length > 0 && !selectedGroup) setSelectedGroup(mine[0]);
    } catch {
    } finally {
      setLoadingGroups(false);
    }
  }

  async function loadFeed() {
    setLoadingPosts(true);
    try {
      const data = selectedGroup
        ? await getGroupPosts(selectedGroup._id)
        : await getPosts();
      setPosts(data);
    } catch {
    } finally {
      setLoadingPosts(false);
    }
  }

  // ── Chat ──────────────────────────────────────────────────
  async function openGroupChat(g: BGroup) {
    setChatGroup(g);
    const msgs = await getGroupMessages(g._id);
    setChatMessages(msgs);
    // Poll every 8s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const updated = await getGroupMessages(g._id);
      setChatMessages(updated);
    }, 8000);
  }

  function closeChat() {
    setChatGroup(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  async function handleSendMsg() {
    if (!chatInput.trim() || !chatGroup || sendingMsg) return;
    setSendingMsg(true);
    const content = chatInput;
    setChatInput("");
    const optimistic: BMsg = {
      _id: `opt-${Date.now()}`,
      content,
      sender: profile?._id,
      sender_name: profile?.first_name,
      "Created Date": Date.now(),
    };
    setChatMessages((m) => [...m, optimistic]);
    try {
      await sendGroupMessage(chatGroup._id, content);
      const updated = await getGroupMessages(chatGroup._id);
      setChatMessages(updated);
    } catch {
    } finally {
      setSendingMsg(false);
    }
  }

  // ── Post creation ─────────────────────────────────────────
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setUploadError(error);
      return;
    }

    setUploadError(null);
    setUploadProgress("idle");
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setPostImage(null);
    setPostImagePreview(null);
    setUploadProgress("idle");
    setUploadError(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function handlePost() {
    if (!newPostText.trim() || posting) return;
    setPosting(true);
    setUploadError(null);

    try {
      // Upload image to Cloudinary first if one was selected
      let imageUrl = "";
      if (postImage) {
        setUploadProgress("uploading");
        try {
          const result = await uploadImage(postImage);
          imageUrl = result.secure_url;
          setUploadProgress("done");
        } catch (err: any) {
          setUploadProgress("error");
          setUploadError(
            err?.message ?? "Image upload failed. Post without image?",
          );
          setPosting(false);
          return; // stop — let user retry or remove image
        }
      }

      // Create post with image URL
      if (selectedGroup) {
        await createGroupPost(selectedGroup._id, newPostText, imageUrl);
      } else {
        await createPost(newPostText);
      }

      setPosted(true);
      setTimeout(() => {
        setPosted(false);
        setNewPostText("");
        setPostTags("");
        removeImage();
        setShowNewPost(false);
        loadFeed();
      }, 1200);
    } catch (err) {
      console.error("Post failed:", err);
      setUploadError("Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  // ── Interactions ──────────────────────────────────────────
  async function handleLike(id: string) {
    setLikedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    try {
      await likePost(id);
    } catch {}
  }

  async function handleJoin(group: BGroup) {
    setJoiningId(group._id);
    try {
      await triggerJoinGroup(group._id);
      await loadGroups();
    } catch {
    } finally {
      setJoiningId(null);
    }
  }

  async function handleLeave(group: BGroup) {
    setJoiningId(group._id);
    try {
      await triggerLeaveGroup(group._id);
      await loadGroups();
      if (selectedGroup?._id === group._id) setSelectedGroup(null);
    } catch {
    } finally {
      setJoiningId(null);
    }
  }

  function isMember(group: BGroup) {
    return myGroups.some((g) => g._id === group._id);
  }

  if (!profile) return <LoadingScreen message="Loading community…" />;

  const isOverlayOpen = showNewPost || !!chatGroup;

  return (
    <div
      className="relative min-h-full bg-bg"
      style={{ fontFamily: "inherit" }}
    >
      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT — hidden when overlay is open
      ══════════════════════════════════════════════════════ */}
      <div style={{ visibility: isOverlayOpen ? "hidden" : "visible" }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-section border border-border flex items-center justify-center">
              <Users size={18} className="text-muted" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary tracking-tight leading-tight">
                Community
              </h1>
              <p className="text-2xs text-muted font-serif italic mt-0.5">
                Connect with women at your stage
              </p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-section border border-border flex items-center justify-center cursor-pointer">
            <Search size={17} className="text-muted" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="px-5 pt-4">
          <div
            className="flex rounded-pill p-1 gap-0.5"
            style={{ background: "#EDE8DF" }}
          >
            {(["feed", "groups", "chat"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-pill border-0 cursor-pointer text-sm font-medium
                            transition-all font-sans capitalize
                            ${tab === t ? "text-white" : "bg-transparent text-secondary"}`}
                style={{ background: tab === t ? CHAMP : "transparent" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── FEED TAB ── */}
        {tab === "feed" && (
          <div className="pb-24">
            {/* Filter pills */}
            <div
              className="flex gap-2 overflow-x-auto px-5 pt-4 pb-0.5"
              style={{ scrollbarWidth: "none" }}
            >
              {FEED_FILTERS.map((f) => {
                const active = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-pill text-xs font-medium
                                border cursor-pointer font-sans transition-all`}
                    style={{
                      background: active ? `${SAGE}22` : "#EDE8DF",
                      border: `1.5px solid ${active ? `${SAGE}55` : "rgba(180,155,120,0.18)"}`,
                      color: active ? "#3D5C3A" : "#7B7268",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Your communities horizontal scroll */}
            <div className="mt-5">
              <div className="flex items-center justify-between px-5 mb-3.5">
                <h2 className="text-base font-semibold text-primary tracking-tight">
                  Your Communities
                </h2>
                <button
                  onClick={() => setTab("chat")}
                  className="text-xs text-muted bg-transparent border-0 cursor-pointer flex items-center gap-1 font-sans"
                >
                  See All <ChevronRight size={12} />
                </button>
              </div>
              <div
                className="flex gap-3 overflow-x-auto px-5 pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {myGroups.map((g, i) => (
                  <button
                    key={g._id}
                    onClick={() => openGroupChat(g)}
                    className="flex flex-col items-center gap-1.5 bg-transparent border-0
                               cursor-pointer flex-shrink-0 p-0.5"
                    style={{ width: 72 }}
                  >
                    <div
                      className="w-14 h-14 rounded-[18px] flex items-center justify-center"
                      style={{ background: GRAD[i % GRAD.length] }}
                    >
                      <span className="text-sm font-bold text-white">
                        {groupInitials(g.name)}
                      </span>
                    </div>
                    <span
                      className="text-2xs text-secondary text-center leading-tight"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {g.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setTab("groups")}
                  className="flex flex-col items-center gap-1.5 bg-transparent border-0 cursor-pointer flex-shrink-0 p-0.5"
                  style={{ width: 72 }}
                >
                  <div
                    className="w-14 h-14 rounded-[18px] bg-section flex items-center justify-center"
                    style={{ border: "2px dashed rgba(180,155,120,0.3)" }}
                  >
                    <Plus size={18} className="text-muted" />
                  </div>
                  <span className="text-2xs text-muted text-center">
                    Discover
                  </span>
                </button>
              </div>
            </div>

            {/* Today's topic pinned card */}
            <div className="px-5 mt-5">
              <div
                className="bg-card rounded-[20px] p-4 border border-border"
                style={{ borderLeft: `3px solid ${CHAMP}` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={12} color={CHAMP} />
                  <span
                    className="text-2xs font-semibold uppercase tracking-wider"
                    style={{ color: CHAMP }}
                  >
                    Today's Topic
                  </span>
                </div>
                <p className="text-base font-semibold text-primary tracking-tight mb-1">
                  {selectedGroup?.name
                    ? `What's on your mind in ${selectedGroup.name}?`
                    : "Managing Fatigue This Week"}
                </p>
                <p className="text-sm text-secondary leading-relaxed font-serif italic">
                  Rest, hydration, and gentle movement are your most powerful
                  allies today.
                </p>
              </div>
            </div>

            {/* Group selector for feed */}
            {myGroups.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto px-5 mt-4 pb-0.5"
                style={{ scrollbarWidth: "none" }}
              >
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-semibold
                             border cursor-pointer font-sans transition-all"
                  style={{
                    background: !selectedGroup ? CHAMP : "transparent",
                    color: !selectedGroup ? "#fff" : "#7B7268",
                    border: `1px solid ${!selectedGroup ? CHAMP : "rgba(180,155,120,0.18)"}`,
                  }}
                >
                  All
                </button>
                {myGroups.map((g) => (
                  <button
                    key={g._id}
                    onClick={() => setSelectedGroup(g)}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-pill text-xs font-semibold
                               border cursor-pointer font-sans transition-all"
                    style={{
                      background:
                        selectedGroup?._id === g._id ? CHAMP : "transparent",
                      color: selectedGroup?._id === g._id ? "#fff" : "#7B7268",
                      border: `1px solid ${selectedGroup?._id === g._id ? CHAMP : "rgba(180,155,120,0.18)"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Posts */}
            <div className="px-5 mt-5">
              <h2 className="text-base font-semibold text-primary tracking-tight mb-4">
                Recent Conversations
              </h2>
              {loadingPosts ? (
                <div className="text-center py-8">
                  <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent spin mx-auto mb-2" />
                  <p className="text-sm text-muted">Loading posts…</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted mb-2">No posts yet.</p>
                  {myGroups.length === 0 && (
                    <button
                      onClick={() => setTab("groups")}
                      className="text-xs font-semibold bg-transparent border-0 cursor-pointer font-sans"
                      style={{ color: CHAMP }}
                    >
                      Join a group to see posts →
                    </button>
                  )}
                </div>
              ) : (
                posts.map((post, i) => (
                  <div
                    key={post._id}
                    className="bg-card rounded-[22px] overflow-hidden border border-border mb-3.5 p-3"
                    style={{ boxShadow: "0 2px 14px rgba(140,110,70,0.07)" }}
                  >
                    {/* Author row */}
                    <div className="px-4.5 pt-4 pb-3 flex items-start gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${GRAD[i % GRAD.length].split(",")[1]?.trim().replace(")", "") ?? CHAMP}22`,
                          border: `1.5px solid ${CHAMP}33`,
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: CHAMP }}
                        >
                          {(post.author_name || "U").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-primary">
                            {post.author_name || "Community Member"}
                          </span>
                          {post.group &&
                            myGroups.find((g) => g._id === post.group) && (
                              <span
                                className="text-2xs font-semibold px-2 py-0.5 rounded-pill"
                                style={{ color: SAGE, background: `${SAGE}18` }}
                              >
                                {
                                  myGroups.find((g) => g._id === post.group)
                                    ?.name
                                }
                              </span>
                            )}
                        </div>
                        <p className="text-2xs text-muted mt-0.5">
                          {timeAgo(post["Created Date"])}
                        </p>
                      </div>
                      <button className="bg-transparent border-0 cursor-pointer p-0.5 mt-0.5">
                        <MoreHorizontal size={17} className="text-muted" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="px-4.5 pb-3">
                      <p
                        className="text-sm text-secondary leading-relaxed cursor-pointer"
                        onClick={() => router.push(`/community/${post._id}`)}
                      >
                        {post.content}
                      </p>
                    </div>

                    {/* Image if present */}
                    {post.Image && (
                      <div
                        className="mx-3.5 mb-3.5 rounded-2xl overflow-hidden"
                        style={{ height: 200 }}
                      >
                        <img
                          src={post.Image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="px-4.5 pb-4 pt-3 flex items-center gap-5 border-t border-border">
                      <button
                        onClick={() => handleLike(post._id)}
                        className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <Heart
                          size={16}
                          color={likedIds.has(post._id) ? "#C9A0A0" : "#9A9094"}
                          fill={likedIds.has(post._id) ? "#C9A0A0" : "none"}
                        />
                        <span
                          className="text-xs"
                          style={{
                            color: likedIds.has(post._id)
                              ? "#C9A0A0"
                              : "#9A9094",
                            fontWeight: likedIds.has(post._id) ? 600 : 400,
                          }}
                        >
                          {(post.likes || 0) + (likedIds.has(post._id) ? 1 : 0)}{" "}
                          Support
                        </span>
                      </button>
                      <button
                        onClick={() => router.push(`/community/${post._id}`)}
                        className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <MessageCircle size={16} className="text-muted" />
                      </button>
                      <button
                        onClick={() =>
                          setSavedIds((s) => {
                            const n = new Set(s);
                            n.has(post._id)
                              ? n.delete(post._id)
                              : n.add(post._id);
                            return n;
                          })
                        }
                        className="ml-auto bg-transparent border-0 cursor-pointer p-0"
                      >
                        <Bookmark
                          size={16}
                          color={savedIds.has(post._id) ? CHAMP : "#9A9094"}
                          fill={savedIds.has(post._id) ? CHAMP : "none"}
                          stroke={savedIds.has(post._id) ? CHAMP : "#9A9094"}
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── FAB — Feather icon, sticky bottom-right ── */}
            <div
              className="sticky bottom-5 flex justify-end pr-5 pt-3 pb-2 pointer-events-none"
              style={{ zIndex: 20 }}
            >
              <button
                onClick={() => setShowNewPost(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center border-0
                           cursor-pointer pointer-events-auto transition-transform active:scale-90"
                style={{
                  background: CHAMP,
                  boxShadow: "0 4px 20px rgba(201,162,77,0.45)",
                }}
              >
                <Feather size={21} color="#FFF8EE" />
              </button>
            </div>
          </div>
        )}

        {/* ── GROUPS TAB ── */}
        {tab === "groups" && (
          <div className="px-5 pt-4 pb-24">
            {/* Category filter */}
            <div
              className="flex gap-2 overflow-x-auto pb-0.5 mb-5"
              style={{ scrollbarWidth: "none" }}
            >
              {["All", "City", "Month", "Wellness"].map((f) => (
                <button
                  key={f}
                  onClick={() => setGroupFilter(f)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-pill text-xs font-medium
                             border cursor-pointer font-sans transition-all"
                  style={{
                    background: groupFilter === f ? `${CHAMP}18` : "#EDE8DF",
                    border: `1.5px solid ${groupFilter === f ? `${CHAMP}55` : "rgba(180,155,120,0.18)"}`,
                    color: groupFilter === f ? CHAMP : "#7B7268",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadingGroups ? (
              <div className="text-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent spin mx-auto" />
              </div>
            ) : (
              <div className="bg-card rounded-[22px] border border-border overflow-hidden">
                {(groupFilter === "All"
                  ? allGroups
                  : allGroups.filter(
                      (g) =>
                        g.category?.toLowerCase() === groupFilter.toLowerCase(),
                    )
                ).map((g, idx, arr) => {
                  const joined = isMember(g);
                  return (
                    <div
                      key={g._id}
                      className="flex items-center gap-3.5 px-4.5 py-3.5"
                      style={{
                        borderBottom:
                          idx < arr.length - 1
                            ? "1px solid rgba(180,155,120,0.15)"
                            : "none",
                      }}
                    >
                      <div
                        className="w-13 h-13 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 52,
                          height: 52,
                          background: GRAD[idx % GRAD.length],
                        }}
                      >
                        <span className="text-sm font-bold text-white">
                          {groupInitials(g.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {g.name}
                        </p>
                        <p className="text-2xs text-muted">
                          {g.member_count ?? 0} members
                          {g.category ? ` · ${g.category}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          joined ? handleLeave(g) : handleJoin(g)
                        }
                        disabled={joiningId === g._id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs
                                   font-semibold border-0 cursor-pointer flex-shrink-0 font-sans transition-all"
                        style={{
                          background: joined ? `${SAGE}18` : CHAMP,
                          color: joined ? SAGE : "#FFF8EE",
                        }}
                      >
                        {joiningId === g._id ? (
                          "…"
                        ) : joined ? (
                          <>
                            <Check size={11} />
                            <span>Joined</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} />
                            <span>Join</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab === "chat" && (
          <div className="px-5 pt-4 pb-24">
            <p className="text-2xs text-muted font-serif italic mb-4">
              Your Conversations
            </p>
            {loadingGroups ? (
              <div className="text-center py-8">
                <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent spin mx-auto" />
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted mb-2">No chats yet.</p>
                <button
                  onClick={() => setTab("groups")}
                  className="text-xs font-semibold bg-transparent border-0 cursor-pointer font-sans"
                  style={{ color: CHAMP }}
                >
                  Join a group to start chatting →
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-[22px] border border-border overflow-hidden">
                {myGroups.map((g, i) => (
                  <button
                    key={g._id}
                    onClick={() => openGroupChat(g)}
                    className="w-full flex items-center gap-3.5 px-4.5 py-4 bg-transparent
                               border-0 cursor-pointer text-left"
                    style={{
                      borderBottom:
                        i < myGroups.length - 1
                          ? "1px solid rgba(180,155,120,0.15)"
                          : "none",
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 48,
                        height: 48,
                        background: GRAD[i % GRAD.length],
                      }}
                    >
                      <span className="text-sm font-bold text-white">
                        {groupInitials(g.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold text-primary">
                          {g.name}
                        </span>
                      </div>
                      <p className="text-2xs text-muted truncate">
                        {g.member_count ?? 0} members · Tap to open chat
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-muted flex-shrink-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          CHAT OVERLAY — slides in from right
      ══════════════════════════════════════════════════════ */}
      {chatGroup && (
        <div
          className="absolute inset-0 bg-bg flex flex-col"
          style={{
            zIndex: 30,
            transform: chatGroup ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Chat header */}
          <div className="px-4.5 py-3.5 bg-card border-b border-border flex items-center gap-3 flex-shrink-0">
            <button
              onClick={closeChat}
              className="bg-transparent border-0 cursor-pointer p-1 flex"
            >
              <ChevronLeft size={22} className="text-primary" />
            </button>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: GRAD[0] }}
            >
              <span className="text-xs font-bold text-white">
                {groupInitials(chatGroup.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary truncate">
                {chatGroup.name}
              </p>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: SUCCESS }}
                />
                <p className="text-2xs text-muted">
                  {chatGroup.member_count ?? 0} members
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted">No messages yet.</p>
                  <p className="text-2xs text-muted mt-1">
                    Be the first to say hello!
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, i) => {
                const isMe = msg.sender === profile?._id;
                const msgs = chatMessages;
                const showLabel =
                  !isMe && (i === 0 || msgs[i - 1]?.sender !== msg.sender);
                return (
                  <div
                    key={msg._id}
                    className="flex flex-col"
                    style={{ alignItems: isMe ? "flex-end" : "flex-start" }}
                  >
                    {showLabel && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <div
                          className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ background: `${CHAMP}22` }}
                        >
                          <span
                            className="text-2xs font-bold"
                            style={{ color: CHAMP }}
                          >
                            {(msg.sender_name || "U").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-2xs font-semibold text-secondary">
                          {msg.sender_name || "Member"}
                        </span>
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className="px-4 py-2.5"
                        style={{
                          background: isMe ? `${SAGE}25` : "#F9F6F1",
                          border: `1px solid ${isMe ? `${SAGE}35` : "rgba(180,155,120,0.15)"}`,
                          borderRadius: isMe
                            ? "20px 20px 4px 20px"
                            : "20px 20px 20px 4px",
                        }}
                      >
                        <p className="text-sm text-primary leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                      <p
                        className={`text-2xs text-muted mt-1 ${isMe ? "text-right" : "text-left"} px-1`}
                      >
                        {timeAgo(msg["Created Date"])}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-3.5 py-2.5 bg-card border-t border-border flex items-end gap-2.5 flex-shrink-0">
            <button className="bg-transparent border-0 cursor-pointer p-2 flex-shrink-0">
              <Paperclip size={17} className="text-muted" />
            </button>
            <div
              className="flex-1 rounded-pill px-4 py-2.5 flex items-center border border-border"
              style={{ background: "#EDE8DF" }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMsg();
                  }
                }}
                placeholder="Write something supportive…"
                className="flex-1 bg-transparent border-0 outline-none text-sm text-primary
                           font-sans placeholder:text-muted"
              />
            </div>
            <button
              onClick={handleSendMsg}
              disabled={!chatInput.trim() || sendingMsg}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-0 transition-all"
              style={{
                background: chatInput.trim() ? CHAMP : "#EDE8DF",
                border: `1.5px solid ${chatInput.trim() ? CHAMP : "rgba(180,155,120,0.18)"}`,
                cursor: chatInput.trim() ? "pointer" : "default",
              }}
            >
              <Send
                size={15}
                color={chatInput.trim() ? "#FFF8EE" : "#9A9094"}
                style={{ marginLeft: 1 }}
              />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          NEW POST OVERLAY — slides up from bottom
      ══════════════════════════════════════════════════════ */}
      {showNewPost && (
        <div
          className="absolute inset-0 bg-bg flex flex-col"
          style={{
            zIndex: 30,
            transform: showNewPost ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4.5 bg-card border-b border-border flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => {
                setShowNewPost(false);
                setNewPostText("");
                setPostTags("");
                removeImage();
              }}
              className="text-sm text-muted bg-transparent border-0 cursor-pointer font-sans"
            >
              Cancel
            </button>
            <h2 className="text-base font-semibold text-primary">New Post</h2>
            <button
              onClick={handlePost}
              disabled={
                !newPostText.trim() || posting || uploadProgress === "uploading"
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-semibold
                         border-0 font-sans transition-all"
              style={{
                background:
                  newPostText.trim() &&
                  !posting &&
                  uploadProgress !== "uploading"
                    ? CHAMP
                    : "#EDE8DF",
                color:
                  newPostText.trim() &&
                  !posting &&
                  uploadProgress !== "uploading"
                    ? "#FFF8EE"
                    : "#9A9094",
                cursor:
                  newPostText.trim() &&
                  !posting &&
                  uploadProgress !== "uploading"
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {posted ? (
                <>
                  <Check size={13} color={SUCCESS} />
                  <span style={{ color: SUCCESS }}>Shared!</span>
                </>
              ) : uploadProgress === "uploading" ? (
                "Uploading…"
              ) : posting ? (
                "Sharing…"
              ) : (
                "Share"
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* Author context */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${SAGE}22`,
                  border: `1.5px solid ${SAGE}33`,
                }}
              >
                <span className="text-sm font-bold" style={{ color: SAGE }}>
                  {(profile.first_name || "Me").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">
                  {profile.first_name || "You"}
                </p>
                <p className="text-2xs text-muted">
                  {selectedGroup
                    ? `Posting to ${selectedGroup.name}`
                    : "Posting to community"}
                </p>
              </div>
            </div>

            {/* Text input */}
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share a tip, a question, or a moment with your circle…"
              maxLength={1000}
              className="w-full bg-transparent border-0 outline-none text-sm text-primary
                         font-serif leading-relaxed resize-none placeholder:text-muted"
              style={{
                minHeight: 130,
                fontStyle: newPostText ? "normal" : "italic",
              }}
            />
            <p className="text-2xs text-muted text-right mb-4">
              {newPostText.length}/1000
            </p>

            {/* Upload error */}
            {uploadError && (
              <div
                className="flex items-start gap-2 px-3.5 py-3 rounded-2xl mb-4"
                style={{
                  background: "rgba(194,107,46,0.08)",
                  border: "1px solid rgba(194,107,46,0.2)",
                }}
              >
                <span className="text-warning text-xs mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="text-xs text-warning leading-relaxed">
                    {uploadError}
                  </p>
                  <button
                    onClick={removeImage}
                    className="text-2xs font-semibold bg-transparent border-0 cursor-pointer
                               font-sans mt-1 p-0 text-warning underline"
                  >
                    Remove image and post without it
                  </button>
                </div>
              </div>
            )}

            {/* Image preview */}
            {postImagePreview && (
              <div
                className="relative mb-4 rounded-2xl overflow-hidden"
                style={{ height: 180 }}
              >
                <img
                  src={postImagePreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {/* Upload progress overlay */}
                {uploadProgress === "uploading" && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent spin" />
                    <span className="text-xs text-white font-medium">
                      Uploading…
                    </span>
                  </div>
                )}
                {uploadProgress === "done" && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-pill"
                    style={{ background: "rgba(31,122,90,0.85)" }}
                  >
                    <Check size={10} color="#fff" />
                    <span className="text-2xs text-white font-semibold">
                      Uploaded
                    </span>
                  </div>
                )}
                {/* Remove button — hidden while uploading */}
                {uploadProgress !== "uploading" && (
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center
                               justify-center border-0 cursor-pointer text-white font-medium"
                    style={{ fontSize: 18, lineHeight: 1 }}
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            {/* Media row — Add Photo | Add Video */}
            {!postImagePreview && (
              <div className="flex gap-2.5 mb-4">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-2xl cursor-pointer flex items-center justify-center gap-1.5
                             border-0 font-sans transition-all"
                  style={{
                    background: "#EDE8DF",
                    border: "1.5px dashed rgba(180,155,120,0.35)",
                  }}
                >
                  <Plus size={14} color={CHAMP} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: CHAMP }}
                  >
                    Add Photo
                  </span>
                </button>
                {/* <button
                  className="flex-1 py-3.5 rounded-2xl cursor-pointer flex items-center justify-center gap-1.5
                                   border-0 font-sans transition-all"
                  style={{
                    background: "#EDE8DF",
                    border: "1.5px dashed rgba(180,155,120,0.35)",
                  }}
                >
                  <Plus size={14} color={SAGE} />
                  <span className="text-xs font-medium" style={{ color: SAGE }}>
                    Add Video
                  </span>
                </button> */}
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Tags */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl mb-4"
              style={{ background: "#EDE8DF" }}
            >
              <Hash size={14} className="text-muted" />
              <input
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                placeholder="Add tags — week15, nutrition, movement…"
                className="flex-1 bg-transparent border-0 outline-none text-sm text-secondary
                           font-sans placeholder:text-muted"
              />
            </div>

            {/* Privacy note */}
            <p className="text-xs text-muted leading-relaxed text-center font-serif italic">
              Your post is shared only within your selected community.
              <br />
              Always kind. Always private.
            </p>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
