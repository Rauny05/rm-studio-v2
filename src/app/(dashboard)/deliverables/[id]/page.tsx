"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type DeliverableStatus =
  | "DRAFT" | "ACTIVE" | "IN_PRODUCTION" | "IN_EDIT" | "IN_REVIEW"
  | "REVISION_REQUESTED" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

type DeliverableType =
  | "REEL" | "SHORT" | "YOUTUBE_VIDEO" | "BRAND_INTEGRATION" | "PODCAST" | string;

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface ProductionTask {
  id: string;
  status: string;
  totalDuration: number | null;
  footageFolder?: string | null;
  assignedTo: User[];
}

interface EditVersion {
  id: string;
  label: string;
  link?: string | null;
  createdAt: string;
}

interface EditTask {
  id: string;
  status: string;
  revisionCount: number;
  claimedBy: User | null;
  versions: EditVersion[];
}

interface ThumbnailTask {
  id: string;
  status: string;
  thumbnailUrl?: string | null;
}

interface PublishTask {
  id: string;
  status: string;
  scheduledFor?: string | null;
  publishedAt?: string | null;
  thumbnailReady?: boolean;
  descriptionReady?: boolean;
  tagsReady?: boolean;
  cardReady?: boolean;
  captionsReady?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Activity {
  id: string;
  action: string;
  createdAt: string;
  user: User;
  meta?: Record<string, unknown>;
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
  pocEmail: string | null;
  platforms: string[];
  notes: string | null;
  script: string | null;
  assignedTo: User[];
  production: ProductionTask | null;
  editTask: EditTask | null;
  thumbnailTask: ThumbnailTask | null;
  publishTask: PublishTask | null;
  activities: Activity[];
  comments: Comment[];
  _count?: { comments: number };
}

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_ORDER: DeliverableStatus[] = [
  "DRAFT", "ACTIVE", "IN_PRODUCTION", "IN_EDIT", "IN_REVIEW",
  "REVISION_REQUESTED", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED",
];

const STATUS_CFG: Record<DeliverableStatus, { label: string; color: string; bg: string }> = {
  DRAFT:              { label: "Draft",           color: "#737373", bg: "rgba(115,115,115,0.12)" },
  ACTIVE:             { label: "Active",          color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  IN_PRODUCTION:      { label: "In Production",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  IN_EDIT:            { label: "In Edit",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  IN_REVIEW:          { label: "In Review",       color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
  REVISION_REQUESTED: { label: "Revision",        color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  APPROVED:           { label: "Approved",        color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  SCHEDULED:          { label: "Scheduled",       color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  PUBLISHED:          { label: "Published",       color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  ARCHIVED:           { label: "Archived",        color: "#737373", bg: "rgba(115,115,115,0.12)" },
};

const TYPE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  REEL:              { label: "Reel",              color: "#a855f7", bg: "rgba(168,85,247,0.12)"  },
  SHORT:             { label: "Short",             color: "#3b82f6", bg: "rgba(59,130,246,0.12)"  },
  YOUTUBE_VIDEO:     { label: "YouTube",           color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  BRAND_INTEGRATION: { label: "Brand Integration", color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  PODCAST:           { label: "Podcast",           color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
};

// Next status in the forward direction
const NEXT_STATUS_MAP: Partial<Record<DeliverableStatus, DeliverableStatus>> = {
  DRAFT:         "ACTIVE",
  ACTIVE:        "IN_PRODUCTION",
  IN_PRODUCTION: "IN_EDIT",
  IN_EDIT:       "IN_REVIEW",
  IN_REVIEW:     "APPROVED",
  APPROVED:      "SCHEDULED",
  SCHEDULED:     "PUBLISHED",
  PUBLISHED:     "ARCHIVED",
};

const NEXT_LABEL: Partial<Record<DeliverableStatus, string>> = {
  DRAFT:              "Activate",
  ACTIVE:             "Send to Production",
  IN_PRODUCTION:      "Move to Edit",
  IN_EDIT:            "Send for Review",
  IN_REVIEW:          "Approve",
  REVISION_REQUESTED: "Back to Edit",
  APPROVED:           "Schedule",
  SCHEDULED:          "Mark as Published",
  PUBLISHED:          "Archive",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ");
}

function getTypeCfg(type: string) {
  return TYPE_CFG[type] ?? { label: type, color: "#737373", bg: "rgba(115,115,115,0.12)" };
}

// ── Small components ──────────────────────────────────────────────────────────

function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: user.image ? "transparent" : "var(--app-elevated)",
      border: "1.5px solid var(--app-border)",
      fontSize: size * 0.38,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--app-text-secondary)", fontWeight: 600,
      overflow: "hidden", flexShrink: 0,
    }}>
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        (user.name ?? "?")[0].toUpperCase()
      )}
    </div>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--app-surface)",
      border: "1px solid var(--app-border)",
      borderRadius: 10,
      padding: 18,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: "var(--app-text-muted)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--app-border)" }}>
      <span style={{ fontSize: 12, color: "var(--app-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--app-text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0" }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4,
        border: `1.5px solid ${checked ? "#22c55e" : "var(--app-border)"}`,
        background: checked ? "#22c55e" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: checked ? "var(--app-text)" : "var(--app-text-muted)" }}>{label}</span>
    </div>
  );
}

