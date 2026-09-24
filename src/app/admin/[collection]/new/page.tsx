"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/client";
import { ADMIN_SCHEMAS } from "@/lib/admin/schema";
import RefSelect from "@/components/admin/RefSelect";

export default function AdminNewRecord() {
  const { collection } = useParams<{ collection: string }>();
  const router = useRouter();
  const schema = ADMIN_SCHEMAS[collection];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!schema?.createFields) return <p className="text-warning">Creating records isn&apos;t supported here.</p>;

  async function handleCreate() {
    setSaving(true);
    setError("");
    try {
      const { id } = await adminFetch(`/api/admin/${collection}`, {
        method: "POST",
        body: JSON.stringify({ data: values }),
      });
      router.push(`/admin/${collection}/${id}`);
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  const fields = schema.createFields.map((key) => schema.fields.find((f) => f.key === key)!).filter(Boolean);

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/${collection}`} className="text-xs text-secondary underline">
        ← {schema.label}
      </Link>
      <h1 className="font-serif text-2xl text-primary mt-1 mb-6">New {schema.label.replace(/s$/, "").toLowerCase()}</h1>
      {error && <p className="text-warning text-sm mb-4">{error}</p>}
      <div className="rounded-2xl bg-card border border-border shadow-card p-6 flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs text-secondary font-sans">{f.label}</label>
            {f.refCollection ? (
              <RefSelect
                collection={f.refCollection}
                labelKey={f.refLabelKey ?? "name"}
                value={values[f.key] ?? ""}
                onChange={(v) => setValues((x) => ({ ...x, [f.key]: v }))}
              />
            ) : f.type === "textarea" ? (
              <textarea
                className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
                rows={4}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((x) => ({ ...x, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((x) => ({ ...x, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleCreate}
        disabled={saving}
        className="mt-6 rounded-pill bg-gold px-6 py-3 font-sans text-sm font-semibold text-primary"
      >
        {saving ? "Creating…" : "Create"}
      </button>
    </div>
  );
}
