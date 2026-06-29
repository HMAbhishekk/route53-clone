"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid var(--aws-border)" }}>
      <span style={{ fontSize: 12, color: "var(--aws-text-muted)" }}>
        {start}–{end} of {total}
      </span>
      <div className="pagination">
        <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} className={`page-btn ${p === page ? "active" : ""}`} onClick={() => onChange(p)}>
              {p}
            </button>
          );
        })}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
