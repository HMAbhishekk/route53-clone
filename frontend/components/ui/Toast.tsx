"use client";
import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <div className={`toast toast-${type}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {type === "success" ? <CheckCircle size={15} /> : <XCircle size={15} />}
        <span style={{ flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, marginLeft: 8 }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
