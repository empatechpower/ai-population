"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

export default function RefSelect({
  collection,
  labelKey,
  value,
  onChange,
}: {
  collection: string;
  labelKey: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    adminFetch(`/api/admin/${collection}?pageSize=100`)
      .then((body) => setOptions(body.docs.map((d: any) => ({ id: d._id, label: d[labelKey] || d._id }))))
      .catch(() => {});
  }, [collection, labelKey]);

  return (
    <select
      className="mt-1 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— None (general feed) —</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
