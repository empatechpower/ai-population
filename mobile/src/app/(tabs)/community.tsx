import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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
  Sparkles,
} from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
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
import { uploadImage } from "@/lib/cloudinary";
import LoadingScreen from "@/components/shared/LoadingScreen";

type Tab = "feed" | "groups" | "chat";

const CHAMP = "#C9A24D";
const SAGE = "#A8B9A5";
const SUCCESS = "#1F7A5A";
const MUTED = "#9A9094";

const GRAD = ["#C9A24D", "#7A9A78", "#9878B0", "#A87888", "#688C84"];

const FEED_FILTERS = ["My Groups", "Nutrition", "Movement", "Wellness", "Support"];

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
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CommunityScreen() {
  useProfile();
  const { profile } = useAppStore();

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

  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postImage, setPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [chatGroup, setChatGroup] = useState<BGroup | null>(null);
  const [chatMessages, setChatMessages] = useState<BMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile) return;
    loadGroups();
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    loadFeed();
  }, [profile, selectedGroup]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
      const data = selectedGroup ? await getGroupPosts(selectedGroup._id) : await getPosts();
      setPosts(data);
    } catch {
    } finally {
      setLoadingPosts(false);
    }
  }

  async function openGroupChat(g: BGroup) {
    setChatGroup(g);
    const msgs = await getGroupMessages(g._id);
    setChatMessages(msgs);
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

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadError(null);
      setUploadProgress("idle");
      setPostImage(result.assets[0]);
    }
  }

  function removeImage() {
    setPostImage(null);
    setUploadProgress("idle");
    setUploadError(null);
  }

  async function handlePost() {
    if (!newPostText.trim() || posting) return;
    setPosting(true);
    setUploadError(null);

    try {
      let imageUrl = "";
      if (postImage) {
        setUploadProgress("uploading");
        try {
          const result = await uploadImage({
            uri: postImage.uri,
            name: postImage.fileName ?? "upload.jpg",
            mimeType: postImage.mimeType ?? "image/jpeg",
          });
          imageUrl = result.secure_url;
          setUploadProgress("done");
        } catch (err: any) {
          setUploadProgress("error");
          setUploadError(err?.message ?? "Image upload failed. Post without image?");
          setPosting(false);
          return;
        }
      }

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

  // ── Chat overlay ──────────────────────────────────────────
  if (chatGroup) {
    return (
      <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-4 py-3.5 bg-card border-b border-border flex-row items-center gap-3">
          <Pressable onPress={closeChat}>
            <ChevronLeft size={22} color="#1A1816" />
          </Pressable>
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: GRAD[0] }}
          >
            <Text className="text-xs font-bold text-white">{groupInitials(chatGroup.name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-primary">{chatGroup.name}</Text>
            <View className="flex-row items-center gap-1.5">
              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SUCCESS }} />
              <Text className="text-2xs text-muted">{chatGroup.member_count ?? 0} members</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4" contentContainerClassName="gap-3">
          {chatMessages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-sm text-muted">No messages yet.</Text>
              <Text className="text-2xs text-muted mt-1">Be the first to say hello!</Text>
            </View>
          ) : (
            chatMessages.map((msg, i) => {
              const isMe = msg.sender === profile?._id;
              const showLabel = !isMe && (i === 0 || chatMessages[i - 1]?.sender !== msg.sender);
              return (
                <View key={msg._id} style={{ alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showLabel && (
                    <View className="flex-row items-center gap-1.5 mb-1 ml-1">
                      <View className="w-5 h-5 rounded-lg items-center justify-center" style={{ backgroundColor: `${CHAMP}22` }}>
                        <Text className="text-2xs font-bold" style={{ color: CHAMP }}>
                          {(msg.sender_name || "U").slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-2xs font-semibold text-secondary">{msg.sender_name || "Member"}</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "80%" }}>
                    <View
                      className="px-4 py-2.5"
                      style={{
                        backgroundColor: isMe ? `${SAGE}25` : "#F9F6F1",
                        borderWidth: 1,
                        borderColor: isMe ? `${SAGE}35` : "rgba(180,155,120,0.15)",
                        borderRadius: 20,
                      }}
                    >
                      <Text className="text-sm text-primary leading-relaxed">{msg.content}</Text>
                    </View>
                    <Text className={`text-2xs text-muted mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                      {timeAgo(msg["Created Date"])}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View className="px-3.5 py-2.5 bg-card border-t border-border flex-row items-end gap-2.5">
          <View className="flex-1 rounded-pill px-4 py-2.5 border border-border" style={{ backgroundColor: "#EDE8DF" }}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Write something supportive…"
              className="text-sm text-primary"
            />
          </View>
          <Pressable
            onPress={handleSendMsg}
            disabled={!chatInput.trim() || sendingMsg}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: chatInput.trim() ? CHAMP : "#EDE8DF",
              borderWidth: 1.5,
              borderColor: chatInput.trim() ? CHAMP : "rgba(180,155,120,0.18)",
            }}
          >
            <Send size={15} color={chatInput.trim() ? "#FFF8EE" : MUTED} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── New post overlay ──────────────────────────────────────
  if (showNewPost) {
    const canShare = newPostText.trim() && !posting && uploadProgress !== "uploading";
    return (
      <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 py-4 bg-card border-b border-border flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              setShowNewPost(false);
              setNewPostText("");
              setPostTags("");
              removeImage();
            }}
          >
            <Text className="text-sm text-muted">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-primary">New Post</Text>
          <Pressable
            onPress={handlePost}
            disabled={!canShare}
            className="flex-row items-center gap-1.5 px-4 py-2 rounded-pill"
            style={{ backgroundColor: canShare ? CHAMP : "#EDE8DF" }}
          >
            {posted ? (
              <>
                <Check size={13} color={SUCCESS} />
                <Text style={{ color: SUCCESS }}>Shared!</Text>
              </>
            ) : (
              <Text style={{ color: canShare ? "#FFF8EE" : MUTED }}>
                {uploadProgress === "uploading" ? "Uploading…" : posting ? "Sharing…" : "Share"}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-5">
          <View className="flex-row items-center gap-2.5 mb-5">
            <View
              className="w-10 h-10 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${SAGE}22`, borderWidth: 1.5, borderColor: `${SAGE}33` }}
            >
              <Text className="text-sm font-bold" style={{ color: SAGE }}>
                {(profile.first_name || "Me").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="text-sm font-semibold text-primary">{profile.first_name || "You"}</Text>
              <Text className="text-2xs text-muted">
                {selectedGroup ? `Posting to ${selectedGroup.name}` : "Posting to community"}
              </Text>
            </View>
          </View>

          <TextInput
            value={newPostText}
            onChangeText={setNewPostText}
            placeholder="Share a tip, a question, or a moment with your circle…"
            maxLength={1000}
            multiline
            className="text-sm text-primary font-serif leading-relaxed"
            style={{ minHeight: 130, textAlignVertical: "top" }}
          />
          <Text className="text-2xs text-muted text-right mb-4">{newPostText.length}/1000</Text>

          {uploadError && (
            <View
              className="flex-row items-start gap-2 px-3.5 py-3 rounded-2xl mb-4"
              style={{ backgroundColor: "rgba(194,107,46,0.08)", borderWidth: 1, borderColor: "rgba(194,107,46,0.2)" }}
            >
              <Text className="text-warning text-xs">⚠</Text>
              <View className="flex-1">
                <Text className="text-xs text-warning leading-relaxed">{uploadError}</Text>
                <Pressable onPress={removeImage}>
                  <Text className="text-2xs font-semibold text-warning mt-1 underline">
                    Remove image and post without it
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {postImage && (
            <View className="relative mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: postImage.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              {uploadProgress === "uploading" && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center gap-2">
                  <ActivityIndicator color="#fff" />
                  <Text className="text-xs text-white font-medium">Uploading…</Text>
                </View>
              )}
              {uploadProgress === "done" && (
                <View
                  className="absolute top-2 left-2 flex-row items-center gap-1 px-2 py-1 rounded-pill"
                  style={{ backgroundColor: "rgba(31,122,90,0.85)" }}
                >
                  <Check size={10} color="#fff" />
                  <Text className="text-2xs text-white font-semibold">Uploaded</Text>
                </View>
              )}
              {uploadProgress !== "uploading" && (
                <Pressable
                  onPress={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 items-center justify-center"
                >
                  <Text className="text-white text-lg">×</Text>
                </Pressable>
              )}
            </View>
          )}

          {!postImage && (
            <Pressable
              onPress={handlePickImage}
              className="py-3.5 rounded-2xl items-center justify-center flex-row gap-1.5 mb-4"
              style={{ backgroundColor: "#EDE8DF", borderWidth: 1.5, borderColor: "rgba(180,155,120,0.35)", borderStyle: "dashed" }}
            >
              <Plus size={14} color={CHAMP} />
              <Text className="text-xs font-medium" style={{ color: CHAMP }}>Add Photo</Text>
            </Pressable>
          )}

          <View className="flex-row items-center gap-2.5 px-3.5 py-3 rounded-2xl mb-4" style={{ backgroundColor: "#EDE8DF" }}>
            <Hash size={14} color={MUTED} />
            <TextInput
              value={postTags}
              onChangeText={setPostTags}
              placeholder="Add tags — week15, nutrition, movement…"
              className="flex-1 text-sm text-secondary"
            />
          </View>

          <Text className="text-xs text-muted leading-relaxed text-center font-serif italic">
            Your post is shared only within your selected community.{"\n"}Always kind. Always private.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Main tabs ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-bg">
      <View className="px-5 pt-5 flex-row items-start justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-section border border-border items-center justify-center">
            <Users size={18} color={MUTED} />
          </View>
          <View>
            <Text className="text-xl font-semibold text-primary tracking-tight leading-tight">Community</Text>
            <Text className="text-2xs text-muted font-serif italic mt-0.5">Connect with women at your stage</Text>
          </View>
        </View>
        <View className="w-10 h-10 rounded-full bg-section border border-border items-center justify-center">
          <Search size={17} color={MUTED} />
        </View>
      </View>

      <View className="px-5 pt-4">
        <View className="flex-row rounded-pill p-1 gap-0.5" style={{ backgroundColor: "#EDE8DF" }}>
          {(["feed", "groups", "chat"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="flex-1 py-2.5 rounded-pill items-center"
              style={{ backgroundColor: tab === t ? CHAMP : "transparent" }}
            >
              <Text
                className="text-sm font-medium capitalize"
                style={{ color: tab === t ? "#fff" : "#7B7268" }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "feed" && (
        <ScrollView contentContainerClassName="pb-24">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 pt-4">
            {FEED_FILTERS.map((f) => {
              const active = activeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  className="px-4 py-1.5 rounded-pill"
                  style={{
                    backgroundColor: active ? `${SAGE}22` : "#EDE8DF",
                    borderWidth: 1.5,
                    borderColor: active ? `${SAGE}55` : "rgba(180,155,120,0.18)",
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: active ? "#3D5C3A" : "#7B7268" }}>
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-5">
            <View className="flex-row items-center justify-between px-5 mb-3.5">
              <Text className="text-base font-semibold text-primary tracking-tight">Your Communities</Text>
              <Pressable onPress={() => setTab("chat")} className="flex-row items-center gap-1">
                <Text className="text-xs text-muted">See All</Text>
                <ChevronRight size={12} color={MUTED} />
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-5">
              {myGroups.map((g, i) => (
                <Pressable key={g._id} onPress={() => openGroupChat(g)} className="items-center gap-1.5" style={{ width: 72 }}>
                  <View className="w-14 h-14 rounded-[18px] items-center justify-center" style={{ backgroundColor: GRAD[i % GRAD.length] }}>
                    <Text className="text-sm font-bold text-white">{groupInitials(g.name)}</Text>
                  </View>
                  <Text className="text-2xs text-secondary text-center leading-tight" numberOfLines={2}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setTab("groups")} className="items-center gap-1.5" style={{ width: 72 }}>
                <View
                  className="w-14 h-14 rounded-[18px] bg-section items-center justify-center"
                  style={{ borderWidth: 2, borderColor: "rgba(180,155,120,0.3)", borderStyle: "dashed" }}
                >
                  <Plus size={18} color={MUTED} />
                </View>
                <Text className="text-2xs text-muted text-center">Discover</Text>
              </Pressable>
            </ScrollView>
          </View>

          <View className="px-5 mt-5">
            <View className="bg-card rounded-[20px] p-4 border border-border" style={{ borderLeftWidth: 3, borderLeftColor: CHAMP }}>
              <View className="flex-row items-center gap-1.5 mb-1.5">
                <Sparkles size={12} color={CHAMP} />
                <Text className="text-2xs font-semibold uppercase tracking-wider" style={{ color: CHAMP }}>
                  Today's Topic
                </Text>
              </View>
              <Text className="text-base font-semibold text-primary tracking-tight mb-1">
                {selectedGroup?.name ? `What's on your mind in ${selectedGroup.name}?` : "Managing Fatigue This Week"}
              </Text>
              <Text className="text-sm text-secondary leading-relaxed font-serif italic">
                Rest, hydration, and gentle movement are your most powerful allies today.
              </Text>
            </View>
          </View>

          {myGroups.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 mt-4">
              <Pressable
                onPress={() => setSelectedGroup(null)}
                className="px-3.5 py-1.5 rounded-pill"
                style={{ backgroundColor: !selectedGroup ? CHAMP : "transparent", borderWidth: 1, borderColor: !selectedGroup ? CHAMP : "rgba(180,155,120,0.18)" }}
              >
                <Text className="text-xs font-semibold" style={{ color: !selectedGroup ? "#fff" : "#7B7268" }}>All</Text>
              </Pressable>
              {myGroups.map((g) => (
                <Pressable
                  key={g._id}
                  onPress={() => setSelectedGroup(g)}
                  className="px-3.5 py-1.5 rounded-pill"
                  style={{
                    backgroundColor: selectedGroup?._id === g._id ? CHAMP : "transparent",
                    borderWidth: 1,
                    borderColor: selectedGroup?._id === g._id ? CHAMP : "rgba(180,155,120,0.18)",
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: selectedGroup?._id === g._id ? "#fff" : "#7B7268" }}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View className="px-5 mt-5">
            <Text className="text-base font-semibold text-primary tracking-tight mb-4">Recent Conversations</Text>
            {loadingPosts ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#D4B06A" />
                <Text className="text-sm text-muted mt-2">Loading posts…</Text>
              </View>
            ) : posts.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-sm text-muted mb-2">No posts yet.</Text>
                {myGroups.length === 0 && (
                  <Pressable onPress={() => setTab("groups")}>
                    <Text className="text-xs font-semibold" style={{ color: CHAMP }}>Join a group to see posts →</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              posts.map((post, i) => (
                <View key={post._id} className="bg-card rounded-[22px] overflow-hidden border border-border mb-3.5">
                  <View className="px-4.5 pt-4 pb-3 flex-row items-start gap-2.5">
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: `${GRAD[i % GRAD.length]}22`, borderWidth: 1.5, borderColor: `${CHAMP}33` }}
                    >
                      <Text className="text-xs font-bold" style={{ color: CHAMP }}>
                        {(post.author_name || "U").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-sm font-semibold text-primary">{post.author_name || "Community Member"}</Text>
                        {post.group && myGroups.find((g) => g._id === post.group) && (
                          <Text className="text-2xs font-semibold px-2 py-0.5 rounded-pill" style={{ color: SAGE, backgroundColor: `${SAGE}18` }}>
                            {myGroups.find((g) => g._id === post.group)?.name}
                          </Text>
                        )}
                      </View>
                      <Text className="text-2xs text-muted mt-0.5">{timeAgo(post["Created Date"])}</Text>
                    </View>
                    <MoreHorizontal size={17} color={MUTED} />
                  </View>

                  <Pressable onPress={() => router.push(`/community/${post._id}`)} className="px-4.5 pb-3">
                    <Text className="text-sm text-secondary leading-relaxed">{post.content}</Text>
                  </Pressable>

                  {post.Image && (
                    <View className="mx-3.5 mb-3.5 rounded-2xl overflow-hidden" style={{ height: 200 }}>
                      <Image source={{ uri: post.Image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    </View>
                  )}

                  <View className="px-4.5 pb-4 pt-3 flex-row items-center gap-5 border-t border-border">
                    <Pressable onPress={() => handleLike(post._id)} className="flex-row items-center gap-1.5">
                      <Heart size={16} color={likedIds.has(post._id) ? "#C9A0A0" : MUTED} fill={likedIds.has(post._id) ? "#C9A0A0" : "none"} />
                      <Text className="text-xs" style={{ color: likedIds.has(post._id) ? "#C9A0A0" : MUTED }}>
                        {(post.likes || 0) + (likedIds.has(post._id) ? 1 : 0)} Support
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => router.push(`/community/${post._id}`)}>
                      <MessageCircle size={16} color={MUTED} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setSavedIds((s) => {
                          const n = new Set(s);
                          n.has(post._id) ? n.delete(post._id) : n.add(post._id);
                          return n;
                        })
                      }
                      className="ml-auto"
                    >
                      <Bookmark size={16} color={savedIds.has(post._id) ? CHAMP : MUTED} fill={savedIds.has(post._id) ? CHAMP : "none"} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {tab === "groups" && (
        <ScrollView className="px-5 pt-4" contentContainerClassName="pb-24">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-0.5 mb-5">
            {["All", "City", "Month", "Wellness"].map((f) => (
              <Pressable
                key={f}
                onPress={() => setGroupFilter(f)}
                className="px-4 py-1.5 rounded-pill"
                style={{
                  backgroundColor: groupFilter === f ? `${CHAMP}18` : "#EDE8DF",
                  borderWidth: 1.5,
                  borderColor: groupFilter === f ? `${CHAMP}55` : "rgba(180,155,120,0.18)",
                }}
              >
                <Text className="text-xs font-medium" style={{ color: groupFilter === f ? CHAMP : "#7B7268" }}>{f}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {loadingGroups ? (
            <ActivityIndicator color="#D4B06A" />
          ) : (
            <View className="bg-card rounded-[22px] border border-border overflow-hidden">
              {(groupFilter === "All" ? allGroups : allGroups.filter((g) => g.category?.toLowerCase() === groupFilter.toLowerCase())).map(
                (g, idx, arr) => {
                  const joined = isMember(g);
                  return (
                    <View
                      key={g._id}
                      className="flex-row items-center gap-3.5 px-4.5 py-3.5"
                      style={{ borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}
                    >
                      <View className="rounded-full items-center justify-center" style={{ width: 52, height: 52, backgroundColor: GRAD[idx % GRAD.length] }}>
                        <Text className="text-sm font-bold text-white">{groupInitials(g.name)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-primary" numberOfLines={1}>{g.name}</Text>
                        <Text className="text-2xs text-muted">
                          {g.member_count ?? 0} members{g.category ? ` · ${g.category}` : ""}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => (joined ? handleLeave(g) : handleJoin(g))}
                        disabled={joiningId === g._id}
                        className="flex-row items-center gap-1.5 px-4 py-2 rounded-pill"
                        style={{ backgroundColor: joined ? `${SAGE}18` : CHAMP }}
                      >
                        {joiningId === g._id ? (
                          <Text className="text-xs font-semibold" style={{ color: joined ? SAGE : "#FFF8EE" }}>…</Text>
                        ) : joined ? (
                          <>
                            <Check size={11} color={SAGE} />
                            <Text className="text-xs font-semibold" style={{ color: SAGE }}>Joined</Text>
                          </>
                        ) : (
                          <>
                            <Plus size={11} color="#FFF8EE" />
                            <Text className="text-xs font-semibold" style={{ color: "#FFF8EE" }}>Join</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  );
                },
              )}
            </View>
          )}
        </ScrollView>
      )}

      {tab === "chat" && (
        <ScrollView className="px-5 pt-4" contentContainerClassName="pb-24">
          <Text className="text-2xs text-muted font-serif italic mb-4">Your Conversations</Text>
          {loadingGroups ? (
            <ActivityIndicator color="#D4B06A" />
          ) : myGroups.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-sm text-muted mb-2">No chats yet.</Text>
              <Pressable onPress={() => setTab("groups")}>
                <Text className="text-xs font-semibold" style={{ color: CHAMP }}>Join a group to start chatting →</Text>
              </Pressable>
            </View>
          ) : (
            <View className="bg-card rounded-[22px] border border-border overflow-hidden">
              {myGroups.map((g, i) => (
                <Pressable
                  key={g._id}
                  onPress={() => openGroupChat(g)}
                  className="flex-row items-center gap-3.5 px-4.5 py-4"
                  style={{ borderBottomWidth: i < myGroups.length - 1 ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}
                >
                  <View className="rounded-full items-center justify-center" style={{ width: 48, height: 48, backgroundColor: GRAD[i % GRAD.length] }}>
                    <Text className="text-sm font-bold text-white">{groupInitials(g.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-primary">{g.name}</Text>
                    <Text className="text-2xs text-muted" numberOfLines={1}>{g.member_count ?? 0} members · Tap to open chat</Text>
                  </View>
                  <ChevronRight size={16} color={MUTED} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {tab === "feed" && (
        <Pressable
          onPress={() => setShowNewPost(true)}
          className="absolute bottom-5 right-5 w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: CHAMP }}
        >
          <Feather size={21} color="#FFF8EE" />
        </Pressable>
      )}
    </View>
  );
}
