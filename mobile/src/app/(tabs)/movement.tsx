import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Sparkles, Activity, Wind, Leaf, Clock, ChevronRight } from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { createMovement, getMovementPractices } from "@/lib/data";
import { triggerGenerateMovement } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const LAVENDER = "#8B85C1";
const MUTED = "#9A9094";

interface Exercise {
  name: string;
  sets?: string;
  duration?: string;
}
interface Practice {
  _id?: string;
  practice_id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  exercises_json: Exercise[];
  why: string;
  guidance?: string;
}

function categoryColor(cat: string) {
  if (cat === "Moderate") return GOLD;
  if (cat === "Restorative") return LAVENDER;
  return SUCCESS;
}

function categoryBg(cat: string) {
  if (cat === "Moderate") return "rgba(212,176,106,0.1)";
  if (cat === "Restorative") return "rgba(139,133,193,0.1)";
  return "rgba(31,122,90,0.1)";
}

function PracticeIcon({ category, color }: { category: string; color: string }) {
  if (category === "Restorative") return <Wind size={20} color={color} />;
  if (category === "Moderate") return <Leaf size={20} color={color} />;
  return <Activity size={20} color={color} />;
}

function matchPractice(movementText: string, practices: Practice[]) {
  if (!movementText || !practices.length) return null;
  const lower = movementText.toLowerCase();
  return (
    practices.find(
      (p) => lower.includes(p.title.toLowerCase().split(" ")[0]) || lower.includes(p.category.toLowerCase()),
    ) ?? practices[0]
  );
}

