"use client";
import AppShell from "@/components/layout/AppShell";
import { Construction } from "lucide-react";
export default function Page() {
  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
        <Construction size={48} color="var(--aws-orange)" />
        <h2 style={{ margin: 0, color: "var(--aws-text-bright)", fontSize: 20 }}>Traffic Policies</h2>
        <p style={{ color: "var(--aws-text-muted)", fontSize: 14, textAlign: "center", maxWidth: 360 }}>
          This section is coming soon. Core DNS management is available in Hosted Zones.
        </p>
        <span style={{ background: "rgba(255,153,0,0.1)", border: "1px solid rgba(255,153,0,0.3)", color: "var(--aws-orange)", borderRadius: 2, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>COMING SOON</span>
      </div>
    </AppShell>
  );
}
