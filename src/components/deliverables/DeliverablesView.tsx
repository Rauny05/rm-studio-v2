"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { DeliverableRow, DeliverableItem } from "@/app/api/deliverables/route";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#737373", bg: "rgba(115,115,115,0.1)" },
  "in-progress": { label: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  "awaiting-payment": { label: "Awaiting Payment", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  done: { label: "Done", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
};

const PAYMENT_STEPS = ["Email", "50%", "Paid"];

// ── DeliverableCard ───────────────────────────────────────────────────────────

function DeliverableCard({ row }: { row: DeliverableRow }) {
  const status = STATUS_CONFIG[row.overallStatus];
  const storageKey = `dl-advance-${row.id}`;

  const [advanceReceived, setAdvanceReceived] = useState<boolean>(() => {
    if (typeof window === "undefined") return row.advance50;
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? saved === "true" : row.advance50;
  });

  const toggleAdvance = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvanceReceived((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);

  return (
    <div className="dl-card" data-status={row.overallStatus}>
      <div className="dl-card-stripe" style={{ background: status.color }} />

      <div className="dl-card-inner">
        {/* Header */}
        <div className="dl-card-header">
          <span className="dl-pn-badge">{row.pnNo}</span>
          <span className="dl-status-pill" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
        </div>

        {/* Brand */}
        <h3 className="dl-brand">{row.brand}</h3>

        {/* Deliverables */}
        {row.deliverables.length > 0 && (
          <div className="dl-items">
            {row.deliverables.map((item, i) => (
              <DeliverableChip key={i} item={item} />
            ))}
          </div>
        )}

        <div className="dl-card-footer">
          {/* POC */}
          {row.pocName && (
            <div className="dl-poc">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="dl-poc-name">{row.pocName}</span>
              {row.pocCompany && <span className="dl-poc-company">{row.pocCompany}</span>}
            </div>
          )}

          {/* Payment pipeline */}
          <div className="dl-payment">
            {PAYMENT_STEPS.map((step, i) => (
              <div key={step} className="dl-payment-step">
                <div
                  className="dl-payment-dot"
                  data-active={i < row.paymentStep}
                  style={i < row.paymentStep ? { background: "#22c55e", borderColor: "#22c55e" } : {}}
                >
                  {i < row.paymentStep && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="dl-payment-label" data-active={i < row.paymentStep}>
                  {step}
                </span>
                {i < PAYMENT_STEPS.length - 1 && (
                  <div className="dl-payment-line" data-active={i + 1 <= row.paymentStep} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Advance received */}
        <button
          className="dl-advance-check"
          data-checked={advanceReceived}
          onClick={toggleAdvance}
          title={advanceReceived ? "Advance received" : "Mark advance as received"}
        >
          <span className="dl-advance-box">
            {advanceReceived && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </span>
          <span className="dl-advance-label">Advance received</span>
        </button>

        {/* Invoice + Note */}
        {(row.invoiceNumber || row.note) && (
          <div className="dl-meta">
            {row.invoiceNumber && (
              <span className="dl-meta-item">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {row.invoiceNumber}
              </span>
            )}
            {row.note && (
              <span className="dl-meta-item dl-note" title={row.note}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {row.note}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliverableChip({ item }: { item: DeliverableItem }) {
  const done = item.status === "Completed";
  return (
    <span className="dl-chip" data-done={done}>
      <span className="dl-chip-dot" data-done={done} />
      {item.label}
    </span>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "pending" | "in-progress" | "awaiting-payment" | "done";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in-progress", label: "In Progress" },
  { key: "awaiting-payment", label: "Awaiting Payment" },
  { key: "done", label: "Done" },
];

// ── Main view ─────────────────────────────────────────────────────────────────

export function DeliverablesView() {
  const [data, setData] = useState<DeliverableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [month, setMonth] = useState("all");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deliverables");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json.deliverables ?? []);
      setLastFetched(new Date());
    } catch {
      setError("Could not load deliverables. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const months = useMemo(() => {
    const seen = new Set<string>();
    data.forEach((d) => { if (d.month) seen.add(d.month); });
    return ["all", ...Array.from(seen)];
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      if (filter !== "all" && row.overallStatus !== filter) return false;
      if (month !== "all" && row.month !== month) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !row.brand.toLowerCase().includes(q) &&
          !row.pnNo.toLowerCase().includes(q) &&
          !row.poc.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [data, filter, month, search]);

  const counts = useMemo(() => {
    const c = { pending: 0, "in-progress": 0, "awaiting-payment": 0, done: 0 };
    data.forEach((d) => { c[d.overallStatus]++; });
    return c;
  }, [data]);

  return (
    <div className="dl-page">
      {/* Page header */}
      <div className="dl-page-header">
        <div>
          <h2 className="dl-heading">Deliverables</h2>
          <p className="dl-subheading">
            {loading ? "Loading…" : `${filtered.length} of ${data.length} deliverables`}
            {lastFetched && !loading && (
              <span className="dl-last-fetched"> · synced {lastFetched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
        </div>
        <button className="kanban-btn-secondary dl-refresh-btn" onClick={load} disabled={loading}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: loading ? "dl-spin 1s linear infinite" : "none" }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      {!loading && data.length > 0 && (
        <div className="dl-stats-strip">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`dl-stat-pill ${filter === key ? "active" : ""}`}
              style={filter === key ? { borderColor: cfg.color, color: cfg.color } : {}}
              onClick={() => setFilter(filter === key ? "all" : key as FilterTab)}
            >
              <span className="dl-stat-dot" style={{ background: cfg.color }} />
              {cfg.label}
              <span className="dl-stat-count">{counts[key as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="dl-controls">
        <div className="dl-search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="dl-search"
            placeholder="Search brand, PN, contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="dl-search-clear" onClick={() => setSearch("")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {months.length > 2 && (
          <select className="dl-month-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{m === "all" ? "All months" : m}</option>
            ))}
          </select>
        )}

        {/* Filter tabs */}
        <div className="dl-filter-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`dl-filter-tab ${filter === tab.key ? "active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="dl-loading">
          <div className="dl-spinner" />
          <span>Syncing from Google Sheets…</span>
        </div>
      )}

      {error && !loading && (
        <div className="dl-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className="kanban-btn-primary" onClick={load}>Try again</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="dl-empty">
          <div className="dl-empty-icon">📋</div>
          <h3>No deliverables found</h3>
          <p>{search || filter !== "all" ? "Try adjusting your filters" : "No data in the sheet"}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="dl-grid">
          {filtered.map((row) => (
            <DeliverableCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