export default function MovementScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || !protocol?._id) return;
    if (hasGenerated.current) return;

    let cancelled = false;

    async function load() {
      try {
        const existing = await getMovementPractices(protocol!._id);
        if (existing.length > 0) {
          if (!cancelled) {
            setPractices(parsePractices(existing));
            setLoadingPractices(false);
          }
          return;
        }

        hasGenerated.current = true;
        setGenerating(true);

        const parsed = await triggerGenerateMovement();
        const aiPractices = parsed.practices || [];

        await Promise.all(
          aiPractices.map((p: any) =>
            createMovement({
              protocol: protocol!._id,
              practice_id: p.practice_id,
              title: p.title,
              subtitle: p.subtitle,
              duration: p.duration,
              category: p.category,
              exercises_json: JSON.stringify(p.exercises || []),
              why: p.why,
              guidance: p.guidance || "",
            }),
          ),
        );

        const saved = await getMovementPractices(protocol!._id);

        if (!cancelled) {
          setPractices(parsePractices(saved));
          setLoadingPractices(false);
          setGenerating(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadingPractices(false);
          setGenerating(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile, protocol?._id]);

  function parsePractices(raw: any): Practice[] {
    const arr = Array.isArray(raw) ? raw : Object.values(raw);
    return arr.map((p: any) => ({
      ...p,
      exercises_json: typeof p.exercises_json === "string" ? JSON.parse(p.exercises_json || "[]") : (p.exercises_json ?? []),
    }));
  }

  if (!profile || loading) return <LoadingScreen message="Loading movement plan..." />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const aiMove = protocol?.movement ?? "";
  const matched = matchPractice(aiMove, practices);

  const sorted = matched ? [matched, ...practices.filter((p) => p._id !== matched._id)] : practices;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="px-6 pt-6">
        <Text className="text-4xl font-medium text-primary tracking-tight mb-2">Movement</Text>
        <Text className="font-serif italic text-md text-secondary leading-relaxed">
          {jt === "currently_pregnant"
            ? "Movement that supports you and your baby"
            : jt === "postpartum"
              ? "Gentle restoration and healing movement"
              : "Movement that supports fertility and hormonal balance"}
        </Text>
      </View>

      {aiMove && (
        <View className="px-6 mt-5">
          <View
            className="rounded-3xl p-4 flex-row items-start gap-3.5"
            style={{ backgroundColor: "rgba(212,176,106,0.09)", borderWidth: 1, borderColor: "rgba(212,176,106,0.28)" }}
          >
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(212,176,106,0.18)" }}
            >
              <Sparkles size={17} color={GOLD} />
            </View>
            <View className="flex-1">
              <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
                Today's AI recommendation
              </Text>
              <Text className="text-md font-medium text-primary font-serif italic leading-snug">{aiMove}</Text>
            </View>
          </View>
        </View>
      )}

      {protocol?.avoid_today && (
        <View className="px-6 mt-3">
          <View
            className="flex-row items-start gap-2 px-3.5 py-2.5 rounded-2xl"
            style={{ backgroundColor: "rgba(194,107,46,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(194,107,46,0.3)" }}
          >
            <Text className="text-warning text-xs">⚠</Text>
            <Text className="text-sm leading-snug flex-1" style={{ color: "#C26B2E" }}>
              <Text className="font-bold">Avoid today: </Text>
              {protocol.avoid_today}
            </Text>
          </View>
        </View>
      )}

      <View className="px-6 mt-5">
        <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          Today's Practices
        </Text>

        {loadingPractices ? (
          <View className="bg-card rounded-3xl p-6 border border-border items-center">
            <Text className="text-base text-muted">
              {generating ? "Generating your personalized movement plan…" : "Loading practices…"}
            </Text>
            <Text className="text-2xs text-muted mt-1">This takes about 15–20 seconds</Text>
          </View>
        ) : sorted.length === 0 ? (
          <View className="bg-card rounded-3xl p-6 border border-border items-center">
            <Text className="text-base text-muted">No practices generated yet.</Text>
            <Text className="text-2xs text-muted mt-1">Check back after your protocol refreshes.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {sorted.map((p) => {
              const isRec = matched?._id === p._id;
              const color = categoryColor(p.category);
              const bg = categoryBg(p.category);
              const isExpanded = expanded === p._id;

              return (
                <View
                  key={p._id || p.practice_id}
                  className="bg-card rounded-3xl overflow-hidden"
                  style={{ borderWidth: 1, borderColor: isRec ? "rgba(212,176,106,0.45)" : "rgba(180,155,120,0.18)" }}
                >
                  <Pressable
                    onPress={() => setExpanded((e) => (e === p._id ? null : (p._id ?? null)))}
                    className="px-5 py-4"
                  >
                    <View className="flex-row items-center gap-3.5">
                      <View
                        className="w-11 h-11 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: bg }}
                      >
                        <PracticeIcon category={p.category} color={color} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-0.5 flex-wrap">
                          <Text className="text-lg font-semibold text-primary">{p.title}</Text>
                          {isRec && (
                            <Text
                              className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                              style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
                            >
                              Today
                            </Text>
                          )}
                        </View>
                        <Text className="text-2xs text-muted mb-1.5">{p.subtitle}</Text>
                        <View className="flex-row items-center gap-2">
                          <Clock size={11} color={MUTED} />
                          <Text className="text-2xs text-muted">{p.duration}</Text>
                          <Text
                            className="text-2xs font-semibold px-2 py-0.5 rounded-pill"
                            style={{ color, backgroundColor: bg }}
                          >
                            {p.category}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight
                        size={17}
                        color={MUTED}
                        style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
                      />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View className="border-t border-border p-5">
                      <View
                        className="px-3.5 py-3 rounded-2xl mb-4"
                        style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
                      >
                        <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                          Why this matters
                        </Text>
                        <Text className="text-sm text-secondary leading-relaxed font-serif italic">{p.why}</Text>
                      </View>

                      {p.exercises_json.length > 0 && (
                        <>
                          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
                            Sequence
                          </Text>
                          <View className="gap-2.5">
                            {p.exercises_json.map((ex, i) => (
                              <View
                                key={i}
                                className="flex-row items-center justify-between px-3.5 py-3 bg-section rounded-xl"
                              >
                                <View className="flex-row items-center gap-2.5">
                                  <View
                                    className="w-6 h-6 rounded-full items-center justify-center"
                                    style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
                                  >
                                    <Text className="text-2xs text-gold font-bold">{i + 1}</Text>
                                  </View>
                                  <Text className="text-base text-primary font-medium">{ex.name}</Text>
                                </View>
                                <Text className="text-2xs text-muted font-medium">{ex.sets || ex.duration}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {p.guidance && (
                        <View
                          className="mt-3.5 flex-row items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{ backgroundColor: "rgba(194,107,46,0.07)", borderWidth: 1, borderColor: "rgba(194,107,46,0.15)" }}
                        >
                          <Text className="text-xs" style={{ color: "#C26B2E" }}>⚠</Text>
                          <Text className="text-sm leading-relaxed flex-1" style={{ color: "#C26B2E" }}>
                            {p.guidance}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
