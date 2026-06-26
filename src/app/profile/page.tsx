"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
import { updateProfile } from "@/lib/data";
import { triggerRecalibrate } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import { lookupJob } from "@/data/job_index";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Check,
  X,
  Leaf,
  Sun,
  Moon,
  Minus,
  Plus,
  User,
  Users,
  AlertTriangle,
} from "lucide-react";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const PURPLE = "#667EEA";

function getCtx(week: number, isPregnant: boolean) {
  if (isPregnant) {
    if (week <= 12)
      return {
        phase: "First Trimester",
        range: "Weeks 1–12",
        color: SUCCESS,
        description: "Foundation & early development",
        progress: week / 40,
      };
    if (week <= 26)
      return {
        phase: "Second Trimester",
        range: "Weeks 13–26",
        color: GOLD,
        description: "Active growth & movement begins",
        progress: week / 40,
      };
    return {
      phase: "Third Trimester",
      range: "Weeks 27–40",
      color: "#E07B5F",
      description: "Final development & preparation",
      progress: week / 40,
    };
  }
  if (week <= 6)
    return {
      phase: "Acute Recovery",
      range: "Weeks 1–6",
      color: PURPLE,
      description: "Healing, stabilization & rest",
      progress: week / 52,
    };
  if (week <= 12)
    return {
      phase: "Active Recovery",
      range: "Weeks 7–12",
      color: "#8E7FE8",
      description: "Rebuilding strength & energy",
      progress: week / 52,
    };
  if (week <= 26)
    return {
      phase: "Integration Phase",
      range: "Weeks 13–26",
      color: GOLD,
      description: "Returning to your new normal",
      progress: week / 52,
    };
  return {
    phase: "Long-term Optimization",
    range: "Weeks 27–52",
    color: SUCCESS,
    description: "Full restoration & optimization",
    progress: week / 52,
  };
}

