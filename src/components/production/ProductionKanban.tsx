"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductionStatus =
  | "READY_TO_SHOOT"
  | "EQUIPMENT_READY"
  | "SHOOTING"
  | "BACKUP_PENDING"
  | "FOOTAGE_UPLOADED"
  | "AWAITING_EDIT"
  | "DELAYED"
  | "COMPLETED";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface AssignedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Deliverable {
  id: string;
  title: string;
  brand: string;
  priority: Priority;
  deadline: string | null;
}

interface ProductionCard {
  id: string;
  status: ProductionStatus;
  deliverableId: string;
  deliverable: Deliverable;
  assignedTo: AssignedUser | null;
  shootStartAt: string | null;
  shootEndAt: string | null;
  pausedAt: string | null;
  footageUploaded: boolean;
  backupConfirmed: boolean;
  isDelayed: boolean;
  delayReason: string | null;
  notes: string | null;
}

// ─── Column Config ─────────────────────────────────────────────────────────────

const COLUMNS: { status: ProductionStatus; label: string; color: string }[] = [
  { status: "READY_TO_SHOOT",    label: "Ready to Shoot",   color: "#6366f1" },
  { status: "EQUIPMENT_READY",   label: "Equipment Ready",  color: "#0ea5e9" },
  { status: "SHOOTING",          label: "🔴 Shooting",      color: "#ef4444" },
  { status: "BACKUP_PENDING",    label: "Backup Pending",   color: "#f59e0b" },
  { status: "FOOTAGE_UPLOADED",  label: "Footage Uploaded", color: "#10b981" },
  { status: "AWAITING_EDIT",     label: "Awaiting Edit",    color: "#8b5cf6" },
  { status: "DELAYED",           label: "⚠️ Delayed",       color: "#f97316" },
  { status: "COMPLETED",         label: "Completed",        color: "#6b7280" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(startIso: string): string {
  const start = new Date(startIso).getTime();
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function priorityConfig(p: Priority): { label: string; bg: string; color: string } {
  switch (p) {
    case "HIGH":
    case "URGENT":
      return { label: p === "URGENT" ? "URGENT" : "HIGH", bg: "rgba(239,68,68,0.12)", color: "#f87171" };
    case "MEDIUM":
      return { label: "MED", bg: "rgba(245,158,11,0.12)", color: "#fbbf24" };
    default:
      return { label: "LOW", bg: "rgba(107,114,128,0.12)", color: "#9ca3af" };
  }
}

// ─── Live Timer ────────────────────────────────────────────────────────────────

function LiveTimer({ startIso }: { startIso: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatElapsed(startIso)}</span>;
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: AssignedUser | null }) {
  if (!user) return null;
  const initials = (user.name ?? user.email)[0].toUpperCase();
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "var(--app-elevated)",
      border: "1px solid var(--app-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 600,
      color: "var(--app-text-secondary)",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : initials}
    </div>
  );
}

// ─── Skeleton Cards ────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="prod-skeleton-card" />
      ))}
    </>
  );
}

// ─── Card Actions ─────────────────────────────────────────────────────────────

interface CardActionsProps {
  card: ProductionCard;
  onShootAction: (id: string, action: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  isLoading: boolean;
}

function CardActions({ card, onShootAction, onPatch, isLoading }: CardActionsProps) {
  switch (card.status) {
    case "READY_TO_SHOOT":
      return (
        <button
          className="prod-action-btn prod-action-primary"
          disabled={isLoading}
          onClick={(e) => { e.stopPropagation(); onShootAction(card.id, "start"); }}
        >
          Start Shoot
        </button>
      );
    case "SHOOTING":
      return (
        <button
          className="prod-action-btn prod-action-danger"
          disabled={isLoading}
          onClick={(e) => { e.stopPropagation(); onShootAction(card.id, "wrap"); }}
        >
          Wrap Shoot
        </button>
      );
    case "BACKUP_PENDING":
      return (
        <button
          className="prod-action-btn prod-action-amber"
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onPatch(card.id, { footageUploaded: true, backupConfirmed: true, status: "FOOTAGE_UPLOADED" });
          }}
        >
          Mark Backup Done
        </button>
      );
    default:
      return (
        <Link
          href={`/deliverables/${card.deliverableId}`}
          className="prod-action-arrow"
          onClick={(e) => e.stopPropagation()}
        >
          →
        </Link>
      );
  }
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  card: ProductionCard;
  isShooting: boolean;
  onShootAction: (id: string, action: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  isLoading: boolean;
}

