"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setSession } from "@/lib/auth";
import { Globe, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = tab === "login"
        ? { username: form.username, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      setSession(data.access_token, data.user);
      router.push("/hosted-zones");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--aws-navy)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[0,1,2].map(r => (
              <div key={r} style={{ display: "flex", gap: 2 }}>
                {[0,1,2].map(c => <div key={c} style={{ width: 8, height: 8, background: "var(--aws-orange)", borderRadius: 1 }} />)}
              </div>
            ))}
          </div>
          <span style={{ color: "var(--aws-text-bright)", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em" }}>
            aws
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
          <Globe size={14} color="var(--aws-text-muted)" />
          <span style={{ fontSize: 13, color: "var(--aws-text-muted)" }}>Route 53 — DNS Management</span>
        </div>
      </div>

      {/* Card */}
      <div className="aws-panel" style={{ width: "100%", maxWidth: 380, overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--aws-border)" }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
              flex: 1, padding: "12px 0", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid var(--aws-orange)" : "2px solid transparent",
              color: tab === t ? "var(--aws-text-bright)" : "var(--aws-text-muted)",
              fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer",
              marginBottom: -1, transition: "color 0.15s",
            }}>
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="aws-input"
              autoFocus
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
          </div>

          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="aws-input"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="aws-input"
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={handleKeyDown}
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)", padding: 0 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(229,62,62,0.1)", border: "1px solid var(--aws-danger)", borderRadius: 2, padding: "8px 12px", color: "var(--aws-danger)", fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: "100%", padding: "10px 0", fontSize: 14 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (tab === "login" ? "Signing in…" : "Creating account…") : (tab === "login" ? "Sign in" : "Create account")}
          </button>

          {tab === "login" && (
            <div style={{ marginTop: 16, padding: 12, background: "rgba(0,168,225,0.08)", border: "1px solid rgba(0,168,225,0.2)", borderRadius: 2 }}>
              <div style={{ fontSize: 11, color: "var(--aws-text-muted)", marginBottom: 4, fontWeight: 600 }}>DEMO CREDENTIALS</div>
              <div style={{ fontSize: 12, color: "var(--aws-blue-light)" }}>
                Register an account to get started. No AWS account needed.
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: "var(--aws-text-muted)" }}>
        © 2024 AWS Route 53 Clone — For demonstration purposes only
      </div>
    </div>
  );
}
