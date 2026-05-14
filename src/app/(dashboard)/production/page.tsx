import { Suspense } from "react";
import { ProductionKanban } from "@/components/production/ProductionKanban";

export const metadata = {
  title: "Shooting — RM Studio",
};

export default function ProductionPage() {
  return (
    <Suspense fallback={<ProductionSkeleton />}>
      <ProductionKanban />
    </Suspense>
  );
}

function ProductionSkeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div
        style={{
          height: 28,
          width: 160,
          borderRadius: 6,
          background: "var(--app-elevated)",
          marginBottom: 24,
        }}
      />
      <div style={{ display: "flex", gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 260,
              flexShrink: 0,
              borderRadius: 10,
              background: "var(--app-surface)",
              padding: 12,
            }}
          >
            <div
              style={{
                height: 14,
                width: "60%",
                borderRadius: 4,
                background: "var(--app-elevated)",
                marginBottom: 12,
              }}
            />
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                style={{
                  height: 72,
                  borderRadius: 8,
                  background: "var(--app-elevated)",
                  marginBottom: 8,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
