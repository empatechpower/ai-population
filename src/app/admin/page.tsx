"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/client";
import { ADMIN_SCHEMAS } from "@/lib/admin/schema";

export default function AdminHome() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/stats")
      .then((body) => setCounts(body.counts))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl text-primary mb-6">Dashboard</h1>
      {error && <p className="text-warning text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.values(ADMIN_SCHEMAS).map((schema) => (
          <Link
            key={schema.name}
            href={`/admin/${schema.name}`}
            className="rounded-2xl bg-card border border-border shadow-card p-5 hover:shadow-gold transition-shadow"
          >
            <p className="text-xs text-secondary font-sans mb-1">{schema.label}</p>
            <p className="font-serif text-3xl text-gold">
              {counts ? (counts[schema.name] ?? 0) : "…"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
