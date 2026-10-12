import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Sun,
  Moon,
  MoonStar,
  Utensils,
  Heart,
  Baby,
  Bookmark,
  ChevronRight,
  BookOpen,
  Calendar,
} from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
import { getSunnahDailyGuide, updateProfile } from "@/lib/data";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const BLUE = "#4A90C4";
const SAGE = "#A8B9A5";
const MUTED = "#9A9094";

const SECTION_META: Record<
  string,
  { label: string; icon: (c: string) => React.ReactNode; color: string; bg: string; timelineLabel: string }
> = {
  morning: { label: "Morning", icon: (c) => <Sun size={20} color={c} />, color: BLUE, bg: "rgba(74,144,196,0.12)", timelineLabel: "Morning adhkar" },
  evening: { label: "Evening", icon: (c) => <Moon size={20} color={c} />, color: GOLD, bg: "rgba(212,176,106,0.14)", timelineLabel: "Maghrib" },
  sleep: { label: "Sleep", icon: (c) => <MoonStar size={20} color={c} />, color: "#6B7FA3", bg: "rgba(107,127,163,0.12)", timelineLabel: "Sleep adhkar" },
  food: { label: "Food", icon: (c) => <Utensils size={20} color={c} />, color: SAGE, bg: "rgba(168,185,165,0.18)", timelineLabel: "Meals" },
  pregnancy: { label: "Pregnancy", icon: (c) => <Heart size={20} color={c} />, color: "#8B85C1", bg: "rgba(139,133,193,0.12)", timelineLabel: "Pregnancy" },
  birth_newborn: { label: "Birth & Newborn", icon: (c) => <Baby size={20} color={c} />, color: "#C9986A", bg: "rgba(201,152,106,0.14)", timelineLabel: "Birth & newborn" },
};
const SECTION_ORDER = ["morning", "evening", "sleep", "food", "pregnancy", "birth_newborn"];

function authenticityLabel(a: string) {
  if (a === "quran") return "Qur'an";
  if (a === "sahih") return "Sahih";
  if (a === "hasan") return "Hasan";
  if (a === "scholarly_guidance") return "Scholarly guidance";
  return "General practice";
}

