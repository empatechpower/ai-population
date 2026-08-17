import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Slider from "@react-native-community/slider";
import { ChevronLeft, ChevronRight, X, Leaf, Sun, Moon, User, Users } from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useAppStore } from "@/store/app";
import { updateProfile } from "@/lib/data";
import { triggerRecalibrate } from "@/lib/workflows";
import { getUserId, logOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { lookupJob } from "@/data/job_index";
import LoadingScreen from "@/components/shared/LoadingScreen";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const PURPLE = "#667EEA";
const MUTED = "#9A9094";

const NUMERIC_BOUNDS: Record<string, { min: number; max: number }> = {
  age: { min: 13, max: 60 },
  height: { min: 100, max: 250 },
  weight: { min: 30, max: 250 },
  partner_age: { min: 13, max: 100 },
};

interface EditField {
  key: string;
  label: string;
  type: "text" | "number";
  value: string;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-2.5 mt-6 pl-1">
      {children}
    </Text>
  );
}

function EditRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <Pressable onPress={onEdit} className="flex-row items-center justify-between px-4 py-3.5">
      <Text className="text-sm text-secondary">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-primary font-medium" numberOfLines={1} style={{ maxWidth: 160 }}>
          {value || "—"}
        </Text>
        <ChevronRight size={14} color={MUTED} />
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  useProfile();
  const { profile, protocol } = useAppStore();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [editField, setEditField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [weekVal, setWeekVal] = useState(profile?.current_week ?? 1);
  const [savingWeek, setSavingWeek] = useState(false);
  const [weekError, setWeekError] = useState("");

  const [femaleJob, setFemaleJob] = useState<any>(null);
  const [maleJob, setMaleJob] = useState<any>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function deleteAccount() {
    const uid = getUserId();
    if (!uid) return;
    setDeletingAccount(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/api/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: uid }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not delete account");
      await logOut();
    } catch (e: any) {
      setDeletingAccount(false);
      Alert.alert("Couldn't delete account", e?.message || "Please try again.");
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your profile, protocol, meals, movement plans, journey data, and community posts. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ],
    );
  }

  useEffect(() => {
    if (!profile) return;
    setFemaleJob(lookupJob(profile.job_type ?? "", "female"));
    setMaleJob(lookupJob((profile as any).partners_job_type ?? "", "male"));
    import("@/lib/datasets").then(({ lookupJobDynamic }) => {
      lookupJobDynamic(profile.job_type ?? "", "female").then((r) => r && setFemaleJob(r)).catch(() => {});
      lookupJobDynamic((profile as any).partners_job_type ?? "", "male").then((r) => r && setMaleJob(r)).catch(() => {});
    });
  }, [profile?.job_type, (profile as any)?.partners_job_type]);

  async function handleWeekSave(newWeek: number) {
    setSavingWeek(true);
    setWeekError("");
    try {
      await updateProfile({ current_week: newWeek });
      const uid = getUserId();
      if (uid) await triggerRecalibrate(uid);
      setShowWeekPicker(false);
    } catch (e) {
      console.error(e);
      setWeekError("Couldn't save changes. Please try again.");
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

  const STATUS_MAP: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
    trying_to_conceive: {
      label: "Trying to Conceive",
      desc: "Fertility optimization protocol active",
      icon: <Leaf size={18} color={SUCCESS} />,
      color: SUCCESS,
    },
    currently_pregnant: {
      label: "Pregnant",
      desc: "Pregnancy optimization protocol active",
      icon: <Sun size={18} color={GOLD} />,
      color: GOLD,
    },
    postpartum: {
      label: "Postpartum Recovery",
      desc: "Recovery & restoration protocol active",
      icon: <Moon size={18} color={PURPLE} />,
      color: PURPLE,
    },
  };
  const statusInfo = STATUS_MAP[jt] ?? STATUS_MAP.trying_to_conceive;

  const PERSONAL = [
    { key: "first_name", label: "Name", type: "text" as const, val: profile.first_name },
    { key: "age", label: "Age", type: "number" as const, val: String(profile.age || "") },
    { key: "height", label: "Height (cm)", type: "number" as const, val: String((profile as any).height || "") },
    { key: "weight", label: "Weight (kg)", type: "number" as const, val: String((profile as any).weight || "") },
    { key: "city", label: "City", type: "text" as const, val: profile.city },
    { key: "country", label: "Country", type: "text" as const, val: (profile as any).country || "" },
    { key: "nationality", label: "Nationality", type: "text" as const, val: (profile as any).nationality || "" },
    { key: "job_type", label: "Occupation", type: "text" as const, val: profile.job_type },
    { key: "activity_level", label: "Activity Level", type: "text" as const, val: profile.activity_level },
    { key: "diet_type", label: "Diet Type", type: "text" as const, val: profile.diet_type },
  ];
  const PARTNER = [
    { key: "partner_age", label: "Age", type: "number" as const, val: String((profile as any).partners_age || "") },
    { key: "partner_job_type", label: "Occupation", type: "text" as const, val: (profile as any).partners_job_type || "" },
    { key: "partner_diet", label: "Diet", type: "text" as const, val: (profile as any).partners_diet || "" },
    { key: "partner_activity", label: "Activity", type: "text" as const, val: (profile as any).partners_activity_level || "" },
  ];

  const filledP = PERSONAL.filter((f) => f.val).length;
  const filledPt = PARTNER.filter((f) => f.val).length;

  function openEdit(key: string, label: string, type: "text" | "number", val: string) {
    setEditField({ key, label, type, value: val });
    setEditValue(val);
    setEditError("");
  }

  const editBounds = editField ? NUMERIC_BOUNDS[editField.key] : undefined;
  const editNumberInvalid =
    editField?.type === "number" &&
    (editValue.trim() === "" ||
      !Number.isFinite(Number(editValue)) ||
      (editBounds !== undefined && (Number(editValue) < editBounds.min || Number(editValue) > editBounds.max)));

  async function saveEdit() {
    if (!editField) return;
    if (editNumberInvalid) {
      setEditError(editBounds ? `Enter a value between ${editBounds.min} and ${editBounds.max}` : "Enter a valid number");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      await updateProfile({ [editField.key]: editField.type === "number" ? Number(editValue) : editValue });
      setEditField(null);
    } catch {
      setEditError("Couldn't save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Edit bottom sheet ──────────────────────────────────────
  if (editField) {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-bg"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <Text className="text-[17px] font-semibold text-primary">Edit {editField.label}</Text>
          <Pressable onPress={() => setEditField(null)}>
            <X size={20} color={MUTED} />
          </Pressable>
        </View>
        <View className="px-5 pt-5">
          <Text className="text-[11px] font-semibold tracking-widest uppercase text-muted mb-2.5">
            {editField.label}
          </Text>
          <TextInput
            autoFocus
            value={editValue}
            onChangeText={(v) => {
              setEditValue(v);
              setEditError("");
            }}
            keyboardType={editField.type === "number" ? "number-pad" : "default"}
            className="px-4 py-3.5 rounded-2xl text-base text-primary bg-section"
            style={{ borderWidth: 1.5, borderColor: editError ? "#E57373" : GOLD, marginBottom: editError ? 8 : 24 }}
          />
          {editError ? <Text className="text-xs text-warning mb-4">{editError}</Text> : null}
          <View className="flex-row gap-2.5">
            <Pressable onPress={() => setEditField(null)} className="flex-1 py-3.5 rounded-2xl items-center bg-section">
              <Text className="text-[15px] font-medium text-secondary">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={saveEdit}
              disabled={saving || editNumberInvalid}
              className="flex-[2] py-3.5 rounded-2xl items-center"
              style={{ backgroundColor: saving || editNumberInvalid ? `${GOLD}60` : GOLD }}
            >
              <Text className="text-[15px] font-medium text-white">{saving ? "Saving…" : "Save Changes"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-16">
      <View className="flex-row items-center justify-between px-5 pt-5">
        <Pressable onPress={() => router.push("/(tabs)")} className="flex-row items-center gap-1 py-2">
          <ChevronLeft size={20} color="#7B7268" />
          <Text className="text-sm text-secondary">Back</Text>
        </Pressable>
        <Text className="text-base font-semibold text-primary">Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <View className="items-center px-6 pt-7 pb-2">
        <View
          className="w-[72px] h-[72px] rounded-full items-center justify-center mb-3.5"
          style={{ backgroundColor: "rgba(212,176,106,0.15)", borderWidth: 2, borderColor: GOLD }}
        >
          <Text className="text-[22px] font-semibold" style={{ color: GOLD }}>{initials}</Text>
        </View>
        <Text className="text-xl font-medium text-primary mb-1">{name}</Text>
        <Text className="text-[13px] text-muted">Your optimization profile</Text>
        {profile.city ? (
          <View className="flex-row items-center gap-1.5 mt-2.5">
            <View className="w-1.5 h-1.5 rounded-full bg-gold" />
            <Text className="text-xs font-medium" style={{ color: GOLD }}>{profile.city}</Text>
          </View>
        ) : null}
      </View>

      <View className="px-5">
        {/* Personal — collapsible */}
        <View className="mt-6 bg-card rounded-[18px] overflow-hidden" style={{ borderWidth: 1, borderColor: personalOpen ? "rgba(212,176,106,0.3)" : "rgba(180,155,120,0.18)" }}>
          <Pressable
            onPress={() => setPersonalOpen((v) => !v)}
            className="p-4.5"
            style={{ borderBottomWidth: personalOpen ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}
          >
            <View className="flex-row gap-3.5">
              <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: "rgba(212,176,106,0.1)" }}>
                <User size={20} color={GOLD} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[15px] font-semibold text-primary">Personal Information</Text>
                  <View className="flex-row items-center gap-2">
                    <Text
                      className="text-[11px] font-semibold px-2 py-0.5 rounded"
                      style={{ color: GOLD, backgroundColor: "rgba(212,176,106,0.12)" }}
                    >
                      {filledP}/{PERSONAL.length}
                    </Text>
                    <ChevronRight size={16} color={MUTED} style={{ transform: [{ rotate: personalOpen ? "90deg" : "0deg" }] }} />
                  </View>
                </View>
                <Text className="text-xs text-muted mb-2.5 leading-relaxed">
                  {personalOpen ? "Tap any field to edit" : `${name} · ${profile.age ? profile.age + " yrs" : ""} · ${profile.city || ""}`}
                </Text>
                <View className="h-[3px] bg-section rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${(filledP / PERSONAL.length) * 100}%`, backgroundColor: GOLD }} />
                </View>
              </View>
            </View>
          </Pressable>
          {personalOpen &&
            PERSONAL.map((f, i) => (
              <View key={f.key} style={{ borderBottomWidth: i < PERSONAL.length - 1 ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}>
                <EditRow label={f.label} value={f.val} onEdit={() => openEdit(f.key, f.label, f.type, f.val)} />
              </View>
            ))}
        </View>

        {/* Pregnancy status */}
        <SectionLabel>Pregnancy Status</SectionLabel>
        <View className="bg-card rounded-[18px] border border-border p-4">
          <View className="flex-row items-center gap-3 mb-3.5">
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${statusInfo.color}15` }}>
              {statusInfo.icon}
            </View>
            <View>
              <Text className="text-[15px] font-semibold text-primary">{statusInfo.label}</Text>
              <Text className="text-xs text-muted mt-0.5">{statusInfo.desc}</Text>
            </View>
          </View>

          {profile.fertility_score > 0 && (
            <View className="bg-section rounded-xl px-3.5 py-3 mb-3.5">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[13px] text-secondary">Optimization score</Text>
                <Text className="text-[22px] font-bold tracking-tight" style={{ color: GOLD }}>{profile.fertility_score}</Text>
              </View>
              <View className="h-1 bg-border rounded-full overflow-hidden">
                <View className="h-full rounded-full" style={{ width: `${profile.fertility_score}%`, backgroundColor: GOLD }} />
              </View>
            </View>
          )}

          {(isPregnant || isPostpartum) && (
            <View className="bg-section rounded-xl px-3.5 py-3">
              <View className="flex-row items-center justify-between" style={{ marginBottom: showWeekPicker ? 12 : 0 }}>
                <View>
                  <Text className="text-[13px] text-secondary">{isPregnant ? "Current pregnancy week" : "Weeks postpartum"}</Text>
                  <Text className="text-xl font-bold tracking-tight mt-0.5" style={{ color: GOLD }}>
                    Week {profile.current_week ?? weekVal}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setWeekVal(profile.current_week ?? 1);
                    setWeekError("");
                    setShowWeekPicker((v) => !v);
                  }}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: GOLD }}>Update</Text>
                </Pressable>
              </View>

              {showWeekPicker && (
                <View>
                  <View className="flex-row items-center gap-3 mb-3">
                    <Pressable
                      onPress={() => setWeekVal((v) => Math.max(1, v - 1))}
                      className="w-9 h-9 rounded-full items-center justify-center bg-card border border-border"
                    >
                      <Text className="text-lg text-primary">−</Text>
                    </Pressable>
                    <View className="flex-1 items-center">
                      <Text className="text-[28px] font-bold text-primary">
                        {weekVal}
                        <Text className="text-[13px] text-muted"> {isPregnant ? "/ 40" : "weeks"}</Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setWeekVal((v) => Math.min(isPregnant ? 40 : 52, v + 1))}
                      className="w-9 h-9 rounded-full items-center justify-center bg-card border border-border"
                    >
                      <Text className="text-lg text-primary">+</Text>
                    </Pressable>
                  </View>
                  <Slider
                    minimumValue={1}
                    maximumValue={isPregnant ? 40 : 52}
                    step={1}
                    value={weekVal}
                    onValueChange={setWeekVal}
                    minimumTrackTintColor={GOLD}
                    maximumTrackTintColor="rgba(180,155,120,0.25)"
                    thumbTintColor={GOLD}
                    style={{ marginBottom: 12 }}
                  />
                  <Pressable
                    onPress={() => handleWeekSave(weekVal)}
                    disabled={savingWeek}
                    className="py-3 rounded-xl items-center"
                    style={{ backgroundColor: GOLD, opacity: savingWeek ? 0.7 : 1 }}
                  >
                    <Text className="text-sm font-semibold text-white">
                      {savingWeek ? "Saving & recalibrating…" : "Save Week"}
                    </Text>
                  </Pressable>
                  {weekError ? <Text className="text-xs text-warning text-center mt-2">{weekError}</Text> : null}
                  <Text className="text-[11px] text-muted text-center mt-2 leading-relaxed">
                    Saving will recalibrate your protocol for week {weekVal}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Partner — collapsible */}
        <View
          className="mt-4 bg-card rounded-[18px] overflow-hidden"
          style={{ borderWidth: 1, borderColor: partnerOpen ? `${SUCCESS}30` : "rgba(180,155,120,0.18)" }}
        >
          <Pressable
            onPress={() => setPartnerOpen((v) => !v)}
            className="p-4.5"
            style={{ borderBottomWidth: partnerOpen ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}
          >
            <View className="flex-row gap-3.5">
              <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: `${SUCCESS}12` }}>
                <Users size={20} color={SUCCESS} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[15px] font-semibold text-primary">Partner Information</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ color: SUCCESS, backgroundColor: `${SUCCESS}12` }}>
                      {filledPt}/{PARTNER.length}
                    </Text>
                    <ChevronRight size={16} color={MUTED} style={{ transform: [{ rotate: partnerOpen ? "90deg" : "0deg" }] }} />
                  </View>
                </View>
                <Text className="text-xs text-muted mb-2.5 leading-relaxed">
                  {partnerOpen
                    ? "Tap any field to edit"
                    : (profile as any).partners_job_type || "Tap to add partner details"}
                </Text>
                <View className="h-[3px] bg-section rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${(filledPt / PARTNER.length) * 100}%`, backgroundColor: SUCCESS }} />
                </View>
              </View>
            </View>
          </Pressable>
          {partnerOpen &&
            PARTNER.map((f, i) => (
              <View key={f.key} style={{ borderBottomWidth: i < PARTNER.length - 1 ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}>
                <EditRow label={f.label} value={f.val} onEdit={() => openEdit(f.key, f.label, f.type, f.val)} />
              </View>
            ))}
        </View>

        {/* Job intelligence */}
        {(femaleJob || maleJob) && (
          <>
            <SectionLabel>Job Intelligence</SectionLabel>
            {femaleJob && (
              <View className="bg-card rounded-[18px] border border-border p-4 mb-3">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: "#9B85C1" }} />
                  <Text className="text-[11px] text-muted uppercase tracking-wider font-semibold">Your Job</Text>
                </View>
                <Text className="text-base font-semibold text-primary mb-2.5">{femaleJob.job}</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {femaleJob.nutrient_risks.map((n: string) => (
                    <Text
                      key={n}
                      className="text-xs px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(212,176,106,0.1)", color: GOLD, borderWidth: 1, borderColor: "rgba(212,176,106,0.2)" }}
                    >
                      {n}
                    </Text>
                  ))}
                </View>
                {femaleJob.common_risks.length > 0 && (
                  <View
                    className="mt-2.5 px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: "rgba(194,107,46,0.06)", borderLeftWidth: 2, borderLeftColor: "rgba(194,107,46,0.3)" }}
                  >
                    <Text className="text-xs leading-relaxed" style={{ color: "#C26B2E" }}>
                      Risk: {femaleJob.common_risks.join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            )}
            {maleJob && (
              <View className="bg-card rounded-[18px] border border-border p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: SUCCESS }} />
                  <Text className="text-[11px] text-muted uppercase tracking-wider font-semibold">Partner's Job</Text>
                </View>
                <Text className="text-base font-semibold text-primary mb-2.5">{maleJob.job}</Text>
                {maleJob.fertility_impact?.sperm && (
                  <View className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(31,122,90,0.06)", borderLeftWidth: 2, borderLeftColor: `${SUCCESS}50` }}>
                    <Text className="text-xs leading-relaxed" style={{ color: SUCCESS }}>{maleJob.fertility_impact.sperm}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Risk summary */}
        {(protocol?.female_risk_summary || protocol?.male_risk_summary) && (
          <>
            <SectionLabel>Today's Risk Summary</SectionLabel>
            <View className="bg-card rounded-[18px] border border-border p-4">
              {protocol?.female_risk_summary && (
                <View className="flex-row items-start gap-2.5" style={{ marginBottom: protocol?.male_risk_summary ? 12 : 0 }}>
                  <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: "#9B85C1" }} />
                  <Text className="text-[13px] text-primary leading-relaxed flex-1">{protocol.female_risk_summary}</Text>
                </View>
              )}
              {protocol?.male_risk_summary && (
                <View className="flex-row items-start gap-2.5">
                  <View className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: SUCCESS }} />
                  <Text className="text-[13px] text-primary leading-relaxed flex-1">{protocol.male_risk_summary}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Data & privacy */}
        <SectionLabel>Data & Privacy</SectionLabel>
        <View className="bg-card rounded-[18px] border border-border overflow-hidden">
          {[
            {
              label: "Privacy Policy",
              detail: "How we protect your data",
              onPress: () => WebBrowser.openBrowserAsync("https://ai-population.com/privacy"),
            },
            { label: "Terms of Service", detail: "Usage agreement", onPress: undefined },
            { label: "Data Usage Transparency", detail: "What we collect and why", onPress: undefined },
          ].map(({ label, detail, onPress }, i) => (
            <View key={label} style={{ borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "rgba(180,155,120,0.15)" }}>
              <Pressable
                className="flex-row items-center justify-between px-4 py-3.5"
                onPress={onPress}
              >
                <View>
                  <Text className="text-sm text-primary">{label}</Text>
                  <Text className="text-xs text-muted mt-0.5">{detail}</Text>
                </View>
                <ChevronRight size={14} color={MUTED} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable onPress={() => logOut()} className="mt-6 py-3.5 rounded-2xl items-center border border-border">
          <Text className="text-secondary font-medium text-base">Log out</Text>
        </Pressable>

        <Pressable
          onPress={confirmDeleteAccount}
          disabled={deletingAccount}
          className="mt-3 py-3.5 items-center"
        >
          <Text className="font-medium text-sm" style={{ color: "#E57373" }}>
            {deletingAccount ? "Deleting..." : "Delete account"}
          </Text>
        </Pressable>

        <View className="items-center mt-8 mb-4">
          <View className="flex-row items-center gap-1.5 mb-1.5">
            <View className="w-4 h-4 rounded items-center justify-center" style={{ backgroundColor: GOLD }}>
              <Leaf size={10} color="#fff" />
            </View>
            <Text className="text-xs font-semibold text-muted tracking-wide">BLOOM</Text>
          </View>
          <Text className="text-[11px] text-muted">Version 2.4.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}