// ── Workflow Pipeline ─────────────────────────────────────────────────────────

function WorkflowPipeline({ status }: { status: DeliverableStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
      {STATUS_ORDER.map((s, i) => {
        const cfg = STATUS_CFG[s];
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={s} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 62 }}>
              {/* Node */}
              <div style={{
                width: isCurrent ? 14 : 10,
                height: isCurrent ? 14 : 10,
                borderRadius: "50%",
                background: isPast ? cfg.color : isCurrent ? cfg.color : "var(--app-elevated)",
                border: `2px solid ${isFuture ? "var(--app-border)" : cfg.color}`,
                boxShadow: isCurrent ? `0 0 0 4px ${cfg.color}28, 0 0 12px ${cfg.color}40` : "none",
                transition: "all 200ms",
                flexShrink: 0,
                marginTop: isCurrent ? 0 : 2,
              }} />
              {/* Label */}
              <span style={{
                fontSize: 9,
                fontWeight: isCurrent ? 700 : 500,
                color: isFuture ? "var(--app-text-muted)" : isCurrent ? cfg.color : "var(--app-text-secondary)",
                textAlign: "center",
                lineHeight: 1.3,
                maxWidth: 60,
              }}>
                {cfg.label}
              </span>
            </div>

            {/* Connector line (not after last) */}
            {i < STATUS_ORDER.length - 1 && (
              <div style={{
                width: 20,
                height: 1.5,
                background: i < currentIdx ? STATUS_CFG[STATUS_ORDER[i + 1]].color : "var(--app-border)",
                marginTop: 6,
                flexShrink: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  const Box = ({ w, h, r = 6 }: { w: string | number; h: number; r?: number }) => (
    <div style={{ width: w, height: h, borderRadius: r, background: "var(--app-elevated)", animation: "dl2-pulse 1.5s ease-in-out infinite" }} />
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <Box w={80} h={14} />
      <div style={{ height: 20 }} />
      <Box w="60%" h={28} />
      <div style={{ height: 8 }} />
      <Box w="30%" h={14} />
      <div style={{ height: 28 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 10, padding: 18 }}>
            <Box w="40%" h={12} />
            <div style={{ height: 16 }} />
            <Box w="100%" h={40} />
          </div>
          <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 10, padding: 18 }}>
            <Box w="30%" h={12} />
            <div style={{ height: 16 }} />
            <Box w="100%" h={80} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 10, padding: 18 }}>
            <Box w="100%" h={44} />
          </div>
          <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 10, padding: 18 }}>
            <Box w="40%" h={12} />
            <div style={{ height: 16 }} />
            {[1, 2, 3, 4].map(i => <div key={i} style={{ marginBottom: 10 }}><Box w="100%" h={14} /></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DeliverableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [transitioning, setTransitioning] = useState(false);

  const { data, isLoading, isError } = useQuery<{ deliverable: Deliverable }>({
    queryKey: ["deliverable", id],
    queryFn: async () => {
      const res = await fetch(`/api/v2/deliverables/${id}`);
      if (res.status === 404) throw Object.assign(new Error("Not found"), { status: 404 });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async (toStatus: DeliverableStatus) => {
      setTransitioning(true);
      const res = await fetch(`/api/v2/deliverables/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Transition failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverable", id] });
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
    },
    onSettled: () => setTransitioning(false),
  });

  if (isLoading) return (
    <>
      <style>{`@keyframes dl2-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <DetailSkeleton />
    </>
  );

  if (isError || !data?.deliverable) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 15, color: "var(--app-text-secondary)", marginBottom: 16 }}>
          Deliverable not found.
        </p>
        <button
          onClick={() => router.push("/deliverables")}
          style={{
            fontSize: 13, color: "var(--app-accent)", background: "none",
            border: "1px solid var(--app-border)", borderRadius: 7,
            padding: "8px 16px", cursor: "pointer",
          }}
        >
          ← Back to Deliverables
        </button>
      </div>
    );
  }

  const d = data.deliverable;
  const statusCfg = STATUS_CFG[d.status] ?? STATUS_CFG.DRAFT;
  const typeCfg = getTypeCfg(d.type);

  const nextStatus = d.status === "REVISION_REQUESTED"
    ? "IN_EDIT"
    : NEXT_STATUS_MAP[d.status];
  const nextLabel = NEXT_LABEL[d.status];

  const commentsCount = d._count?.comments ?? d.comments.length;

  return (
    <>
      <style>{`@keyframes dl2-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Back link */}
        <button
          onClick={() => router.push("/deliverables")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, color: "var(--app-text-muted)",
            background: "none", border: "none", cursor: "pointer",
            padding: 0, marginBottom: 20,
            transition: "color 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--app-text)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--app-text-muted)")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Deliverables
        </button>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "monospace", fontSize: 12, fontWeight: 600,
              color: "var(--app-text-secondary)",
              background: "var(--app-elevated)",
              border: "1px solid var(--app-border)",
              borderRadius: 5, padding: "2px 8px",
              letterSpacing: "0.03em",
            }}>
              {d.pnNo}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: typeCfg.color, background: typeCfg.bg,
              borderRadius: 20, padding: "3px 10px",
            }}>
              {typeCfg.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: statusCfg.color, background: statusCfg.bg,
              borderRadius: 20, padding: "3px 10px",
            }}>
              {statusCfg.label}
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--app-text)", margin: "0 0 4px" }}>
            {d.title}
          </h1>
          <div style={{ fontSize: 14, color: "var(--app-text-muted)" }}>
            {d.brand}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Workflow Pipeline */}
            <SectionCard>
              <SectionTitle>Workflow</SectionTitle>
              <WorkflowPipeline status={d.status} />
            </SectionCard>

            {/* Script */}
            <SectionCard>
              <SectionTitle>Script</SectionTitle>
              {d.script ? (
                <pre style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: "var(--app-text)",
                  background: "var(--app-bg)",
                  border: "1px solid var(--app-border)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 320,
                  overflowY: "auto",
                }}>
                  {d.script}
                </pre>
              ) : (
                <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>No script attached.</p>
              )}
            </SectionCard>

            {/* Production */}
            {d.production && (
              <SectionCard>
                <SectionTitle>Production</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <DetailRow label="Status" value={
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: "var(--app-text-secondary)",
                      background: "var(--app-elevated)",
                      borderRadius: 20, padding: "2px 8px",
                    }}>
                      {d.production.status}
                    </span>
                  } />
                  {d.production.totalDuration && (
                    <DetailRow label="Duration" value={`${d.production.totalDuration} min`} />
                  )}
                  {d.production.assignedTo.length > 0 && (
                    <DetailRow
                      label="Assigned editor"
                      value={
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar user={d.production.assignedTo[0]} size={20} />
                          <span>{d.production.assignedTo[0].name ?? "—"}</span>
                        </div>
                      }
                    />
                  )}
                </div>
              </SectionCard>
            )}

            {/* Edit Task */}
            {d.editTask && (
              <SectionCard>
                <SectionTitle>Edit Task</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <DetailRow label="Status" value={
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: "var(--app-text-secondary)",
                      background: "var(--app-elevated)",
                      borderRadius: 20, padding: "2px 8px",
                    }}>
                      {d.editTask.status}
                    </span>
                  } />
                  {d.editTask.claimedBy && (
                    <DetailRow
                      label="Claimed by"
                      value={
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar user={d.editTask.claimedBy} size={20} />
                          <span>{d.editTask.claimedBy.name ?? "—"}</span>
                        </div>
                      }
                    />
                  )}
                  <DetailRow label="Revisions" value={d.editTask.revisionCount} />
                </div>

                {/* Versions */}
                {d.editTask.versions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: "var(--app-text-muted)", marginBottom: 7 }}>Versions</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {d.editTask.versions.map(v => (
                        <a
                          key={v.id}
                          href={v.link ?? "#"}
                          target={v.link ? "_blank" : undefined}
                          rel="noreferrer"
                          style={{
                            fontSize: 11, fontWeight: 600,
                            color: v.link ? "var(--app-accent)" : "var(--app-text-secondary)",
                            background: "var(--app-elevated)",
                            border: "1px solid var(--app-border)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            textDecoration: "none",
                            display: "flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {v.label}
                          {v.link && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {/* Notes */}
            {d.notes && (
              <SectionCard>
                <SectionTitle>Notes</SectionTitle>
                <p style={{ fontSize: 13, color: "var(--app-text-secondary)", margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {d.notes}
                </p>
              </SectionCard>
            )}

            {/* Publish Task checklist */}
            {d.publishTask && (
              <SectionCard>
                <SectionTitle>Publishing Checklist</SectionTitle>
                <CheckItem label="Thumbnail ready"    checked={!!d.publishTask.thumbnailReady} />
                <CheckItem label="Description ready"  checked={!!d.publishTask.descriptionReady} />
                <CheckItem label="Tags ready"         checked={!!d.publishTask.tagsReady} />
                <CheckItem label="End card ready"     checked={!!d.publishTask.cardReady} />
                <CheckItem label="Captions ready"     checked={!!d.publishTask.captionsReady} />
                {d.publishTask.scheduledFor && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--app-text-muted)" }}>
                    Scheduled for: <strong style={{ color: "var(--app-text)" }}>{fmtDate(d.publishTask.scheduledFor)}</strong>
                  </div>
                )}
                {d.publishTask.publishedAt && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#22c55e" }}>
                    Published {fmtDate(d.publishTask.publishedAt)}
                  </div>
                )}
              </SectionCard>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Transition button */}
            {nextStatus && nextLabel && (
              <SectionCard>
                <div style={{ fontSize: 11, color: "var(--app-text-muted)", marginBottom: 8 }}>Next step</div>
                <button
                  disabled={transitioning || transitionMutation.isPending}
                  onClick={() => transitionMutation.mutate(nextStatus)}
                  style={{
                    width: "100%",
                    padding: "13px 20px",
                    borderRadius: 9,
                    border: "none",
                    cursor: transitioning ? "wait" : "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                    background: STATUS_CFG[nextStatus]?.color ?? "var(--app-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "opacity 150ms",
                    opacity: transitioning ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!transitioning) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = transitioning ? "0.7" : "1"; }}
                >
                  {transitioning ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "dl2-spin 0.8s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Transitioning…
                    </>
                  ) : (
                    <>
                      {nextLabel}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
                {transitionMutation.isError && (
                  <p style={{ fontSize: 11, color: "#ef4444", margin: "8px 0 0", textAlign: "center" }}>
                    {(transitionMutation.error as Error).message}
                  </p>
                )}
              </SectionCard>
            )}

            {/* Details panel */}
            <SectionCard>
              <SectionTitle>Details</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <DetailRow label="Brand"        value={d.brand} />
                <DetailRow label="POC"          value={d.pocName ?? "—"} />
                {d.pocCompany && <DetailRow label="Company" value={d.pocCompany} />}
                {d.platforms.length > 0 && (
                  <DetailRow
                    label="Platforms"
                    value={
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" }}>
                        {d.platforms.map(p => (
                          <span key={p} style={{
                            fontSize: 10, fontWeight: 600,
                            background: "var(--app-elevated)",
                            border: "1px solid var(--app-border)",
                            borderRadius: 20,
                            padding: "2px 7px",
                            color: "var(--app-text-secondary)",
                          }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    }
                  />
                )}
                <DetailRow
                  label="Deadline"
                  value={
                    <span style={{ color: d.deadline && new Date(d.deadline) < new Date() ? "#ef4444" : "inherit" }}>
                      {fmtDate(d.deadline)}
                    </span>
                  }
                />
                <DetailRow label="Publish date" value={fmtDate(d.publishDate)} />
                <DetailRow label="Priority"     value={d.priority} />
              </div>
            </SectionCard>

            {/* Financial pipeline */}
            <SectionCard>
              <SectionTitle>Payment</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {/* Email sent */}
                {[
                  { done: d.emailSent,  label: "Invoice Sent" },
                  { done: d.advance50,  label: "50% Advance"  },
                  { done: d.payment100, label: "Fully Paid"   },
                ].map((step, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < arr.length - 1 ? 1 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: step.done ? "#22c55e" : "var(--app-elevated)",
                        border: `2px solid ${step.done ? "#22c55e" : "var(--app-border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {step.done ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--app-border)" }} />
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: step.done ? "var(--app-text)" : "var(--app-text-muted)", fontWeight: step.done ? 600 : 400, textAlign: "center", lineHeight: 1.3 }}>
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{
                        flex: 1, height: 2,
                        background: arr[i + 1].done ? "#22c55e" : "var(--app-border)",
                        marginBottom: 16,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Comments count */}
            {commentsCount > 0 && (
              <SectionCard style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-muted)", flexShrink: 0 }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span style={{ fontSize: 13, color: "var(--app-text-secondary)" }}>
                  <strong style={{ color: "var(--app-text)" }}>{commentsCount}</strong> comment{commentsCount !== 1 ? "s" : ""}
                </span>
              </SectionCard>
            )}

            {/* Activity feed */}
            {d.activities.length > 0 && (
              <SectionCard>
                <SectionTitle>Activity</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {d.activities.slice(0, 10).map((act, i) => (
                    <div
                      key={act.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "9px 0",
                        borderBottom: i < d.activities.slice(0, 10).length - 1 ? "1px solid var(--app-border)" : "none",
                      }}
                    >
                      <Avatar user={act.user} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "var(--app-text-secondary)", lineHeight: 1.4 }}>
                          <strong style={{ color: "var(--app-text)", fontWeight: 600 }}>
                            {act.user.name ?? "Someone"}
                          </strong>{" "}
                          {formatAction(act.action)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--app-text-muted)", marginTop: 2 }}>
                          {relativeTime(act.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dl2-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