export default function ProfilePage() {
  useProfile();
  const { profile, protocol } = useAppStore();
  const router = useRouter();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [editField, setEditField] = useState<{
    key: string;
    label: string;
    type: string;
    value: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [weekVal, setWeekVal] = useState(profile?.current_week ?? 1);
  const [savingWeek, setSavingWeek] = useState(false);

  async function handleWeekSave(newWeek: number) {
    setSavingWeek(true);
    try {
      await updateProfile({ current_week: newWeek });
      // Recalibrate protocol with new week context
      const uid = getUserId();
      if (uid) await triggerRecalibrate(uid);
      setShowWeekPicker(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWeek(false);
    }
  }

  if (!profile) return <LoadingScreen message="Loading your profile..." />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const isPregnant = jt === "currently_pregnant";
  const isPostpartum = jt === "postpartum";
  const name = profile.first_name || "You";
  const initials = name.slice(0, 2).toUpperCase();

  // Job intelligence
  // const femaleJob = lookupJob(profile.job_type ?? "", "female");
  // const maleJob = lookupJob(profile.partners_job_type ?? "", "male");
  const [femaleJob, setFemaleJob] = useState<any>(() =>
    lookupJob(profile.job_type ?? "", "female"),
  );
  const [maleJob, setMaleJob] = useState<any>(() =>
    lookupJob(profile.partners_job_type ?? "", "male"),
  );
  useEffect(() => {
    import("@/lib/datasets").then(({ lookupJobDynamic }) => {
      lookupJobDynamic(profile.job_type ?? "", "female")
        .then((r) => r && setFemaleJob(r))
        .catch(() => {});
      lookupJobDynamic(profile.partners_job_type ?? "", "male")
        .then((r) => r && setMaleJob(r))
        .catch(() => {});
    });
  }, [profile.job_type, profile.partners_job_type]);
  const STATUS_MAP: Record<
    string,
    { label: string; desc: string; icon: React.ReactNode; color: string }
  > = {
    trying_to_conceive: {
      label: "Trying to Conceive",
      desc: "Fertility optimization protocol active",
      icon: <Leaf size={18} />,
      color: SUCCESS,
    },
    currently_pregnant: {
      label: "Pregnant",
      desc: "Pregnancy optimization protocol active",
      icon: <Sun size={18} />,
      color: GOLD,
    },
    postpartum: {
      label: "Postpartum Recovery",
      desc: "Recovery & restoration protocol active",
      icon: <Moon size={18} />,
      color: PURPLE,
    },
  };
  const statusInfo = STATUS_MAP[jt] ?? STATUS_MAP.trying_to_conceive;

  const PERSONAL = [
    { key: "first_name", label: "Name", type: "text", val: profile.first_name },
    {
      key: "age",
      label: "Age",
      type: "number",
      val: String(profile.age || ""),
    },
    {
      key: "height",
      label: "Height (cm)",
      type: "number",
      val: String((profile as any).height || ""),
    },
    {
      key: "weight",
      label: "Weight (kg)",
      type: "number",
      val: String((profile as any).weight || ""),
    },
    { key: "city", label: "City", type: "text", val: profile.city },
    {
      key: "country",
      label: "Country",
      type: "text",
      val: (profile as any).country || "",
    },
    {
      key: "nationality",
      label: "Nationality",
      type: "text",
      val: (profile as any).nationality || "",
    },
    {
      key: "job_type",
      label: "Occupation",
      type: "text",
      val: profile.job_type,
    },
    {
      key: "activity_level",
      label: "Activity Level",
      type: "text",
      val: profile.activity_level,
    },
    {
      key: "diet_type",
      label: "Diet Type",
      type: "text",
      val: profile.diet_type,
    },
  ];
  console.log("profile:", profile);
  const PARTNER = [
    {
      key: "partner_age",
      label: "Age",
      type: "number",
      val: String(profile.partners_age || ""),
    },
    {
      key: "partner_job_type",
      label: "Occupation",
      type: "text",
      val: profile.partners_job_type || "",
    },
    {
      key: "partner_diet",
      label: "Diet",
      type: "text",
      val: (profile as any).partners_diet || "",
    },
    {
      key: "partner_activity",
      label: "Activity",
      type: "text",
      val: (profile as any).partners_activity_level || "",
    },
  ];

  const filledP = PERSONAL.filter((f) => f.val).length;
  const filledPt = PARTNER.filter((f) => f.val).length;

  function openEdit(key: string, label: string, type: string, val: string) {
    setEditField({ key, label, type, value: val });
    setEditValue(val);
  }

  async function saveEdit() {
    if (!editField) return;
    setSaving(true);
    try {
      await updateProfile({
        [editField.key]:
          editField.type === "number" ? Number(editValue) || 0 : editValue,
      });
    } catch {}
    setSaving(false);
    setEditField(null);
  }

  function Card({ children }: { children: React.ReactNode }) {
    return (
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {children}
      </div>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "var(--text-muted)",
          marginBottom: 10,
          marginTop: 24,
          paddingLeft: 4,
        }}
      >
        {children}
      </p>
    );
  }

  function EditRow({
    label,
    value,
    onEdit,
  }: {
    label: string;
    value: string;
    onEdit: () => void;
  }) {
    return (
      <button
        onClick={onEdit}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left" as const,
        }}
      >
        <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              fontWeight: 500,
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            }}
          >
            {value || "—"}
          </span>
          <ChevronRight size={14} color="var(--text-muted)" />
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 20px 0",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0",
          }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            Back
          </span>
        </button>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Profile
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* Avatar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "28px 24px 8px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(212,176,106,0.15)",
            border: `2px solid ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600, color: GOLD }}>
            {initials}
          </span>
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          {name}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Your optimization profile
        </p>
        {profile.city && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: GOLD,
              }}
            />
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 500 }}>
              {profile.city}
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Personal — collapsible */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              background: "var(--card)",
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid ${personalOpen ? "rgba(212,176,106,0.3)" : "var(--border)"}`,
              transition: "border-color 0.25s",
            }}
          >
            <button
              onClick={() => setPersonalOpen((v) => !v)}
              style={{
                width: "100%",
                padding: "18px 18px 16px",
                background: "none",
                border: "none",
                borderBottom: personalOpen ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                textAlign: "left" as const,
              }}
            >
              <div
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(212,176,106,0.1)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={20} color={GOLD} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      Personal Information
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: GOLD,
                          background: "rgba(212,176,106,0.12)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {filledP}/{PERSONAL.length}
                      </span>
                      <ChevronRight
                        size={16}
                        color="var(--text-muted)"
                        style={{
                          transition: "transform 0.22s",
                          transform: personalOpen ? "rotate(90deg)" : "none",
                        }}
                      />
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {personalOpen
                      ? "Tap any field to edit"
                      : `${name} · ${profile.age ? profile.age + " yrs" : ""} · ${profile.city || ""}`}
                  </p>
                  <div
                    style={{
                      height: 3,
                      background: "var(--section-bg)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(filledP / PERSONAL.length) * 100}%`,
                        background: `linear-gradient(90deg,rgba(212,176,106,0.6),${GOLD})`,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
            {personalOpen &&
              PERSONAL.map((f, i) => (
                <div
                  key={f.key}
                  style={{
                    borderBottom:
                      i < PERSONAL.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <EditRow
                    label={f.label}
                    value={f.val}
                    onEdit={() => openEdit(f.key, f.label, f.type, f.val)}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Pregnancy status */}
        <SectionLabel>Pregnancy Status</SectionLabel>
        <Card>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${statusInfo.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: statusInfo.color,
                }}
              >
                {statusInfo.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {statusInfo.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {statusInfo.desc}
                </div>
              </div>
            </div>
            {/* Score */}
            {profile.fertility_score > 0 && (
              <div
                style={{
                  background: "var(--section-bg)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, color: "var(--text-secondary)" }}
                  >
                    Optimization score
                  </span>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: GOLD,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {profile.fertility_score}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--border)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${profile.fertility_score}%`,
                      background: `linear-gradient(90deg,${GOLD}80,${GOLD})`,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Week picker — only for pregnant or postpartum */}
            {(isPregnant || isPostpartum) && (
              <div
                style={{
                  background: "var(--section-bg)",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: showWeekPicker ? 12 : 0,
                  }}
                >
                  <div>
                    <span
                      style={{ fontSize: 13, color: "var(--text-secondary)" }}
                    >
                      {isPregnant
                        ? "Current pregnancy week"
                        : "Weeks postpartum"}
                    </span>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: GOLD,
                        letterSpacing: "-0.02em",
                        marginTop: 2,
                      }}
                    >
                      Week {profile.current_week ?? weekVal}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setWeekVal(profile.current_week ?? 1);
                      setShowWeekPicker((v) => !v);
                    }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GOLD,
                      background: "rgba(212,176,106,0.12)",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Update
                  </button>
                </div>

                {showWeekPicker && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <button
                        onClick={() => setWeekVal((v) => Math.max(1, v - 1))}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontFamily: "inherit",
                        }}
                      >
                        −
                      </button>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {weekVal}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-muted)",
                            marginLeft: 4,
                          }}
                        >
                          {isPregnant ? `/ 40` : "weeks"}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setWeekVal((v) =>
                            Math.min(isPregnant ? 40 : 52, v + 1),
                          )
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          fontSize: 18,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontFamily: "inherit",
                        }}
                      >
                        +
                      </button>
                    </div>
                    {/* Slider */}
                    <input
                      type="range"
                      min={1}
                      max={isPregnant ? 40 : 52}
                      value={weekVal}
                      onChange={(e) => setWeekVal(Number(e.target.value))}
                      style={{
                        width: "100%",
                        marginBottom: 12,
                        accentColor: GOLD,
                      }}
                    />
                    <button
                      onClick={() => handleWeekSave(weekVal)}
                      disabled={savingWeek}
                      style={{
                        width: "100%",
                        padding: "12px 0",
                        borderRadius: 12,
                        background: GOLD,
                        border: "none",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        opacity: savingWeek ? 0.7 : 1,
                      }}
                    >
                      {savingWeek ? "Saving & recalibrating…" : "Save Week"}
                    </button>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        textAlign: "center",
                        marginTop: 8,
                        lineHeight: 1.5,
                      }}
                    >
                      Saving will recalibrate your protocol for week {weekVal}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Partner — collapsible */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              background: "var(--card)",
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid ${partnerOpen ? `${SUCCESS}30` : "var(--border)"}`,
              transition: "border-color 0.25s",
            }}
          >
            <button
              onClick={() => setPartnerOpen((v) => !v)}
              style={{
                width: "100%",
                padding: "18px 18px 16px",
                background: "none",
                border: "none",
                borderBottom: partnerOpen ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                textAlign: "left" as const,
              }}
            >
              <div
                style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${SUCCESS}12`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={20} color={SUCCESS} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      Partner Information
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: SUCCESS,
                          background: `${SUCCESS}12`,
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {filledPt}/{PARTNER.length}
                      </span>
                      <ChevronRight
                        size={16}
                        color="var(--text-muted)"
                        style={{
                          transition: "transform 0.22s",
                          transform: partnerOpen ? "rotate(90deg)" : "none",
                        }}
                      />
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {partnerOpen
                      ? "Tap any field to edit"
                      : profile.partner_job_type
                        ? `${profile.partner_job_type}`
                        : "Tap to add partner details"}
                  </p>
                  <div
                    style={{
                      height: 3,
                      background: "var(--section-bg)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(filledPt / PARTNER.length) * 100}%`,
                        background: `linear-gradient(90deg,${SUCCESS}70,${SUCCESS})`,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
            {partnerOpen &&
              PARTNER.map((f, i) => (
                <div
                  key={f.key}
                  style={{
                    borderBottom:
                      i < PARTNER.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <EditRow
                    label={f.label}
                    value={f.val}
                    onEdit={() => openEdit(f.key, f.label, f.type, f.val)}
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Job intelligence */}
        {(femaleJob || maleJob) && (
          <>
            <SectionLabel>Job Intelligence</SectionLabel>
            {femaleJob && (
              <div
                style={{
                  background: "var(--card)",
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  padding: "16px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#9B85C1",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    Your Job
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  {femaleJob.job}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {femaleJob.nutrient_risks.map((n: any) => (
                    <span
                      key={n}
                      style={{
                        fontSize: 12,
                        background: "rgba(212,176,106,0.1)",
                        color: GOLD,
                        padding: "3px 10px",
                        borderRadius: 20,
                        border: "1px solid rgba(212,176,106,0.2)",
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
                {femaleJob.common_risks.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "10px 12px",
                      background: "rgba(194,107,46,0.06)",
                      borderRadius: 10,
                      borderLeft: "2px solid rgba(194,107,46,0.3)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: "#C26B2E",
                        lineHeight: 1.55,
                      }}
                    >
                      Risk: {femaleJob.common_risks.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}
            {maleJob && (
              <div
                style={{
                  background: "var(--card)",
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: SUCCESS,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    Partner's Job
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 10,
                  }}
                >
                  {maleJob.job}
                </p>
                {(maleJob as any).fertility_impact?.sperm && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "rgba(31,122,90,0.06)",
                      borderRadius: 10,
                      borderLeft: `2px solid ${SUCCESS}50`,
                    }}
                  >
                    <p
                      style={{ fontSize: 12, color: SUCCESS, lineHeight: 1.55 }}
                    >
                      {(maleJob as any).fertility_impact.sperm}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Protocol risk summary */}
        {(protocol?.female_risk_summary || protocol?.male_risk_summary) && (
          <>
            <SectionLabel>Today's Risk Summary</SectionLabel>
            <Card>
              <div style={{ padding: "16px" }}>
                {protocol?.female_risk_summary && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: protocol?.male_risk_summary ? 12 : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#9B85C1",
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {protocol.female_risk_summary}
                    </p>
                  </div>
                )}
                {protocol?.male_risk_summary && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: SUCCESS,
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-primary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {protocol.male_risk_summary}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Data & privacy */}
        <SectionLabel>Data & Privacy</SectionLabel>
        <Card>
          {[
            ["Privacy Policy", "How we protect your data"],
            ["Terms of Service", "Usage agreement"],
            ["Data Usage Transparency", "What we collect and why"],
          ].map(([label, detail], i) => (
            <button
              key={label}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                textAlign: "left" as const,
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {detail}
                </div>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </button>
          ))}
        </Card>

        {/* Version */}
        <div style={{ textAlign: "center", marginTop: 32, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                background: GOLD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Leaf size={10} color="#fff" />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              BLOOM
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Version 2.4.0
          </span>
        </div>
      </div>

      {/* ── Edit modal ── */}
      {editField && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditField(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 430,
              background: "var(--elevated)",
              borderRadius: "24px 24px 0 0",
              padding: "0 0 40px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 4px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--section-bg)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 20px 20px",
              }}
            >
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Edit {editField.label}
              </h3>
              <button
                onClick={() => setEditField(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>
            <div style={{ padding: "0 20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: "var(--text-muted)",
                  marginBottom: 10,
                }}
              >
                {editField.label}
              </label>
              <input
                autoFocus
                type={editField.type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "var(--section-bg)",
                  border: `1.5px solid ${GOLD}`,
                  fontSize: 16,
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box" as const,
                  marginBottom: 24,
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setEditField(null)}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    background: "var(--section-bg)",
                    border: "none",
                    color: "var(--text-secondary)",
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: 14,
                    borderRadius: 14,
                    background: GOLD,
                    border: "none",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
