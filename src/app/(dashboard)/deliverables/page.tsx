"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeliverableStatus =
  | "DRAFT" | "ACTIVE" | "IN_PRODUCTION" | "IN_EDIT" | "IN_REVIEW"
  | "REVISION_REQUESTED" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type DeliverableType =
  | "REEL" | "SHORT" | "YOUTUBE_VIDEO" | "BRAND_INTEGRATION" | "PODCAST" | string;

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface AssignedUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Deliverable {
  id: string;
  pnNo: string;
  title: string;
  brand: string;
  type: DeliverableType;
  status: DeliverableStatus;
  priority: Priority;
  deadline: string | null;
  publishDate: string | null;
  emailSent: boolean;
  advance50: boolean;
  payment100: boolean;
  pocName: string | null;
  pocCompany: string | null;
  assignedTo: AssignedUser[];
  production: { id: string; status: string } | null;
  editTask: { id: string; status: string } | null;
  thumbnailTask: { id: string; status: string } | null;
  publishTask: { id: string; status: string } | null;
  _count: { comments: number };
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<DeliverableStatus, { label: string; color: string; bg: string }> = {
  DRAFT:               { label: "Draft",              color: "#737373", bg: "rgba(115,115,115,0.12)" },
  ACTIVE:              { label: "Active",             color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  IN_PRODUCTION:       { label: "In Production",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  IN_EDIT:             { label: "In Edit",            color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  IN_REVIEW:           { label: "In Review",          color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
  REVISION_REQUESTED:  { label: "Revision",           color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  APPROVED:            { label: "Approved",           color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  SCHEDULED:           { label: "Scheduled",          color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  PUBLISHED:           { label: "Published",          color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  ARCHIVED:            { label: "Archived",           color: "#737373", bg: "rgba(115,115,115,0.12)" },
};

const TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  REEL:              { label: "Reel",              color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
  SHORT:             { label: "Short",             color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  YOUTUBE_VIDEO:     { label: "YouTube",           color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  BRAND_INTEGRATION: { label: "Brand Integration", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  PODCAST:           { label: "Podcast",           color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string }> = {
  LOW:    { label: "Low",    color: "#737373" },
  MEDIUM: { label: "Med",   color: "#f59e0b" },
  HIGH:   { label: "High",  color: "#ef4444" },
  URGENT: { label: "Urgent",color: "#ef4444" },
};

type FilterTab = "all" | "active" | "production" | "edit" | "published";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",        label: "All"           },
  { key: "active",     label: "Active"        },
  { key: "production", label: "In Production" },
  { key: "edit",       label: "In Edit"       },
  { key: "published",  label: "Published"     },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTypeCfg(type: string) {
  return TYPE_CFG[type] ?? { label: type, color: "#737373", bg: "rgba(115,115,115,0.12)" };
}

function getStatusCfg(status: DeliverableStatus) {
  return STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function matchesFilter(d: Deliverable, tab: FilterTab): boolean {
  if (tab === "all") return true;
  if (tab === "active") return d.status === "ACTIVE";
  if (tab === "production") return d.status === "IN_PRODUCTION";
  if (tab === "edit") return d.status === "IN_EDIT";
  if (tab === "published") return d.status === "PUBLISHED";
  return true;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PipelineDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: done ? "#22c55e" : "var(--app-border)",
        border: `1.5px solid ${done ? "#22c55e" : "var(--app-text-muted)"}`,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 9, color: "var(--app-text-muted)", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function PipelineConnector({ done }: { done: boolean }) {
  return (
    <div style={{
      width: 18,
      height: 1.5,
      background: done ? "#22c55e" : "var(--app-border)",
      marginBottom: 10,
      flexShrink: 0,
    }} />
  );
}

function AvatarStack({ users }: { users: AssignedUser[] }) {
  const shown = users.slice(0, 3);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((u, i) => (
        <div
          key={u.id}
          title={u.name ?? ""}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: u.image ? "transparent" : "var(--app-elevated)",
            border: "1.5px solid var(--app-surface)",
            marginLeft: i === 0 ? 0 : -6,
            fontSize: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--app-text-secondary)",
            fontWeight: 600,
            overflow: "hidden",
            zIndex: shown.length - i,
            position: "relative",
            flexShrink: 0,
          }}
        >
          {u.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.image} alt={u.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            (u.name ?? "?")[0].toUpperCase()
          )}
        </div>
      ))}
      {users.length > 3 && (
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "var(--app-elevated)",
          border: "1.5px solid var(--app-surface)",
          marginLeft: -6, fontSize: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--app-text-secondary)", fontWeight: 600,
        }}>
          +{users.length - 3}
        </div>
      )}
    </div>
  );
}

function PaymentDots({ emailSent, advance50, payment100 }: { emailSent: boolean; advance50: boolean; payment100: boolean }) {
  const steps = [
    { done: emailSent,  label: "Email" },
    { done: advance50,  label: "50%"   },
    { done: payment100, label: "Paid"  },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: s.done ? "#22c55e" : "var(--app-border)",
            border: `1.5px solid ${s.done ? "#22c55e" : "var(--app-text-muted)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {s.done && (
              <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span style={{ fontSize: 8, color: "var(--app-text-muted)" }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: "var(--app-surface)",
      border: "1px solid var(--app-border)",
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      animation: "dl2-pulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ width: 72, height: 20, borderRadius: 5, background: "var(--app-elevated)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: "40%", height: 14, borderRadius: 4, background: "var(--app-elevated)", marginBottom: 6 }} />
        <div style={{ width: "25%", height: 11, borderRadius: 4, background: "var(--app-elevated)" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 60, height: 20, borderRadius: 20, background: "var(--app-elevated)" }} />
        <div style={{ width: 48, height: 20, borderRadius: 20, background: "var(--app-elevated)" }} />
      </div>
    </div>
  );
}

// ── Card Row ──────────────────────────────────────────────────────────────────

function DeliverableCard({ d, onClick }: { d: Deliverable; onClick: () => void }) {
  const statusCfg = getStatusCfg(d.status);
  const typeCfg = getTypeCfg(d.type);
  const priorityCfg = PRIORITY_CFG[d.priority] ?? { label: d.priority, color: "#737373" };
  const overdue = isOverdue(d.deadline);

  const prodDone = !!d.production && ["DONE", "COMPLETED", "DELIVERED"].includes(d.production.status);
  const editDone = !!d.editTask && ["DONE", "COMPLETED", "APPROVED"].includes(d.editTask.status);
  const thumbDone = !!d.thumbnailTask && ["DONE", "COMPLETED", "READY"].includes(d.thumbnailTask.status);
  const publishDone = !!d.publishTask && ["DONE", "COMPLETED", "PUBLISHED"].includes(d.publishTask.status);

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
        borderRadius: 10,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        transition: "border-color 150ms, background 150ms",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--app-text-muted)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--app-hover)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--app-border)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--app-surface)";
      }}
    >
      {/* Status accent strip */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: "10px 0 0 10px",
        background: statusCfg.color,
      }} />

      {/* Left: PN + title + brand */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: "0 0 auto", paddingLeft: 6 }}>
        <span style={{
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--app-text-secondary)",
          background: "var(--app-elevated)",
          border: "1px solid var(--app-border)",
          borderRadius: 5,
          padding: "2px 7px",
          whiteSpace: "nowrap",
          letterSpacing: "0.03em",
        }}>
          {d.pnNo}
        </span>
      </div>

      {/* Title + brand */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--app-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          marginBottom: 3,
        }}>
          {d.title}
        </div>
        <div style={{
          fontSize: 12,
          color: "var(--app-text-muted)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {d.brand}
        </div>
      </div>

      {/* Center: type chip + pipeline */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {/* Type chip */}
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: typeCfg.color,
          background: typeCfg.bg,
          borderRadius: 20,
          padding: "3px 9px",
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}>
          {typeCfg.label}
        </span>

        {/* Status chip */}
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: statusCfg.color,
          background: statusCfg.bg,
          borderRadius: 20,
          padding: "3px 9px",
          whiteSpace: "nowrap",
        }}>
          {statusCfg.label}
        </span>

        {/* Workflow pipeline dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <PipelineDot done={prodDone}   label="Shoot" />
          <PipelineConnector done={editDone} />
          <PipelineDot done={editDone}   label="Edit"  />
          <PipelineConnector done={thumbDone} />
          <PipelineDot done={thumbDone}  label="Thumb" />
          <PipelineConnector done={publishDone} />
          <PipelineDot done={publishDone} label="Pub"  />
        </div>
      </div>

      {/* Right: deadline + priority + payment + avatars */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        {/* Deadline */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: overdue ? "#ef4444" : "var(--app-text-secondary)",
            whiteSpace: "nowrap",
          }}>
            {fmtDate(d.deadline)}
          </div>
          <div style={{ fontSize: 10, color: "var(--app-text-muted)" }}>deadline</div>
        </div>

        {/* Priority */}
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: priorityCfg.color,
          background: `${priorityCfg.color}18`,
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          {priorityCfg.label}
        </span>

        {/* Payment */}
        <PaymentDots emailSent={d.emailSent} advance50={d.advance50} payment100={d.payment100} />

        {/* Avatars */}
        {d.assignedTo.length > 0 && <AvatarStack users={d.assignedTo} />}

        {/* Comments */}
        {d._count.comments > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--app-text-muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={{ fontSize: 11 }}>{d._count.comments}</span>
          </div>
        )}

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-muted)", flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeliverablesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery<{ deliverables: Deliverable[] }>({
    queryKey: ["deliverables"],
    queryFn: async () => {
      const res = await fetch("/api/v2/deliverables");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deliverables = data?.deliverables ?? [];

  const filtered = useMemo(() => {
    return deliverables.filter(d => {
      if (!matchesFilter(d, activeTab)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.brand.toLowerCase().includes(q) ||
          d.pnNo.toLowerCase().includes(q) ||
          (d.pocName ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [deliverables, activeTab, search]);

  // Count per tab
  const counts = useMemo(() => ({
    all:        deliverables.length,
    active:     deliverables.filter(d => d.status === "ACTIVE").length,
    production: deliverables.filter(d => d.status === "IN_PRODUCTION").length,
    edit:       deliverables.filter(d => d.status === "IN_EDIT").length,
    published:  deliverables.filter(d => d.status === "PUBLISHED").length,
  }), [deliverables]);

  return (
    <>
      <style>{`
        @keyframes dl2-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--app-text)", margin: 0 }}>
              Deliverables
            </h1>
            {!isLoading && (
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--app-text-secondary)",
                background: "var(--app-elevated)",
                border: "1px solid var(--app-border)",
                borderRadius: 20,
                padding: "2px 10px",
              }}>
                {filtered.length}
              </span>
            )}
          </div>
          <Link
            href="/deliverables/new"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--app-accent-fg)",
              background: "var(--app-accent)",
              borderRadius: 8,
              padding: "8px 16px",
              textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Deliverable
          </Link>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{
            display: "flex",
            background: "var(--app-surface)",
            border: "1px solid var(--app-border)",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 150ms",
                  background: activeTab === tab.key ? "var(--app-elevated)" : "transparent",
                  color: activeTab === tab.key ? "var(--app-text)" : "var(--app-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: activeTab === tab.key ? "var(--app-hover)" : "transparent",
                  borderRadius: 10,
                  padding: "0 5px",
                  color: activeTab === tab.key ? "var(--app-text-secondary)" : "var(--app-text-muted)",
                }}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{
            flex: 1,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--app-surface)",
            border: "1px solid var(--app-border)",
            borderRadius: 8,
            padding: "7px 12px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-muted)", flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, brand, PN…"
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 13,
                color: "var(--app-text)",
                outline: "none",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--app-text-muted)", padding: 0, lineHeight: 1 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}

          {isError && !isLoading && (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--app-text-muted)",
              fontSize: 14,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#ef4444", marginBottom: 12, display: "block", margin: "0 auto 12px" }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Could not load deliverables.
            </div>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--app-text-muted)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--app-text-secondary)", margin: "0 0 6px" }}>
                {deliverables.length === 0 ? "No deliverables yet. Create your first one." : "No matches"}
              </p>
              {deliverables.length > 0 && (
                <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your filters or search.</p>
              )}
            </div>
          )}

          {!isLoading && !isError && filtered.map(d => (
            <DeliverableCard
              key={d.id}
              d={d}
              onClick={() => router.push(`/deliverables/${d.id}`)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
