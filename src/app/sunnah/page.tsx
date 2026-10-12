"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
import { getSunnahDailyGuide, updateProfile } from "@/lib/data";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
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
} from "lucide-react";

const GOLD = "#D4B06A";
const BLUE = "#4A90C4";
const SAGE = "#A8B9A5";

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

export default function SunnahPage() {
  useProfile();
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
    <div className="min-h-full bg-bg pb-24 sm:pb-40">
      <div className="flex items-start justify-between px-6 pt-6">
        <div className="flex-1 pr-4">
          <h1 className="text-4xl font-medium text-primary tracking-tight mb-2">Sunnah &amp; Protection</h1>
          <p className="font-serif italic text-md text-secondary leading-relaxed">
            Qur'an &middot; Sunnah &middot; Daily Adhkar
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-pill"
            style={{ background: "rgba(212,176,106,0.12)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-2xs text-gold font-medium tracking-wide">Authentic practices &middot; Clear timing</span>
          </div>
        </div>
        <button
          onClick={toggleBookmark}
          aria-label={profile.bookmarked_sunnah_page ? "Remove bookmark" : "Bookmark this page"}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer shrink-0 mt-1"
        >
          <Bookmark
            size={18}
            color={profile.bookmarked_sunnah_page ? GOLD : "#9A9094"}
            fill={profile.bookmarked_sunnah_page ? GOLD : "none"}
          />
        </button>
      </div>

      <div className="px-6 mt-5">
        {entries === null ? (
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent spin mx-auto mb-3" />
            <p className="text-base text-muted">Loading guidance…</p>
          </div>
        ) : activeSections.length === 0 ? (
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <p className="text-base text-muted">Guidance is being reviewed and will appear here soon.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeSections.map((section) => {
              const meta = SECTION_META[section];
              const items = bySection.get(section)!;
              return items.map((item) => (
                <div
                  key={item._id}
                  className="bg-card rounded-3xl overflow-hidden p-3"
                  style={{ border: "1px solid rgba(180,155,120,0.18)" }}
                >
                  <button
                    onClick={() => setExpanded((e) => (e === item._id ? null : item._id))}
                    className="w-full px-5 py-4.5 bg-transparent border-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: meta.bg }}
                      >
                        {meta.icon(meta.color)}
                      </div>
                      <div className="flex-1">
                        <p className="text-2xs uppercase tracking-widest font-semibold mb-0.5" style={{ color: meta.color }}>
                          {meta.label}
                          {item.timing_note ? ` · ${item.timing_note}` : ""}
                        </p>
                        <h3 className="text-lg font-semibold text-primary mb-1.5">{item.title}</h3>
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.map((t: string) => (
                              <span
                                key={t}
                                className="text-2xs font-medium px-2 py-0.5 rounded-pill bg-section text-secondary"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <ChevronRight
                        size={17}
                        className="text-muted shrink-0 transition-transform duration-300"
                        style={{ transform: expanded === item._id ? "rotate(90deg)" : "none" }}
                      />
                    </div>
                  </button>

                  {expanded === item._id && (
                    <div className="border-t border-border p-5">
                      <p className="text-sm text-secondary leading-relaxed font-serif italic mb-3">
                        {item.translation_en}
                      </p>
                      {item.explanation && (
                        <p className="text-sm text-secondary leading-relaxed mb-3">{item.explanation}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className="text-2xs font-semibold px-2 py-0.5 rounded-pill"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {authenticityLabel(item.authenticity)}
                        </span>
                        <span className="text-2xs text-muted">
                          ({item.source_book} {item.source_reference})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ));
            })}
          </div>
        )}
      </div>

      {activeSections.length > 0 && (
        <div className="px-6 mt-5">
          <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-secondary" />
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold">Daily Sunnah Timeline</p>
            </div>
            <div className="flex items-center overflow-x-auto gap-1">
              {activeSections.map((s, i) => (
                <div key={s} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center gap-1 px-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: SECTION_META[s].bg }}
                    >
                      {SECTION_META[s].icon(SECTION_META[s].color)}
                    </div>
                    <span className="text-2xs text-muted whitespace-nowrap">{SECTION_META[s].timelineLabel}</span>
                  </div>
                  {i < activeSections.length - 1 && <div className="w-6 h-px bg-border mx-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 mt-5">
        <div className="bg-section rounded-3xl p-5 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-elevated flex items-center justify-center shrink-0">
            <BookOpen size={18} className="text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-primary">Hadith sources</p>
            <p className="text-2xs text-muted">
              {sourceBooks.length > 0 ? sourceBooks.join(" · ") : "Trusted references for authentic practices"}
            </p>
          </div>
          <Link
            href="/sunnah/hadith"
            className="text-2xs font-semibold text-white px-3.5 py-2 rounded-pill whitespace-nowrap"
            style={{ background: "#1F4D4A" }}
          >
            View hadith →
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
