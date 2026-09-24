"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ADMIN_SCHEMAS } from "@/lib/admin/schema";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile(true, false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (profile && !profile.is_admin) router.push("/dashboard");
  }, [profile, router]);

  if (!profile) return <LoadingScreen message="Loading admin..." />;
  if (!profile.is_admin) return null;

  return (
    <div className="fixed inset-0 z-[60] flex bg-bg">
      <aside className="w-56 shrink-0 overflow-y-auto bg-card border-r border-border p-4">
        <Link href="/admin" className="block font-serif text-lg text-primary mb-6">
          Bleom Admin
        </Link>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin"
            className={`rounded-2xl px-3 py-2 text-sm font-sans ${
              pathname === "/admin" ? "bg-gold-light text-primary font-semibold" : "text-secondary"
            }`}
          >
            Dashboard
          </Link>
          {Object.values(ADMIN_SCHEMAS).map((schema) => (
            <Link
              key={schema.name}
              href={`/admin/${schema.name}`}
              className={`rounded-2xl px-3 py-2 text-sm font-sans ${
                pathname?.startsWith(`/admin/${schema.name}`)
                  ? "bg-gold-light text-primary font-semibold"
                  : "text-secondary"
              }`}
            >
              {schema.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="block mt-6 text-xs text-muted font-sans">
          ← Back to app
        </Link>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
