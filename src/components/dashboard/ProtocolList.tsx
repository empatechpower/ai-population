"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Protocol {
  nutrition_plan: string;
  supplements: string;
  movement: string;
  avoid_today: string;
  fertility_tip: string;
}

const protocolItems = (p: Protocol) => [
  {
    icon: "🌿",
    label: "Nutrition Focus",
    value: p.nutrition_plan,
    href: "/nutrition",
  },
  { icon: "💊", label: "Supplements", value: p.supplements, href: null },
  { icon: "🏃", label: "Movement", value: p.movement, href: "/movement" },
  { icon: "⚡", label: "Avoid Today", value: p.avoid_today, href: null },
  { icon: "💡", label: "Fertility Tip", value: p.fertility_tip, href: null },
];

export default function ProtocolList({ protocol }: { protocol: Protocol }) {
  const router = useRouter();
  const items = protocolItems(protocol);

  return (
    <div className="px-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif text-lg text-charcoal">
            Your Protocol for Today
          </h3>
          <p className="text-xs text-muted">AI protocol for you</p>
        </div>
        <button
          onClick={() => router.push("/journey/protocol")}
          className="text-xs bg-gold text-white px-3 py-1.5 rounded-pill font-medium flex items-center gap-1"
        >
          ↺ Recalibrate
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {items &&
          items?.map((item) => (
            <div
              key={item.label}
              onClick={() => item.href && router.push(item.href)}
              className={`bg-white border border-border rounded-2xl px-4 py-3 ${item.href ? "cursor-pointer hover:border-gold/40 transition-colors" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-base mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted uppercase tracking-wider font-medium mb-1">
                    {item.label}
                  </p>
                  {item.label === "Supplements" ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.value.split(",")?.map((s) => (
                        <span
                          key={s.trim()}
                          className="text-xs bg-gold-light text-gold-dark px-2.5 py-1 rounded-pill border border-gold/20 font-medium"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-charcoal leading-relaxed">
                      {item.value}
                    </p>
                  )}
                </div>
                {item.href && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888580"
                    strokeWidth="2"
                    className="flex-shrink-0 mt-0.5"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
