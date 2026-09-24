"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/client";
import { ADMIN_SCHEMAS, FieldSchema } from "@/lib/admin/schema";
import ConfirmModal from "@/components/admin/ConfirmModal";
import RefSelect from "@/components/admin/RefSelect";
import { formatDate } from "@/lib/admin/format";

interface OtherField {
  key: string;
  raw: string; // JSON-stringified value, edited as text
}

export default function AdminRecordEdit() {
  const params = useParams<{ collection: string; id: string }>();
  const router = useRouter();
  const { collection, id } = params;
  const schema = ADMIN_SCHEMAS[collection];

  const [doc, setDoc] = useState<Record<string, any> | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [otherFields, setOtherFields] = useState<OtherField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!schema) return;
    adminFetch(`/api/admin/${collection}/${id}`)
      .then((body) => {
        setDoc(body);
        const known = new Set(schema.fields.map((f) => f.key));
        const initial: Record<string, any> = {};
        schema.fields.forEach((f) => (initial[f.key] = body[f.key]));
        setValues(initial);
        setOtherFields(
          Object.keys(body)
            .filter((k) => !known.has(k) && k !== "_id")
            .map((k) => ({ key: k, raw: JSON.stringify(body[k], null, 2) })),
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [collection, id]);

  function setField(key: string, value: any) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updates: Record<string, any> = {};
      schema.fields.forEach((f) => {
        if (!f.readOnly) updates[f.key] = values[f.key];
      });
      for (const of of otherFields) {
        try {
          updates[of.key] = JSON.parse(of.raw);
        } catch {
          throw new Error(`"${of.key}" in Other fields isn't valid JSON`);
        }
      }
      await adminFetch(`/api/admin/${collection}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      });
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      router.push(`/admin/${collection}`);
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (!schema) return <p className="text-warning">Unknown collection.</p>;
  if (loading) return <p className="text-secondary text-sm">Loading…</p>;
  if (!doc) return <p className="text-warning text-sm">{error || "Not found."}</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/${collection}`} className="text-xs text-secondary underline">
            ← {schema.label}
          </Link>
          <h1 className="font-serif text-2xl text-primary mt-1">{schema.primaryKey && doc[schema.primaryKey] ? doc[schema.primaryKey] : "Record details"}</h1>
        </div>
        <button onClick={() => setConfirmingDelete(true)} disabled={deleting} className="text-sm text-warning">
          {deleting ? "Deleting…" : "Delete record"}
        </button>
      </div>

      {confirmingDelete && (
        <ConfirmModal
          title="Delete this record?"
          message={`${
            schema.primaryKey && doc[schema.primaryKey] ? doc[schema.primaryKey] : "This record"
          } will be permanently deleted. This cannot be undone.`}
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
      {error && <p className="text-warning text-sm mb-4">{error}</p>}
      {saved && <p className="text-success text-sm mb-4">Saved.</p>}

      <div className="rounded-2xl bg-card border border-border shadow-card p-6 flex flex-col gap-4">
        {schema.fields.map((f) => (
          <FieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
        ))}
      </div>

      <div className="mt-6">
        <h2 className="font-sans text-sm font-semibold text-secondary mb-2">Other fields</h2>
        <div className="rounded-2xl bg-card border border-border shadow-card p-6 flex flex-col gap-4">
          {otherFields.length === 0 && <p className="text-xs text-muted">No extra fields on this document.</p>}
          {otherFields.map((of, i) => (
            <div key={of.key} className="flex flex-col gap-1">
              <label className="text-xs text-secondary font-sans">{of.key}</label>
              <textarea
                className="rounded-2xl border border-border bg-elevated px-3 py-2 text-sm font-mono"
                rows={2}
                value={of.raw}
                onChange={(e) =>
                  setOtherFields((list) => list.map((x, idx) => (idx === i ? { ...x, raw: e.target.value } : x)))
                }
              />
            </div>
          ))}
          <AddFieldControl onAdd={(key) => setOtherFields((list) => [...list, { key, raw: '""' }])} />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-pill bg-gold px-6 py-3 font-sans text-sm font-semibold text-primary"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>

      {schema.relatedCollections && schema.relatedCollections.length > 0 && (
        <div className="mt-8">
          <h2 className="font-sans text-sm font-semibold text-secondary mb-2">Related data</h2>
          <div className="flex flex-wrap gap-2">
            {schema.relatedCollections.map((rel) => (
              <Link
                key={rel.collection}
                href={`/admin/${rel.collection}?filterField=${rel.filterField}&filterValue=${id}`}
                className="rounded-pill bg-card border border-border px-4 py-2 text-sm text-primary"
              >
                {ADMIN_SCHEMAS[rel.collection]?.label ?? rel.collection}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSchema;
  value: any;
  onChange: (v: any) => void;
}) {
  const displayValue = (v: any) => {
    const date = formatDate(v, true);
    if (date) return date;
    if (field.type === "array" || (v !== null && typeof v === "object")) return JSON.stringify(v);
    return v ?? "";
  };

  if (field.readOnly) {
    return (
      <div>
        <label className="text-xs text-secondary font-sans">{field.label}</label>
        <p className="text-sm text-muted font-sans mt-1 break-all">{displayValue(value) || "—"}</p>
      </div>
    );
  }

  if (field.refCollection) {
    return (
      <div>
        <label className="text-xs text-secondary font-sans">{field.label}</label>
        <RefSelect
          collection={field.refCollection}
          labelKey={field.refLabelKey ?? "name"}
          value={value}
          onChange={onChange}
        />
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-sans text-primary">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="text-xs text-secondary font-sans">{field.label}</label>
        <textarea
          className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "array") {
    return (
      <div>
        <label className="text-xs text-secondary font-sans">{field.label} (JSON array)</label>
        <textarea
          className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm font-mono"
          rows={3}
          value={JSON.stringify(value ?? [], null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // ignore until valid JSON — user is still typing
            }
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs text-secondary font-sans">{field.label}</label>
      <input
        type={field.type === "number" ? "number" : "text"}
        className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}

function AddFieldControl({ onAdd }: { onAdd: (key: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
        placeholder="New field name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name.trim());
          setName("");
        }}
        className="rounded-pill bg-card border border-border px-4 py-2 text-sm text-primary"
      >
        + Add field
      </button>
    </div>
  );
}
