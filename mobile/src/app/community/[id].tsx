import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Heart, Send } from "lucide-react-native";

import { useAppStore } from "@/store/app";
import { getPost, getComments, createComment, likePost } from "@/lib/data";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const MUTED = "#9A9094";
const GRAD = ["#C9A24D", "#7A9A78", "#9878B0", "#A87888", "#688C84"];

function timeAgo(ts?: number) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(id?: string) {
  if (!id) return "U";
  return id.slice(0, 2).toUpperCase();
}

interface BComment {
  _id: string;
  content: string;
  author?: string;
  "Created Date"?: number;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAppStore();
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<BComment[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([getPost(id), getComments(id)]);
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
      await createComment(id, text);
      setComments((c) => [
        ...c,
        { _id: Date.now().toString(), content: text, author: profile?._id, "Created Date": Date.now() },
      ]);
      const updated = await getComments(id);
      setComments(updated);
    } catch {
    } finally {
      setSending(false);
    }
  }

  async function handleLike() {
    setLiked((v) => !v);
    try {
      await likePost(id);
    } catch {}
  }

  if (loading) return <LoadingScreen message="Loading post…" />;

  return (
    <KeyboardAvoidingView className="flex-1 bg-bg" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View className="flex-row items-center gap-3 px-5 py-4 border-b border-border">
        <Pressable onPress={() => router.push("/community")} className="flex-row items-center gap-1">
          <ChevronLeft size={20} color="#7B7268" />
          <Text className="text-sm text-secondary">Back</Text>
        </Pressable>
        <Text className="text-sm font-semibold text-primary flex-1 text-center">Post</Text>
        <View className="w-16" />
      </View>

      <ScrollView className="flex-1">
        {post && (
          <View className="px-5 pt-4 mb-4">
            <View className="bg-card border border-border rounded-3xl p-4">
              <View className="flex-row items-center gap-2.5 mb-3">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: GRAD[0] }}>
                  <Text className="text-xs font-bold text-white">{getInitials(post.author)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-primary">Community Member</Text>
                  <Text className="text-2xs text-muted">{timeAgo(post["Created Date"])}</Text>
                </View>
              </View>
              <Text className="text-sm text-primary leading-relaxed mb-4">{post.content}</Text>
              <View className="flex-row items-center gap-3 pt-3 border-t border-border">
                <Pressable onPress={handleLike} className="flex-row items-center gap-1.5">
                  <Heart size={16} color={liked ? "#E57373" : MUTED} fill={liked ? "#E57373" : "none"} />
                  <Text className="text-xs text-muted">{(post.likes || 0) + (liked ? 1 : 0)}</Text>
                </Pressable>
                <Text className="text-xs text-muted">
                  {comments.length} {comments.length === 1 ? "reply" : "replies"}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="px-5">
          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
            {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
          </Text>
          <View className="gap-2.5 mb-6">
            {comments.length === 0 ? (
              <Text className="text-sm text-muted text-center py-6">No replies yet. Be the first to respond.</Text>
            ) : (
              comments.map((c, i) => (
                <View key={c._id} className="bg-card border border-border rounded-2xl p-3.5">
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: GRAD[(i + 1) % GRAD.length] }}>
                      <Text className="text-2xs font-bold text-white">{getInitials(c.author)}</Text>
                    </View>
                    <Text className="text-xs font-semibold text-primary">
                      {c.author === profile?._id ? "You" : "Community Member"}
                    </Text>
                    <Text className="text-2xs text-muted ml-auto">{timeAgo(c["Created Date"])}</Text>
                  </View>
                  <Text className="text-sm text-primary leading-relaxed pl-9">{c.content}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View className="bg-card border-t border-border px-5 py-3">
        <View className="flex-row gap-2.5 items-center">
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Write a reply…"
            className="flex-1 bg-section border border-border rounded-pill px-4 py-2.5 text-sm text-primary"
          />
          <Pressable
            onPress={handleReply}
            disabled={!reply.trim() || sending}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: reply.trim() && !sending ? GOLD : "#EDE8DF" }}
          >
            <Send size={15} color={reply.trim() && !sending ? "#fff" : MUTED} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
