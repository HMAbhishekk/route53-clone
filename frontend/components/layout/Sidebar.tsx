"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe, Shield, Activity, Network, Layout, BarChart2, ChevronRight
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Layout },
  { label: "Hosted zones", href: "/hosted-zones", icon: Globe },
  { label: "Health checks", href: "/health-checks", icon: Activity },
  { label: "Traffic policies", href: "/traffic-policies", icon: BarChart2 },
  { label: "Resolver", href: "/resolver", icon: Network },
  { label: "Profiles", href: "/profiles", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: "var(--aws-panel)",
      borderRight: "1px solid var(--aws-border)",
      minHeight: "calc(100vh - 48px)",
      display: "flex",
      flexDirection: "column",
      paddingTop: 8,
    }}>
      {/* Service title */}
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid var(--aws-border)", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={16} color="var(--aws-orange)" />
          <span style={{ color: "var(--aws-text-bright)", fontWeight: 700, fontSize: 13 }}>Route 53</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--aws-text-muted)", marginTop: 2, paddingLeft: 24 }}>
          DNS Management
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 16px",
                fontSize: 13,
                color: active ? "var(--aws-text-bright)" : "var(--aws-text)",
                background: active ? "rgba(255,153,0,0.1)" : "transparent",
                borderLeft: active ? "3px solid var(--aws-orange)" : "3px solid transparent",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={14} color={active ? "var(--aws-orange)" : "var(--aws-text-muted)"} />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: "auto", color: "var(--aws-text-muted)" }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--aws-border)", fontSize: 11, color: "var(--aws-text-muted)" }}>
        Region: us-east-1
      </div>
    </aside>
  );
}
