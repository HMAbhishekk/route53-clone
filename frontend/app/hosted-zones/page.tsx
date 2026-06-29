"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import api from "@/lib/api";
import {
  Plus, Search, RefreshCw, Trash2, Edit2, Globe, X,
  ChevronRight, Download, Upload, FileJson, FileText
} from "lucide-react";

interface Zone {
  id: string; name: string; comment: string;
  private_zone: boolean; record_count: number;
  status: string; caller_reference: string; created_at: string;
}

export default function HostedZonesPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportMenuZone, setExportMenuZone] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({ name: "", comment: "", private_zone: false });
  const [createLoading, setCreateLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/zones", {
        params: { page, page_size: 20, search: search || undefined },
      });
      setZones(data.zones);
      setTotal(data.total);
    } catch {
      showToast("Failed to load hosted zones", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  useEffect(() => {
    function handleClick() { setExportMenuZone(null); }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === zones.length ? new Set() : new Set(zones.map(z => z.id)));
  }

  async function handleCreate() {
    if (!createForm.name.trim()) return showToast("Zone name is required", "error");
    setCreateLoading(true);
    try {
      await api.post("/api/zones", createForm);
      showToast(`Hosted zone "${createForm.name}" created`);
      setCreateOpen(false);
      setCreateForm({ name: "", comment: "", private_zone: false });
      fetchZones();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to create zone", "error");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit() {
    if (!editZone) return;
    try {
      await api.put(`/api/zones/${editZone.id}`, { comment: editZone.comment });
      showToast("Zone updated");
      setEditZone(null);
      fetchZones();
    } catch {
      showToast("Failed to update zone", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/zones/${deleteTarget.id}`);
      showToast(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      setSelected(new Set());
      fetchZones();
    } catch {
      showToast("Failed to delete zone", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleBulkDelete() {
    setDeleteLoading(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/api/zones/${id}`)));
      showToast(`${selected.size} zone(s) deleted`);
      setBulkDeleteOpen(false);
      setSelected(new Set());
      fetchZones();
    } catch {
      showToast("Some deletions failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleExport(zoneId: string, format: "json" | "bind") {
    try {
      const res = await api.get(`/api/zones/${zoneId}/export/${format}`, { responseType: "blob" });
      const zone = zones.find(z => z.id === zoneId);
      const ext = format === "json" ? "json" : "zone";
      const name = zone?.name.replace(/\.$/, "") || "zone";
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url; a.download = `${name}.${ext}`; a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported as ${format.toUpperCase()}`);
    } catch {
      showToast("Export failed", "error");
    }
    setExportMenuZone(null);
  }

  return (
    <AppShell
      onNew={() => setCreateOpen(true)}
      onRefresh={fetchZones}
      onFocusSearch={() => searchRef.current?.focus()}
    >
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--aws-text-muted)", marginBottom: 16 }}>
        <span>Route 53</span>
        <ChevronRight size={12} />
        <span style={{ color: "var(--aws-text-bright)" }}>Hosted zones</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--aws-text-bright)" }}>Hosted zones</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--aws-text-muted)" }}>
            Manage DNS zones for your domains. Press{" "}
            <kbd style={{ background: "var(--aws-surface)", border: "1px solid var(--aws-border)", borderRadius: 3, padding: "1px 5px", fontSize: 11 }}>?</kbd>
            {" "}for shortcuts.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selected.size > 1 && (
            <button className="btn-danger" onClick={() => setBulkDeleteOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={13} /> Delete {selected.size} zones
            </button>
          )}
          <button className="btn-primary" onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Create hosted zone
          </button>
        </div>
      </div>

      {/* Table panel */}
      <div className="aws-panel">
        {/* Toolbar */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--aws-border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 6, flex: 1 }}>
            <div style={{ position: "relative", maxWidth: 320, flex: 1 }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--aws-text-muted)" }} />
              <input ref={searchRef} className="aws-input" placeholder="Search by domain name  [/]"
                value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: 28 }} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
            {search && (
              <button type="button" className="btn-secondary" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
                <X size={13} />
              </button>
            )}
          </form>
          <button className="btn-secondary" onClick={fetchZones} style={{ display: "flex", alignItems: "center", gap: 4 }} title="Refresh [Ctrl+R]">
            <RefreshCw size={13} />
          </button>
          {selected.size === 1 && (
            <>
              <button className="btn-secondary" onClick={() => { const z = zones.find(z => selected.has(z.id)); if (z) setEditZone({ ...z }); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Edit2 size={13} /> Edit
              </button>
              <button className="btn-danger" onClick={() => { const z = zones.find(z => selected.has(z.id)); if (z) setDeleteTarget(z); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table className="aws-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" className="aws-checkbox"
                    checked={zones.length > 0 && selected.size === zones.length} onChange={toggleAll} />
                </th>
                <th>Domain name</th>
                <th>Type</th>
                <th>Records</th>
                <th>Status</th>
                <th>Comment</th>
                <th>Hosted zone ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--aws-text-muted)" }}>Loading…</td></tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 48 }}>
                    <Globe size={32} color="var(--aws-text-muted)" style={{ display: "block", margin: "0 auto 12px" }} />
                    <div style={{ color: "var(--aws-text-muted)", fontSize: 13 }}>No hosted zones found</div>
                    <div style={{ color: "var(--aws-text-muted)", fontSize: 12, marginTop: 4 }}>
                      {search ? "Try a different search" : "Press Ctrl+N or click Create hosted zone to get started"}
                    </div>
                  </td>
                </tr>
              ) : (
                zones.map(zone => (
                  <tr key={zone.id} className={selected.has(zone.id) ? "selected" : ""}>
                    <td><input type="checkbox" className="aws-checkbox" checked={selected.has(zone.id)} onChange={() => toggleSelect(zone.id)} /></td>
                    <td>
                      <span className="aws-link" onClick={() => router.push(`/hosted-zones/${zone.id}`)} style={{ fontWeight: 500 }}>
                        {zone.name}
                      </span>
                    </td>
                    <td><span style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>{zone.private_zone ? "Private" : "Public"}</span></td>
                    <td>{zone.record_count}</td>
                    <td><span className={zone.status === "INSYNC" ? "badge-insync" : "badge-pending"}>{zone.status}</span></td>
                    <td style={{ color: "var(--aws-text-muted)", fontSize: 12 }}>{zone.comment || "—"}</td>
                    <td><span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--aws-text-muted)" }}>/hostedzone/{zone.id.slice(0, 14)}…</span></td>
                    <td>
                      <div style={{ position: "relative", display: "inline-block" }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-secondary"
                          style={{ padding: "4px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                          onClick={() => setExportMenuZone(exportMenuZone === zone.id ? null : zone.id)}
                        >
                          <Download size={12} /> Export
                        </button>
                        {exportMenuZone === zone.id && (
                          <div style={{
                            position: "absolute", right: 0, top: "100%", marginTop: 4,
                            background: "var(--aws-panel)", border: "1px solid var(--aws-border)",
                            borderRadius: 4, zIndex: 50, minWidth: 160,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                          }}>
                            <button onClick={() => handleExport(zone.id, "json")}
                              style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: "var(--aws-text)", fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}
                            >
                              <FileJson size={14} color="var(--aws-orange)" /> Export as JSON
                            </button>
                            <button onClick={() => handleExport(zone.id, "bind")}
                              style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: "var(--aws-text)", fontSize: 13, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}
                            >
                              <FileText size={14} color="var(--aws-blue-light)" /> Export as BIND
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, color: "var(--aws-text-bright)", fontSize: 15 }}>Create hosted zone</span>
              <button onClick={() => setCreateOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)" }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Domain name <span style={{ color: "var(--aws-danger)" }}>*</span></label>
                <input className="aws-input" autoFocus placeholder="e.g. example.com"
                  value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleCreate()} />
                <div className="form-hint">Do not include a trailing dot — it will be added automatically.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <input className="aws-input" placeholder="Optional description"
                  value={createForm.comment} onChange={e => setCreateForm(f => ({ ...f, comment: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" className="aws-checkbox" checked={createForm.private_zone}
                    onChange={e => setCreateForm(f => ({ ...f, private_zone: e.target.checked }))} />
                  <span style={{ fontSize: 13 }}>Private hosted zone</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={createLoading}>
                {createLoading ? "Creating…" : "Create hosted zone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editZone && (
        <div className="modal-overlay" onClick={() => setEditZone(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, color: "var(--aws-text-bright)", fontSize: 15 }}>Edit hosted zone</span>
              <button onClick={() => setEditZone(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)" }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "8px 12px", background: "var(--aws-surface)", borderRadius: 2, marginBottom: 16, fontSize: 12, color: "var(--aws-text-muted)", fontFamily: "monospace" }}>
                {editZone.name}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Comment</label>
                <input className="aws-input" autoFocus value={editZone.comment}
                  onChange={e => setEditZone(z => z ? { ...z, comment: e.target.value } : null)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditZone(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleEdit}>Save changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete hosted zone"
          message={`Delete "${deleteTarget.name}"? All DNS records will also be permanently deleted.`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading}
        />
      )}

      {bulkDeleteOpen && (
        <ConfirmModal
          title={`Delete ${selected.size} hosted zones`}
          message={`Permanently delete ${selected.size} hosted zones and all their DNS records? This cannot be undone.`}
          confirmLabel={`Delete ${selected.size} zones`}
          onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} loading={deleteLoading}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}