"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getUser } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Globe, ChevronDown, Bell, HelpCircle, Sun, Moon, Keyboard } from "lucide-react";

interface TopNavProps {
  onShowShortcuts?: () => void;
}

export default function TopNav({ onShowShortcuts }: TopNavProps) {
  const router = useRouter();
  const user = getUser();
  const { theme, toggle } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  useEffect(() => {
    function handleClick() { setDropdownOpen(false); }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <header style={{
      background: "#0d1117",
      borderBottom: "1px solid #1e2a38",
      height: 48,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* AWS Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[0,1,2].map(r => (
            <div key={r} style={{ display: "flex", gap: 2 }}>
              {[0,1,2].map(c => (
                <div key={c} style={{ width: 6, height: 6, background: "var(--aws-orange)", borderRadius: 1 }} />
              ))}
            </div>
          ))}
        </div>
        <span style={{ color: "var(--aws-text-bright)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
          aws
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: "flex", alignItems: "center", flex: 1 }}>
        {["Services", "Resources", "CloudShell", "Support"].map((item) => (
          <button key={item} style={{
            background: "none", border: "none", color: "var(--aws-text)", fontSize: 13,
            padding: "0 12px", height: 48, cursor: "pointer", display: "flex",
            alignItems: "center", gap: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {item} <ChevronDown size={12} />
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center" }}>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{ background: "none", border: "none", color: "var(--aws-text)", height: 48, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--aws-orange)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--aws-text)")}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Keyboard shortcuts */}
        <button
          onClick={onShowShortcuts}
          title="Keyboard shortcuts (?)"
          style={{ background: "none", border: "none", color: "var(--aws-text)", height: 48, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--aws-orange)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--aws-text)")}
        >
          <Keyboard size={15} />
        </button>

        <button style={{ background: "none", border: "none", color: "var(--aws-text)", height: 48, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Bell size={15} />
        </button>
        <button style={{ background: "none", border: "none", color: "var(--aws-text)", height: 48, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <HelpCircle size={15} />
        </button>

        <div style={{ width: 1, height: 24, background: "var(--aws-border)", margin: "0 4px" }} />

        {/* Account dropdown */}
        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setDropdownOpen(d => !d)}
            style={{
              background: "none", border: "none", color: "var(--aws-text)", fontSize: 13,
              padding: "0 12px", height: 48, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--aws-text-bright)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--aws-text)")}
          >
            <Globe size={13} />
            {user?.username || "Account"} <ChevronDown size={12} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", right: 0, top: "100%", marginTop: 4,
              background: "#1b2430", border: "1px solid var(--aws-border)",
              borderRadius: 4, minWidth: 180, zIndex: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              <div style={{
                padding: "8px 14px",
                borderBottom: "1px solid var(--aws-border)",
                fontSize: 11,
                color: "var(--aws-text-muted)",
              }}>
                Signed in as{" "}
                <strong style={{ color: "var(--aws-text-bright)" }}>{user?.username}</strong>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "10px 14px", background: "none", border: "none",
                  color: "var(--aws-text)", fontSize: 13, cursor: "pointer",
                  textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                Sign out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}