export default function SunnahScreen() {
  useProfile();
  const router = useRouter();
  const { profile, setProfile } = useAppStore();
  const [entries, setEntries] = useState<any[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bookmarking, setBookmarking] = useState(false);

  useEffect(() => {
    getSunnahDailyGuide()
      .then(setEntries)
      .catch(() => setEntries([]));
  }, []);

  async function toggleBookmark() {
    if (!profile || bookmarking) return;
    const next = !profile.bookmarked_sunnah_page;
    setBookmarking(true);
    setProfile({ ...profile, bookmarked_sunnah_page: next });
    try {
      await updateProfile({ bookmarked_sunnah_page: next });
    } catch {
      setProfile({ ...profile, bookmarked_sunnah_page: !next });
    } finally {
      setBookmarking(false);
    }
  }

  if (!profile) return <LoadingScreen message="Loading guidance..." />;

  const bySection = new Map<string, any[]>();
  (entries ?? []).forEach((e) => {
    if (!bySection.has(e.daily_guide_section)) bySection.set(e.daily_guide_section, []);
    bySection.get(e.daily_guide_section)!.push(e);
  });
  const activeSections = SECTION_ORDER.filter((s) => bySection.has(s));
  const sourceBooks = Array.from(new Set((entries ?? []).map((e) => e.source_book).filter(Boolean)));

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="flex-row items-start justify-between px-6 pt-6">
        <View className="flex-1 pr-4">
          <Text className="text-4xl font-medium text-primary tracking-tight mb-2">Sunnah &amp; Protection</Text>
          <Text className="font-serif italic text-md text-secondary leading-relaxed">
            Qur'an · Sunnah · Daily Adhkar
          </Text>
          <View
            className="flex-row items-center gap-1.5 mt-3 px-3 py-1 rounded-pill self-start"
            style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
          >
            <View className="w-1.5 h-1.5 rounded-full bg-gold" />
            <Text className="text-2xs text-gold font-medium tracking-wide">Authentic practices · Clear timing</Text>
          </View>
        </View>
        <Pressable
          onPress={toggleBookmark}
          accessibilityLabel={profile.bookmarked_sunnah_page ? "Remove bookmark" : "Bookmark this page"}
          className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center mt-1"
        >
          <Bookmark
            size={18}
            color={profile.bookmarked_sunnah_page ? GOLD : MUTED}
            fill={profile.bookmarked_sunnah_page ? GOLD : "none"}
          />
        </Pressable>
      </View>

      <View className="px-6 mt-5">
        {entries === null ? (
          <View className="bg-card rounded-3xl p-6 border border-border items-center">
            <Text className="text-base text-muted">Loading guidance…</Text>
          </View>
        ) : activeSections.length === 0 ? (
          <View className="bg-card rounded-3xl p-6 border border-border items-center">
            <Text className="text-base text-muted text-center">
              Guidance is being reviewed and will appear here soon.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {activeSections.map((section) =>
              bySection.get(section)!.map((item) => {
                const meta = SECTION_META[section];
                const isExpanded = expanded === item._id;
                return (
                  <View
                    key={item._id}
                    className="bg-card rounded-3xl overflow-hidden"
                    style={{ borderWidth: 1, borderColor: "rgba(180,155,120,0.18)" }}
                  >
                    <Pressable
                      onPress={() => setExpanded((e) => (e === item._id ? null : item._id))}
                      className="px-5 py-4"
                    >
                      <View className="flex-row items-center gap-3.5">
                        <View
                          className="w-11 h-11 rounded-2xl items-center justify-center"
                          style={{ backgroundColor: meta.bg }}
                        >
                          {meta.icon(meta.color)}
                        </View>
                        <View className="flex-1">
                          <Text className="text-2xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: meta.color }}>
                            {meta.label}
                            {item.timing_note ? ` · ${item.timing_note}` : ""}
                          </Text>
                          <Text className="text-lg font-semibold text-primary mb-1.5">{item.title}</Text>
                          {item.tags?.length > 0 && (
                            <View className="flex-row flex-wrap gap-1.5">
                              {item.tags.map((t: string) => (
                                <Text
                                  key={t}
                                  className="text-2xs font-medium px-2 py-0.5 rounded-pill bg-section text-secondary"
                                >
                                  {t}
                                </Text>
                              ))}
                            </View>
                          )}
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
                        <Text className="text-sm text-secondary leading-relaxed font-serif italic mb-3">
                          {item.translation_en}
                        </Text>
                        {item.explanation && (
                          <Text className="text-sm text-secondary leading-relaxed mb-3">{item.explanation}</Text>
                        )}
                        <View className="flex-row items-center justify-between">
                          <Text
                            className="text-2xs font-semibold px-2 py-0.5 rounded-pill"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                          >
                            {authenticityLabel(item.authenticity)}
                          </Text>
                          <Text className="text-2xs text-muted">
                            ({item.source_book} {item.source_reference})
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              }),
            )}
          </View>
        )}
      </View>

      {activeSections.length > 0 && (
        <View className="px-6 mt-5">
          <View className="bg-card rounded-3xl p-5 border border-border shadow-card">
            <View className="flex-row items-center gap-2 mb-4">
              <Calendar size={16} color="#7B7268" />
              <Text className="text-2xs text-muted uppercase tracking-widest font-semibold">Daily Sunnah Timeline</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center">
                {activeSections.map((s, i) => (
                  <View key={s} className="flex-row items-center">
                    <View className="items-center gap-1 px-1">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: SECTION_META[s].bg }}
                      >
                        {SECTION_META[s].icon(SECTION_META[s].color)}
                      </View>
                      <Text className="text-2xs text-muted" style={{ width: 72, textAlign: "center" }}>
                        {SECTION_META[s].timelineLabel}
                      </Text>
                    </View>
                    {i < activeSections.length - 1 && <View style={{ width: 24, height: 1, backgroundColor: "rgba(180,155,120,0.18)", marginHorizontal: 4 }} />}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <View className="px-6 mt-5">
        <View className="bg-section rounded-3xl p-5 flex-row items-center gap-3.5">
          <View className="w-10 h-10 rounded-2xl bg-elevated items-center justify-center">
            <BookOpen size={18} color="#7B7268" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-primary">Hadith sources</Text>
            <Text className="text-2xs text-muted">
              {sourceBooks.length > 0 ? sourceBooks.join(" · ") : "Trusted references for authentic practices"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/sunnah/hadith" as any)}
            className="px-3.5 py-2 rounded-pill"
            style={{ backgroundColor: "#1F4D4A" }}
          >
            <Text className="text-2xs font-semibold text-white">View hadith →</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
