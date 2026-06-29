"use client";
import AppShell from "@/components/layout/AppShell";
import { Globe, Activity, BarChart2, Network, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const cards = [
    { icon: Globe, label: "Hosted zones", desc: "Manage DNS zones for your domains", href: "/hosted-zones", color: "#ff9900" },
    { icon: Activity, label: "Health checks", desc: "Monitor endpoint availability", href: "/health-checks", color: "#00a8e1" },
    { icon: BarChart2, label: "Traffic policies", desc: "Route traffic with advanced policies", href: "/traffic-policies", color: "#1db954" },
    { icon: Network, label: "Resolver", desc: "Hybrid DNS for AWS and on-premises", href: "/resolver", color: "#9b59b6" },
    { icon: Shield, label: "Profiles", desc: "Share Route 53 configurations", href: "/profiles", color: "#e74c3c" },
  ];
  return (
    <AppShell>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--aws-text-bright)", marginBottom: 8, marginTop: 0 }}>Route 53 Dashboard</h1>
      <p style={{ color: "var(--aws-text-muted)", fontSize: 13, marginBottom: 28 }}>Scalable DNS and domain name management</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {cards.map(({ icon: Icon, label, desc, href, color }) => (
          <div key={label} className="aws-panel" onClick={() => router.push(href)}
            style={{ padding: 20, cursor: "pointer", transition: "border-color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--aws-border)")}>
            <Icon size={24} color={color} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: "var(--aws-text-bright)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>{desc}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
