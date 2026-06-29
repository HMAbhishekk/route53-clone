"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";
import ShortcutsModal from "@/components/ui/ShortcutsModal";
import { useKeyboardShortcuts } from "@/lib/shortcuts";

const SHORTCUTS = [
  { key: "c", ctrl: true, shift: true, description: "Create new zone or record" },
  { key: "r", ctrl: true, shift: true, description: "Refresh current list" },
  { key: "/", description: "Focus search bar" },
  { key: "?", description: "Show keyboard shortcuts" },
  { key: "Escape", description: "Close modal / deselect" },
];

function Shell({ children, onNew, onRefresh, onFocusSearch }:
  { children: React.ReactNode; onNew?: () => void; onRefresh?: () => void; onFocusSearch?: () => void }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    else setReady(true);
  }, [router]);

  useKeyboardShortcuts([
    { key: "?", action: () => setShowShortcuts(s => !s), description: "Show shortcuts" },
    { key: "Escape", action: () => setShowShortcuts(false), description: "Close modal" },
    { key: "c", ctrl: true, shift: true, action: () => onNew?.(), description: "Create new" },
    { key: "r", ctrl: true, shift: true, action: () => onRefresh?.(), description: "Refresh" },
    { key: "/", action: () => onFocusSearch?.(), description: "Focus search" },
  ]);

  if (!ready) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <TopNav onShowShortcuts={() => setShowShortcuts(true)} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "24px", overflowX: "auto" }}>
          {children}
        </main>
      </div>
      {showShortcuts && (
        <ShortcutsModal shortcuts={SHORTCUTS} onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}

export default function AppShell({ children, onNew, onRefresh, onFocusSearch }:
  { children: React.ReactNode; onNew?: () => void; onRefresh?: () => void; onFocusSearch?: () => void }) {
  return (
    <ThemeProvider>
      <Shell onNew={onNew} onRefresh={onRefresh} onFocusSearch={onFocusSearch}>
        {children}
      </Shell>
    </ThemeProvider>
  );
}