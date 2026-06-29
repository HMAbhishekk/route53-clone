"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import api from "@/lib/api";
import { Plus, Search, RefreshCw, Trash2, Edit2, ChevronRight, X, Database, Upload } from "lucide-react";

interface Zone { id: string; name: string; comment: string; private_zone: boolean; record_count: number; status: string; created_at: string; }
interface DNSRecord { id: string; zone_id: string; name: string; record_type: string; ttl: number; value: string; routing_policy: string; alias: boolean; comment: string; created_at: string; }

const RECORD_TYPES = ["A","AAAA","CNAME","TXT","MX","NS","PTR","SRV","CAA"];
const ROUTING_POLICIES = ["Simple","Weighted","Latency","Failover","Geolocation","Multivalue"];
const emptyForm = { name: "", record_type: "A", ttl: 300, value: "", routing_policy: "Simple", alias: false, comment: "" };

export default function ZoneDetailPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zone, setZone] = useState<Zone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DNSRecord | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formLoading, setFormLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  useEffect(() => {
    api.get(`/api/zones/${zoneId}`).then(r => setZone(r.data)).catch(() => router.push("/hosted-zones"));
  }, [zoneId, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/zones/${zoneId}/records`, {
        params: { page, page_size: 20, search: search || undefined, record_type: typeFilter || undefined },
      });
      setRecords(data.records);
      setTotal(data.total);
    } catch { showToast("Failed to load records", "error"); }
    finally { setLoading(false); }
  }, [zoneId, page, search, typeFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1); }
  function toggleSelect(id: string) { setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSelected(selected.size === records.length ? new Set() : new Set(records.map(r => r.id))); }

  async function handleCreate() {
    if (!form.name.trim()) return showToast("Record name is required", "error");
    if (!form.value.trim()) return showToast("Value is required", "error");
    setFormLoading(true);
    try {
      await api.post(`/api/zones/${zoneId}/records`, form);
      showToast("DNS record created");
      setCreateOpen(false);
      setForm({ ...emptyForm });
      fetchRecords();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to create record", "error");
    } finally { setFormLoading(false); }
  }

  async function handleEdit() {
    if (!editRecord) return;
    setFormLoading(true);
    try {
      await api.put(`/api/zones/${zoneId}/records/${editRecord.id}`, {
        name: editRecord.name, ttl: editRecord.ttl, value: editRecord.value,
        comment: editRecord.comment, routing_policy: editRecord.routing_policy, alias: editRecord.alias,
      });
      showToast("Record updated");
      setEditRecord(null);
      fetchRecords();
    } catch { showToast("Failed to update record", "error"); }
    finally { setFormLoading(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/zones/${zoneId}/records/${deleteTarget.id}`);
      showToast("Record deleted");
      setDeleteTarget(null);
      setSelected(new Set());
      fetchRecords();
    } catch { showToast("Failed to delete", "error"); }
    finally { setDeleteLoading(false); }
  }

  async function handleBulkDelete() {
    setDeleteLoading(true);
    try {
      await Promise.all([...selected].map(id => api.delete(`/api/zones/${zoneId}/records/${id}`)));
      showToast(`${selected.size} record(s) deleted`);
      setBulkDeleteOpen(false);
      setSelected(new Set());
      fetchRecords();
    } catch { showToast("Some deletions failed", "error"); }
    finally { setDeleteLoading(false); }
  }

  async function handleImportBind(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(`/api/zones/${zoneId}/import/bind`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(`Imported ${data.imported} records (${data.skipped} skipped)`);
      fetchRecords();
    } catch { showToast("Import failed", "error"); }
    finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const RecordForm = ({ data, onChange }: { data: any; onChange: (fn: any) => void }) => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Record name <span style={{ color: "var(--aws-danger)" }}>*</span></label>
          <input className="aws-input" placeholder="e.g. www" value={data.name}
            onChange={e => onChange((f: any) => ({ ...f, name: e.target.value }))} />
          {zone && <div className="form-hint">.{zone.name}</div>}
        </div>
        <div className="form-group">
          <label className="form-label">Record type</label>
          <select className="aws-select" value={data.record_type}
            onChange={e => onChange((f: any) => ({ ...f, record_type: e.target.value }))}>
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="form-label">TTL (seconds)</label>
          <input className="aws-input" type="number" min={0} value={data.ttl}
            onChange={e => onChange((f: any) => ({ ...f, ttl: parseInt(e.target.value) || 300 }))} />
          <div className="form-hint">300 = 5 min · 3600 = 1 hour</div>
        </div>
        <div className="form-group">
          <label className="form-label">Routing policy</label>
          <select className="aws-select" value={data.routing_policy}
            onChange={e => onChange((f: any) => ({ ...f, routing_policy: e.target.value }))}>
            {ROUTING_POLICIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Value <span style={{ color: "var(--aws-danger)" }}>*</span></label>
        <textarea className="aws-input" rows={3} placeholder="Enter value(s), one per line"
          value={data.value} onChange={e => onChange((f: any) => ({ ...f, value: e.target.value }))}
          style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Comment</label>
        <input className="aws-input" placeholder="Optional" value={data.comment}
          onChange={e => onChange((f: any) => ({ ...f, comment: e.target.value }))} />
      </div>
    </>
  );

  return (
    <AppShell onNew={() => setCreateOpen(true)} onRefresh={fetchRecords} onFocusSearch={() => searchRef.current?.focus()}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--aws-text-muted)", marginBottom: 16 }}>
        <span className="aws-link" onClick={() => router.push("/hosted-zones")}>Hosted zones</span>
        <ChevronRight size={12} />
        <span style={{ color: "var(--aws-text-bright)" }}>{zone?.name || zoneId}</span>
      </div>

      {/* Zone info banner */}
      {zone && (
        <div className="aws-panel" style={{ padding: "12px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { label: "Domain name", value: zone.name },
            { label: "Type", value: zone.private_zone ? "Private" : "Public" },
            { label: "Record count", value: zone.record_count },
            { label: "Status", value: <span className={zone.status === "INSYNC" ? "badge-insync" : "badge-pending"}>{zone.status}</span> },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="form-label" style={{ marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--aws-text-bright)", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--aws-text-bright)" }}>DNS records</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {selected.size > 1 && (
            <button className="btn-danger" onClick={() => setBulkDeleteOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Trash2 size={13} /> Delete {selected.size}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".zone,.txt" style={{ display: "none" }} onChange={handleImportBind} />
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}
            disabled={importLoading} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={13} /> {importLoading ? "Importing…" : "Import BIND"}
          </button>
          <button className="btn-primary" onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Create record
          </button>
        </div>
      </div>

      {/* Table panel */}
      <div className="aws-panel">
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--aws-border)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 6, flex: 1 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--aws-text-muted)" }} />
              <input ref={searchRef} className="aws-input" placeholder="Search by name  [/]"
                value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ paddingLeft: 28 }} />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <select className="aws-select" style={{ width: "auto" }} value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn-secondary" onClick={fetchRecords} style={{ display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={13} /></button>
          {selected.size === 1 && (
            <>
              <button className="btn-secondary" onClick={() => { const r = records.find(r => selected.has(r.id)); if (r) setEditRecord({ ...r }); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}><Edit2 size={13} /> Edit</button>
              <button className="btn-danger" onClick={() => { const r = records.find(r => selected.has(r.id)); if (r) setDeleteTarget(r); }}
                style={{ display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={13} /> Delete</button>
            </>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="aws-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" className="aws-checkbox" checked={records.length > 0 && selected.size === records.length} onChange={toggleAll} /></th>
                <th>Record name</th>
                <th>Type</th>
                <th>Routing policy</th>
                <th>TTL</th>
                <th>Value</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--aws-text-muted)" }}>Loading…</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 48 }}>
                    <Database size={32} color="var(--aws-text-muted)" style={{ display: "block", margin: "0 auto 12px" }} />
                    <div style={{ color: "var(--aws-text-muted)", fontSize: 13 }}>No DNS records found</div>
                    <div style={{ color: "var(--aws-text-muted)", fontSize: 12, marginTop: 4 }}>Press Ctrl+N or click Create record</div>
                  </td>
                </tr>
              ) : records.map(r => (
                <tr key={r.id} className={selected.has(r.id) ? "selected" : ""}>
                  <td><input type="checkbox" className="aws-checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--aws-blue-light)" }}>{r.name}</td>
                  <td>
                    <span style={{ background: "rgba(0,115,187,0.15)", color: "var(--aws-blue-light)", border: "1px solid rgba(0,115,187,0.3)", borderRadius: 2, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>
                      {r.record_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>{r.routing_policy}</td>
                  <td style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>{r.ttl}s</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</td>
                  <td style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>{r.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, color: "var(--aws-text-bright)", fontSize: 15 }}>Create DNS record</span>
              <button onClick={() => setCreateOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)" }}><X size={16} /></button>
            </div>
            <div className="modal-body"><RecordForm data={form} onChange={setForm} /></div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={formLoading}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={formLoading}>{formLoading ? "Creating…" : "Create record"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRecord && (
        <div className="modal-overlay" onClick={() => setEditRecord(null)}>
          <div className="modal-box" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontWeight: 700, color: "var(--aws-text-bright)", fontSize: 15 }}>Edit DNS record</span>
              <button onClick={() => setEditRecord(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--aws-text-muted)" }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "8px 12px", background: "var(--aws-surface)", borderRadius: 2, marginBottom: 16, fontSize: 12, color: "var(--aws-text-muted)", fontFamily: "monospace" }}>
                {editRecord.record_type} record
              </div>
              <RecordForm data={editRecord} onChange={(fn: any) => setEditRecord((r: any) => fn((f: any) => ({ ...r, ...f(r) })))} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditRecord(null)} disabled={formLoading}>Cancel</button>
              <button className="btn-primary" onClick={handleEdit} disabled={formLoading}>{formLoading ? "Saving…" : "Save changes"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal title="Delete DNS record"
          message={`Delete "${deleteTarget.name}" (${deleteTarget.record_type})? This cannot be undone.`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      )}

      {bulkDeleteOpen && (
        <ConfirmModal title={`Delete ${selected.size} records`}
          message={`Permanently delete ${selected.size} DNS records? This cannot be undone.`}
          confirmLabel={`Delete ${selected.size} records`}
          onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} loading={deleteLoading} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}