function ProductionKanbanCard({ card, isShooting, onShootAction, onPatch, isLoading }: KanbanCardProps) {
  const { deliverable } = card;
  const pri = priorityConfig(deliverable.priority);
  const overdue = isOverdue(deliverable.deadline);

  return (
    <div className={`prod-card${isShooting ? " prod-card--shooting" : ""}`}>
      {/* Title + Priority */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <p className="prod-card-title">{deliverable.title}</p>
        <span
          className="prod-priority-badge"
          style={{ background: pri.bg, color: pri.color }}
        >
          {pri.label}
        </span>
      </div>

      {/* Brand */}
      <p className="prod-card-brand">{deliverable.brand}</p>

      {/* Shoot Timer (SHOOTING only) */}
      {isShooting && card.shootStartAt && (
        <div className="prod-timer">
          <span className="prod-timer-dot" />
          <LiveTimer startIso={card.shootStartAt} />
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar user={card.assignedTo} />
          {deliverable.deadline && (
            <span
              className="prod-deadline"
              style={{ color: overdue ? "#f87171" : "var(--app-text-muted)" }}
            >
              {overdue ? "⚠ " : ""}{formatDate(deliverable.deadline)}
            </span>
          )}
        </div>
        <CardActions
          card={card}
          onShootAction={onShootAction}
          onPatch={onPatch}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  status: ProductionStatus;
  label: string;
  color: string;
  cards: ProductionCard[];
  isLoading: boolean;
  onShootAction: (id: string, action: string) => void;
  onPatch: (id: string, data: Record<string, unknown>) => void;
  fetchLoading: boolean;
  loadingCardId: string | null;
}

function KanbanColumn({
  status,
  label,
  color,
  cards,
  isLoading,
  onShootAction,
  onPatch,
  fetchLoading,
  loadingCardId,
}: ColumnProps) {
  return (
    <div className="prod-column">
      {/* Column header */}
      <div className="prod-col-header" style={{ borderLeftColor: color }}>
        <span className="prod-col-label">{label}</span>
        <span className="prod-col-count">{cards.length}</span>
      </div>

      {/* Cards */}
      <div className="prod-col-body">
        {fetchLoading ? (
          <SkeletonCards />
        ) : cards.length === 0 ? (
          <p className="prod-empty">No cards</p>
        ) : (
          cards.map((card) => (
            <ProductionKanbanCard
              key={card.id}
              card={card}
              isShooting={status === "SHOOTING"}
              onShootAction={onShootAction}
              onPatch={onPatch}
              isLoading={isLoading && loadingCardId === card.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export function ProductionKanban() {
  const queryClient = useQueryClient();
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ cards: ProductionCard[] }>({
    queryKey: ["production"],
    queryFn: () => fetch("/api/v2/production").then((r) => r.json()),
  });

  const shootMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      fetch(`/api/v2/production/${id}/shoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }).then((r) => r.json()),
    onMutate: ({ id }) => {
      setLoadingCardId(id);
    },
    onSettled: () => {
      setLoadingCardId(null);
      queryClient.invalidateQueries({ queryKey: ["production"] });
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fetch(`/api/v2/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onMutate: ({ id }) => {
      setLoadingCardId(id);
    },
    onSettled: () => {
      setLoadingCardId(null);
      queryClient.invalidateQueries({ queryKey: ["production"] });
    },
  });

  const cards = data?.cards ?? [];

  // Group cards by status
  const grouped = Object.fromEntries(
    COLUMNS.map(({ status }) => [
      status,
      cards.filter((c) => c.status === status),
    ])
  ) as Record<ProductionStatus, ProductionCard[]>;

  const activeShootCount = grouped["SHOOTING"]?.length ?? 0;

  const isMutating = shootMutation.isPending || patchMutation.isPending;

  return (
    <div className="prod-root">
      {/* Page header */}
      <div className="prod-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 className="prod-title">Shooting</h1>
          {activeShootCount > 0 && (
            <span className="prod-live-badge">
              <span className="prod-live-dot" />
              {activeShootCount} LIVE
            </span>
          )}
        </div>
        <Link href="/deliverables/new" className="prod-new-btn">
          + New Deliverable
        </Link>
      </div>

      {/* Board */}
      <div className="prod-board">
        {COLUMNS.map(({ status, label, color }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            color={color}
            cards={grouped[status] ?? []}
            fetchLoading={isLoading}
            isLoading={isMutating}
            loadingCardId={loadingCardId}
            onShootAction={(id, action) => shootMutation.mutate({ id, action })}
            onPatch={(id, patchData) => patchMutation.mutate({ id, data: patchData })}
          />
        ))}
      </div>

      <style>{`
        .prod-root {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 52px);
          overflow: hidden;
          background: var(--app-bg);
        }

        /* ── Header ── */
        .prod-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px 16px;
          flex-shrink: 0;
          border-bottom: 1px solid var(--app-border);
        }

        .prod-title {
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: var(--app-text);
          margin: 0;
        }

        .prod-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px 2px 6px;
          border-radius: 20px;
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .prod-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          animation: prod-pulse 1.4s ease-in-out infinite;
        }

        @keyframes prod-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.75); }
        }

        .prod-new-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          border-radius: 7px;
          background: var(--app-accent);
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
          letter-spacing: 0.1px;
        }

        .prod-new-btn:hover {
          opacity: 0.85;
        }

        /* ── Board ── */
        .prod-board {
          display: flex;
          gap: 12px;
          padding: 16px 28px 20px;
          overflow-x: auto;
          flex: 1;
          align-items: flex-start;
          scrollbar-width: thin;
          scrollbar-color: var(--app-elevated) transparent;
        }

        .prod-board::-webkit-scrollbar {
          height: 5px;
        }

        .prod-board::-webkit-scrollbar-track {
          background: transparent;
        }

        .prod-board::-webkit-scrollbar-thumb {
          background: var(--app-elevated);
          border-radius: 10px;
        }

        /* ── Column ── */
        .prod-column {
          width: 252px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--app-surface);
          border-radius: 10px;
          border: 1px solid var(--app-border);
          max-height: calc(100vh - 52px - 120px);
          overflow: hidden;
        }

        .prod-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-left: 3px solid transparent;
          border-radius: 10px 10px 0 0;
          background: var(--app-surface);
          flex-shrink: 0;
        }

        .prod-col-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--app-text-secondary);
        }

        .prod-col-count {
          font-size: 11px;
          font-weight: 500;
          color: var(--app-text-muted);
          background: var(--app-elevated);
          padding: 1px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .prod-col-body {
          padding: 8px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          scrollbar-width: thin;
          scrollbar-color: var(--app-elevated) transparent;
        }

        .prod-col-body::-webkit-scrollbar {
          width: 3px;
        }

        .prod-col-body::-webkit-scrollbar-thumb {
          background: var(--app-elevated);
          border-radius: 10px;
        }

        /* ── Empty state ── */
        .prod-empty {
          font-size: 11px;
          color: var(--app-text-muted);
          text-align: center;
          padding: 16px 0;
          margin: 0;
        }

        /* ── Skeleton card ── */
        .prod-skeleton-card {
          height: 88px;
          border-radius: 8px;
          background: var(--app-elevated);
          animation: prod-shimmer 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes prod-shimmer {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.35; }
        }

        /* ── Card ── */
        .prod-card {
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 8px;
          padding: 10px 10px 8px;
          cursor: default;
          transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.18);
        }

        .prod-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.28);
          border-color: rgba(255,255,255,0.08);
        }

        .prod-card--shooting {
          border-color: rgba(239,68,68,0.35);
          box-shadow: 0 0 0 1px rgba(239,68,68,0.15), 0 2px 8px rgba(239,68,68,0.12);
          animation: prod-shoot-glow 2s ease-in-out infinite;
        }

        @keyframes prod-shoot-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.15), 0 2px 8px rgba(239,68,68,0.12); }
          50% { box-shadow: 0 0 0 1px rgba(239,68,68,0.3), 0 4px 16px rgba(239,68,68,0.22); }
        }

        .prod-card-title {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--app-text);
          margin: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
          letter-spacing: -0.1px;
        }

        .prod-card-brand {
          font-size: 10.5px;
          color: var(--app-text-muted);
          margin: 0 0 2px;
          letter-spacing: 0.1px;
        }

        /* ── Priority badge ── */
        .prod-priority-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.4px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ── Timer ── */
        .prod-timer {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          padding: 3px 7px;
          border-radius: 5px;
          background: rgba(239,68,68,0.1);
          color: #f87171;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }

        .prod-timer-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ef4444;
          animation: prod-pulse 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }

        /* ── Deadline ── */
        .prod-deadline {
          font-size: 10.5px;
          font-weight: 500;
        }

        /* ── Action buttons ── */
        .prod-action-btn {
          padding: 3px 9px;
          border-radius: 5px;
          font-size: 10.5px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: opacity 0.12s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .prod-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .prod-action-btn:hover:not(:disabled) {
          opacity: 0.8;
        }

        .prod-action-primary {
          background: rgba(99,102,241,0.18);
          color: #a5b4fc;
        }

        .prod-action-danger {
          background: rgba(239,68,68,0.15);
          color: #f87171;
        }

        .prod-action-amber {
          background: rgba(245,158,11,0.15);
          color: #fbbf24;
        }

        .prod-action-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 5px;
          background: var(--app-surface);
          color: var(--app-text-muted);
          font-size: 13px;
          text-decoration: none;
          transition: background 0.12s, color 0.12s;
          border: 1px solid var(--app-border);
          flex-shrink: 0;
        }

        .prod-action-arrow:hover {
          background: var(--app-hover);
          color: var(--app-text);
        }
      `}</style>
    </div>
  );
}
