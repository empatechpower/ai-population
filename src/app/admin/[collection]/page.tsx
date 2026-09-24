"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/client";
import { ADMIN_SCHEMAS } from "@/lib/admin/schema";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { formatDate } from "@/lib/admin/format";

export default function AdminCollectionList() {
  const params = useParams<{ collection: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const collection = params.collection;
  const schema = ADMIN_SCHEMAS[collection];

  const filterField = searchParams.get("filterField");
  const filterValue = searchParams.get("filterValue");

  const [docs, setDocs] = useState<any[] | null>(null);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  useEffect(() => {
    if (!schema) return;
    setDocs(null);
    setCursors([null]);
    setPageIndex(0);
    load(null);
  }, [collection, filterField, filterValue]);

  function load(cursor: string | null) {
    const qs = new URLSearchParams({ pageSize: "25" });
    if (cursor) qs.set("cursor", cursor);
    if (filterField && filterValue) {
      qs.set("filterField", filterField);
      qs.set("filterValue", filterValue);
    }
    adminFetch(`/api/admin/${collection}?${qs.toString()}`)
      .then((body) => {
        setDocs(body.docs);
        setNextCursor(body.nextCursor);
      })
      .catch((e) => setError(e.message));
  }

  function goNext() {
    if (!nextCursor) return;
    setCursors((c) => [...c, nextCursor]);
    setPageIndex((i) => i + 1);
    load(nextCursor);
  }

  function goPrev() {
    if (pageIndex === 0) return;
    const prevCursor = cursors[pageIndex - 1];
    setPageIndex((i) => i - 1);
    load(prevCursor);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      setDocs((d) => d?.filter((doc) => doc._id !== id) ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  if (!schema) return <p className="text-warning">Unknown collection.</p>;

  const primaryKey = schema.primaryKey;
  const primaryLabel = (doc: any) =>
    primaryKey ? (doc[primaryKey] ?? "(unknown)") : "View";
  const columns = schema.fields.filter((f) => f.listVisible && f.key !== primaryKey);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-primary">{schema.label}</h1>
        {schema.createFields && (
          <Link
            href={`/admin/${collection}/new`}
            className="rounded-pill bg-gold px-4 py-2 font-sans text-sm font-semibold text-primary"
          >
            + New {schema.label.replace(/s$/, "").toLowerCase()}
          </Link>
        )}
        {filterField && filterValue && (
          <button onClick={() => router.push(`/admin/${collection}`)} className="text-xs text-secondary underline">
            Clear filter ({filterField} = {filterValue.slice(0, 12)}…)
          </button>
        )}
      </div>
      {error && <p className="text-warning text-sm mb-4">{error}</p>}
      {!docs ? (
        <p className="text-secondary text-sm">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-secondary text-sm">No records.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="min-w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-secondary font-medium">{primaryKey ? schema.fields.find((f) => f.key === primaryKey)?.label : "ID"}</th>
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3 text-secondary font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc._id} className="border-b border-border last:border-0 hover:bg-section">
                  <td className="px-4 py-3">
                    <Link href={`/admin/${collection}/${doc._id}`} className="text-gold underline">
                      {primaryLabel(doc)}
                    </Link>
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-primary max-w-xs truncate">
                      {formatCell(doc[c.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPendingDelete(doc)}
                      disabled={deletingId === doc._id}
                      className="text-xs text-warning"
                    >
                      {deletingId === doc._id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingDelete && (
        <ConfirmModal
          title="Delete this record?"
          message={`${
            (primaryKey && pendingDelete[primaryKey]) || "This record"
          } will be permanently deleted. This cannot be undone.`}
          busy={deletingId === pendingDelete._id}
          onConfirm={() => handleDelete(pendingDelete._id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={goPrev}
          disabled={pageIndex === 0}
          className="rounded-pill px-4 py-2 text-sm bg-card border border-border disabled:opacity-40"
        >
          ← Prev
        </button>
        <button
          onClick={goNext}
          disabled={!nextCursor}
          className="rounded-pill px-4 py-2 text-sm bg-card border border-border disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const date = formatDate(value);
  if (date) return date;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
