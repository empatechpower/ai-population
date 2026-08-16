import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Check, Sparkles, ArrowRight, Leaf } from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { getJourneyPhases, getMilestones, createJourneyPhase, createMilestone } from "@/lib/data";
import { triggerGenerateJourney } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const MUTED = "#9A9094";

interface MilestoneRecord {
  _id: string;
  week_label: string;
  title: string;
  summary: string;
  status: string;
  what_happening: string;
  focus_goals: string;
  actions: string;
}
interface PhaseRecord {
  _id: string;
  phase_number: number;
  title: string;
  week_range: string;
  status: string;
  milestones?: MilestoneRecord[];
}

function safeParseArray(str: string): string[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

export default function JourneyProtocolScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();

  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || loading) return;
    if (hasGenerated.current) return;
    loadJourney();
  }, [profile, loading]);

  async function loadJourney() {
    try {
      const uid = getUserId() ?? profile!._id;
      const existingPhases = await getJourneyPhases();

      if (existingPhases.length > 0) {
        const withMilestones = await Promise.all(
          existingPhases.map(async (p: PhaseRecord) => ({ ...p, milestones: await getMilestones(p._id) })),
        );
        setPhases(withMilestones);
        const current = withMilestones.find((p) => p.status === "current");
        if (current) setExpandedPhase(current._id);
        setLoadingJourney(false);
        return;
      }

      hasGenerated.current = true;
      setGenerating(true);

      try {
        const parsed = await triggerGenerateJourney(uid);
        const aiPhases = parsed.phases || [];

        const createdPhases = await Promise.all(
          aiPhases.map(async (p: any) => {
            const phaseId = await createJourneyPhase({
              protocol: protocol?._id ?? "",
              phase_number: p.phase_number,
              title: p.title,
              week_range: p.week_range,
              status: p.status,
            });

            const milestones = await Promise.all(
              (p.milestones || []).map((m: any) =>
                createMilestone({
                  phase: phaseId,
                  week_label: m.week_label,
                  title: m.title,
                  summary: m.summary,
                  status: m.status,
                  what_happening: m.what_happening,
                  focus_goals: JSON.stringify(m.focus_goals || []),
                  actions: JSON.stringify(m.actions || []),
                }).then((mid) => ({
                  _id: mid,
                  week_label: m.week_label,
                  title: m.title,
                  summary: m.summary,
                  status: m.status,
                  what_happening: m.what_happening,
                  focus_goals: JSON.stringify(m.focus_goals || []),
                  actions: JSON.stringify(m.actions || []),
                })),
              ),
            );

            return {
              _id: phaseId,
              phase_number: p.phase_number,
              title: p.title,
              week_range: p.week_range,
              status: p.status,
              milestones,
            };
          }),
        );

        setPhases(createdPhases);
      } catch (parseErr) {
        console.error("Failed to parse journey AI response:", parseErr);
      }

      setLoadingJourney(false);
      setGenerating(false);
    } catch (err) {
      console.error(err);
      setLoadingJourney(false);
      setGenerating(false);
    }
  }

  if (!profile || loading) return <LoadingScreen message="Loading your roadmap…" />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const week = profile.current_week ?? 0;

  if (loadingJourney) {
    return (
      <LoadingScreen
        message={generating ? "Generating your personalized roadmap…" : "Loading your journey…"}
      />
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="px-6 pt-5">
        <Pressable onPress={() => router.push("/journey")} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={18} color={MUTED} />
          <Text className="text-sm text-muted">Back</Text>
        </Pressable>
        <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1.5">
          {jt === "trying_to_conceive" ? "Way to Baby" : jt === "currently_pregnant" ? "Pregnancy Roadmap" : "Recovery Journey"}
        </Text>
        <Text className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {jt === "trying_to_conceive" ? "Preparation Protocol" : jt === "currently_pregnant" ? `Week ${week} Protocol` : `Week ${week} Recovery`}
        </Text>
        <Text className="text-sm text-secondary leading-relaxed">
          AI-generated and personalized to your profile, job, and lifestyle.
        </Text>
      </View>

      {protocol?.fertility_tip && (
        <View className="px-6 mt-4">
          <View
            className="flex-row items-start gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
          >
            <Sparkles size={13} color={GOLD} />
            <Text className="text-sm text-secondary leading-relaxed font-serif italic flex-1">
              {protocol.fertility_tip}
            </Text>
          </View>
        </View>
      )}

      {phases.length === 0 ? (
        <View className="px-6 mt-8 items-center">
          <Text className="text-sm text-muted mb-2">No roadmap generated yet.</Text>
          <Pressable
            onPress={() => {
              hasGenerated.current = false;
              setLoadingJourney(true);
              loadJourney();
            }}
          >
            <Text className="text-sm font-semibold text-gold">Generate now →</Text>
          </Pressable>
        </View>
      ) : (
        <View className="px-6 mt-5 gap-3">
          {[...phases]
            .sort((a, b) => a.phase_number - b.phase_number)
            .map((phase) => {
              const isExpanded = expandedPhase === phase._id;
              const phaseColor = phase.status === "completed" ? SUCCESS : phase.status === "current" ? GOLD : MUTED;

              return (
                <View
                  key={phase._id}
                  className="bg-card rounded-[22px] overflow-hidden"
                  style={{
                    borderWidth: 1,
                    borderColor: phase.status === "current" ? "rgba(212,176,106,0.45)" : "rgba(180,155,120,0.18)",
                  }}
                >
                  <Pressable
                    onPress={() => setExpandedPhase(isExpanded ? null : phase._id)}
                    className="px-5 py-5"
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-9 h-9 rounded-full items-center justify-center"
                        style={{
                          backgroundColor:
                            phase.status === "completed"
                              ? `${SUCCESS}15`
                              : phase.status === "current"
                                ? "rgba(212,176,106,0.15)"
                                : "#EDE8DF",
                          borderWidth: 2,
                          borderColor: phaseColor,
                        }}
                      >
                        {phase.status === "completed" ? (
                          <Check size={16} color={SUCCESS} />
                        ) : (
                          <Text className="text-sm font-bold" style={{ color: phaseColor }}>
                            {phase.phase_number}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-0.5 flex-wrap">
                          <Text className="text-base font-semibold text-primary">{phase.title}</Text>
                          {phase.status === "current" && (
                            <Text
                              className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                              style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
                            >
                              Active
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs text-muted">
                          {phase.week_range}
                          {phase.milestones ? ` · ${phase.milestones.length} milestone${phase.milestones.length !== 1 ? "s" : ""}` : ""}
                        </Text>
                      </View>
                      <ChevronRight
                        size={17}
                        color={MUTED}
                        style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}
                      />
                    </View>
                  </Pressable>

                  {isExpanded && phase.milestones && (
                    <View className="border-t border-border px-4 py-3 gap-2.5">
                      {phase.milestones.map((ms) => {
                        const msExpanded = expandedMilestone === ms._id;
                        const msColor = ms.status === "completed" ? SUCCESS : ms.status === "current" ? GOLD : MUTED;
                        const focusGoals = safeParseArray(ms.focus_goals);
                        const actions = safeParseArray(ms.actions);

                        return (
                          <View
                            key={ms._id}
                            className="bg-elevated rounded-[18px] overflow-hidden px-3 pb-3"
                            style={{
                              borderWidth: 1,
                              borderColor: ms.status === "current" ? "rgba(212,176,106,0.3)" : "rgba(180,155,120,0.15)",
                            }}
                          >
                            <Pressable
                              onPress={() => setExpandedMilestone(msExpanded ? null : ms._id)}
                              className="px-1 py-4"
                            >
                              <View className="flex-row items-start gap-2.5">
                                <View
                                  className="w-5 h-5 rounded-full items-center justify-center mt-0.5"
                                  style={{
                                    backgroundColor:
                                      ms.status === "completed" ? SUCCESS : ms.status === "current" ? GOLD : "#EDE8DF",
                                    borderWidth: 1.5,
                                    borderColor: msColor,
                                  }}
                                >
                                  {ms.status === "completed" ? (
                                    <Check size={10} color="#fff" strokeWidth={2.5} />
                                  ) : (
                                    <View
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: ms.status === "current" ? "#fff" : MUTED }}
                                    />
                                  )}
                                </View>
                                <View className="flex-1">
                                  <View className="flex-row items-center gap-2 mb-0.5 flex-wrap">
                                    <Text className="text-sm font-semibold text-primary">{ms.title}</Text>
                                    <Text className="text-2xs text-muted bg-section px-2 py-0.5 rounded-pill">
                                      {ms.week_label}
                                    </Text>
                                  </View>
                                  <Text className="text-xs text-muted leading-snug">{ms.summary}</Text>
                                </View>
                                <ChevronRight
                                  size={14}
                                  color={MUTED}
                                  style={{ transform: [{ rotate: msExpanded ? "90deg" : "0deg" }] }}
                                />
                              </View>
                            </Pressable>

                            {msExpanded && (
                              <View className="px-1 pb-1">
                                <View className="border-t border-border pt-3.5 mb-3.5">
                                  <Text className="text-sm text-secondary leading-relaxed font-serif italic">
                                    {ms.what_happening}
                                  </Text>
                                </View>
                                {focusGoals.length > 0 && (
                                  <>
                                    <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2.5">
                                      Focus Goals
                                    </Text>
                                    <View className="gap-1.5 mb-3.5">
                                      {focusGoals.map((g, i) => (
                                        <View key={i} className="flex-row items-center gap-2">
                                          <Leaf size={10} color={GOLD} />
                                          <Text className="text-sm text-secondary flex-1">{g}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </>
                                )}
                                {actions.length > 0 && (
                                  <>
                                    <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2.5">
                                      Actions
                                    </Text>
                                    <View className="gap-1.5">
                                      {actions.map((a, i) => (
                                        <View
                                          key={i}
                                          className="flex-row items-center gap-2 px-3 py-2 bg-section rounded-xl"
                                        >
                                          <ArrowRight size={11} color={SUCCESS} />
                                          <Text className="text-sm text-primary flex-1">{a}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </>
                                )}
                                <Pressable
                                  onPress={() => router.push(`/journey/protocol/${ms._id}`)}
                                  className="mt-3.5 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl"
                                  style={{ backgroundColor: "rgba(212,176,106,0.08)", borderWidth: 1, borderColor: "rgba(212,176,106,0.25)" }}
                                >
                                  <Text className="text-xs font-semibold text-gold">View full milestone</Text>
                                  <ArrowRight size={12} color={GOLD} />
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      )}
    </ScrollView>
  );
}
