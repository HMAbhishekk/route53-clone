"use client";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  onClose: () => void;
  shortcuts: { key: string; ctrl?: boolean; shift?: boolean; description: string }[];
}

export default function ShortcutsModal({ onClose, shortcuts }: ShortcutsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Keyboard size={16} color="var(--aws-orange)" />
            <span style={{ fontWeight: 700, color: "var(--aws-text-bright)", fontSize: 15 }}>
              Keyboard Shortcuts
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {shortcuts.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--aws-border)" }}>
                  <td style={{ padding: "10px 0", color: "var(--aws-text)", fontSize: 13 }}>
                    {s.description}
                  </td>
                  <td style={{ padding: "10px 0", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      {s.ctrl && <Kbd>Ctrl</Kbd>}
                      {s.shift && <Kbd>Shift</Kbd>}
                      <Kbd>{s.key.toUpperCase()}</Kbd>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd style={{
      background: "var(--aws-surface)",
      border: "1px solid var(--aws-border)",
      borderRadius: 3,
      padding: "2px 8px",
      fontSize: 11,
      fontFamily: "monospace",
      color: "var(--aws-text-bright)",
      boxShadow: "0 1px 0 var(--aws-border)",
    }}>
      {children}
    </kbd>
  );
}