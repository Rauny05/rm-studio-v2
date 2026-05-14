"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Types ───────────────────────────────────────────────────────────────────

type EditStatus =
  | "READY_FOR_EDIT"
  | "CLAIMED"
  | "ROUGH_CUT"
  | "INTERNAL_REVIEW"
  | "REVISIONS"
  | "FINAL_EXPORT"
  | "UPLOAD_READY"
  | "ARCHIVED";

type VersionLabel =
  | "DRAFT_1"
  | "DRAFT_2"
  | "CLIENT_REVISION"
  | "FINAL_APPROVED"
  | "PUBLISHED_EXPORT";

interface Deliverable {
  id: string;
  title: string;
  brand: string | null;
  type: string;
  deadline: string | null;
  pnNo: string | null;
}

interface Editor {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface ExportVersion {
  id: string;
  label: VersionLabel;
  url: string;
  notes: string | null;
  createdAt: string;
}

interface EditTask {
  id: string;
  status: EditStatus;
  revisionCount: number;
  deliverable: Deliverable;
  claimedBy: Editor | null;
  versions: ExportVersion[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { key: EditStatus; label: string }[] = [
  { key: "READY_FOR_EDIT", label: "Ready for Edit" },
  { key: "CLAIMED", label: "Claimed" },
  { key: "ROUGH_CUT", label: "Rough Cut" },
  { key: "INTERNAL_REVIEW", label: "Internal Review" },
  { key: "REVISIONS", label: "Revisions ↩" },
  { key: "FINAL_EXPORT", label: "Final Export" },
  { key: "UPLOAD_READY", label: "Upload Ready ✓" },
  { key: "ARCHIVED", label: "Archived" },
];

const VERSION_LABEL_DISPLAY: Record<VersionLabel, string> = {
  DRAFT_1: "Draft 1",
  DRAFT_2: "Draft 2",
  CLIENT_REVISION: "Client Revision",
  FINAL_APPROVED: "Final Approved",
  PUBLISHED_EXPORT: "Published Export",
};

// ─── Upload Version Modal ─────────────────────────────────────────────────────

interface UploadModalProps {
  taskId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadVersionModal({ taskId, onClose, onSuccess }: UploadModalProps) {
  const [label, setLabel] = useState<VersionLabel>("DRAFT_1");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) { setError("Export URL is required"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v2/editing/${taskId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url: url.trim(), notes: notes.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .ek-modal-backdrop {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: ekFadeIn 140ms ease;
        }
        .ek-modal {
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          padding: 24px;
          width: 100%; max-width: 400px;
          animation: ekSlideUp 160ms cubic-bezier(0.34,1.56,0.64,1);
        }
        .ek-modal-title {
          font-size: 15px; font-weight: 600;
          color: var(--app-text);
          margin: 0 0 20px;
          letter-spacing: -0.01em;
        }
        .ek-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .ek-label { font-size: 11px; font-weight: 500; color: var(--app-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
        .ek-select, .ek-input, .ek-textarea {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 7px;
          color: var(--app-text);
          font-size: 13px;
          padding: 9px 11px;
          outline: none;
          transition: border-color 120ms;
          font-family: inherit;
          width: 100%; box-sizing: border-box;
        }
        .ek-select:focus, .ek-input:focus, .ek-textarea:focus {
          border-color: #3b82f6;
        }
        .ek-textarea { resize: vertical; min-height: 72px; }
        .ek-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
        .ek-btn-cancel {
          background: transparent; border: 1px solid var(--app-border);
          color: var(--app-text-secondary); border-radius: 7px;
          padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .ek-btn-submit {
          background: #3b82f6; border: none; color: #fff;
          border-radius: 7px; padding: 8px 18px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          opacity: 1; transition: opacity 120ms;
        }
        .ek-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .ek-modal-error { font-size: 12px; color: #ef4444; margin-top: 10px; }
      `}</style>
      <div className="ek-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="ek-modal">
          <p className="ek-modal-title">Upload Version</p>
          <form onSubmit={handleSubmit}>
            <div className="ek-form-group">
              <label className="ek-label">Label</label>
              <select className="ek-select" value={label} onChange={(e) => setLabel(e.target.value as VersionLabel)}>
                {(Object.keys(VERSION_LABEL_DISPLAY) as VersionLabel[]).map((v) => (
                  <option key={v} value={v}>{VERSION_LABEL_DISPLAY[v]}</option>
                ))}
              </select>
            </div>
            <div className="ek-form-group">
              <label className="ek-label">Export URL</label>
              <input
                className="ek-input"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="ek-form-group">
              <label className="ek-label">Notes (optional)</label>
              <textarea
                className="ek-textarea"
                placeholder="Any notes for this version…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <p className="ek-modal-error">{error}</p>}
            <div className="ek-modal-actions">
              <button type="button" className="ek-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="ek-btn-submit" disabled={loading}>
                {loading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="ek-skeleton-card">
      <div className="ek-skel ek-skel-title" />
      <div className="ek-skel ek-skel-meta" />
      <div className="ek-skel ek-skel-bar" />
    </div>
  );
}

// ─── Edit Card ────────────────────────────────────────────────────────────────

interface CardProps {
  task: EditTask;
  onClaim: (id: string) => void;
  onUnclaim: (id: string) => void;
  onUpload: (id: string) => void;
  claimingId: string | null;
  claimError: { id: string; message: string } | null;
}

function EditCard({ task, onClaim, onUnclaim, onUpload, claimingId, claimError }: CardProps) {
  const { deliverable, claimedBy, versions, status, revisionCount } = task;
  const isClaiming = claimingId === task.id;
  const hasError = claimError?.id === task.id;

  const deadline = deliverable.deadline ? new Date(deliverable.deadline) : null;
  const isOverdue = deadline ? deadline < new Date() : false;

  const isClaimedCol = status === "CLAIMED";
  const isRevisionCol = status === "REVISIONS";
  const canUpload = status === "ROUGH_CUT" || status === "INTERNAL_REVIEW";

  return (
    <div className={`ek-card ${isClaimedCol ? "ek-card--claimed" : ""} ${isRevisionCol ? "ek-card--revision" : ""}`}>
      {/* Revision banner */}
      {isRevisionCol && (
        <div className="ek-revision-banner">Revision Requested</div>
      )}

      {/* Title + brand */}
      <div className="ek-card-head">
        <p className="ek-card-title">{deliverable.title}</p>
        {deliverable.brand && (
          <span className="ek-card-brand">{deliverable.brand}</span>
        )}
      </div>

      {/* Badges row */}
      <div className="ek-card-badges">
        {revisionCount > 1 && (
          <span className="ek-badge ek-badge--red">↩ {revisionCount}</span>
        )}
        {revisionCount === 1 && (
          <span className="ek-badge ek-badge--dim">↩ {revisionCount}</span>
        )}
        <span className="ek-badge ek-badge--blue">v{versions.length}</span>
        {deadline && (
          <span className={`ek-badge ${isOverdue ? "ek-badge--red" : "ek-badge--dim"}`}>
            {isOverdue ? "⚠ " : ""}
            {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {/* Editor avatar (if claimed) */}
      {claimedBy && (
        <div className="ek-card-editor">
          {claimedBy.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={claimedBy.image} alt={claimedBy.name ?? ""} className="ek-avatar" />
          ) : (
            <div className="ek-avatar ek-avatar--fallback">
              {(claimedBy.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <span className="ek-editor-name">{claimedBy.name}</span>
        </div>
      )}

      {/* Claim error */}
      {hasError && (
        <p className="ek-claim-error">{claimError!.message}</p>
      )}

      {/* Action row */}
      <div className="ek-card-actions">
        {status === "READY_FOR_EDIT" && (
          <button
            className="ek-btn ek-btn--primary"
            onClick={() => onClaim(task.id)}
            disabled={isClaiming}
          >
            {isClaiming ? "Claiming…" : "Claim"}
          </button>
        )}

        {status === "CLAIMED" && (
          <>
            <button
              className="ek-btn ek-btn--ghost"
              onClick={() => onUnclaim(task.id)}
              disabled={isClaiming}
            >
              Unclaim
            </button>
            <a className="ek-btn ek-btn--arrow" href={`/editing/${task.id}`}>→</a>
          </>
        )}

        {canUpload && (
          <button
            className="ek-btn ek-btn--secondary"
            onClick={() => onUpload(task.id)}
          >
            Upload Version
          </button>
        )}

        {!["READY_FOR_EDIT", "CLAIMED", "ROUGH_CUT", "INTERNAL_REVIEW"].includes(status) && (
          <a className="ek-btn ek-btn--arrow" href={`/editing/${task.id}`}>→</a>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  col: { key: EditStatus; label: string };
  tasks: EditTask[];
  loading: boolean;
  onClaim: (id: string) => void;
  onUnclaim: (id: string) => void;
  onUpload: (id: string) => void;
  claimingId: string | null;
  claimError: { id: string; message: string } | null;
}

function EditColumn({ col, tasks, loading, onClaim, onUnclaim, onUpload, claimingId, claimError }: ColumnProps) {
  return (
    <div className="ek-column">
      <div className="ek-col-header">
        <span className="ek-col-title">{col.label}</span>
        <span className="ek-col-count">{tasks.length}</span>
      </div>
      <div className="ek-col-body">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tasks.length === 0 ? (
          <p className="ek-empty">No tasks</p>
        ) : (
          tasks.map((t) => (
            <EditCard
              key={t.id}
              task={t}
              onClaim={onClaim}
              onUnclaim={onUnclaim}
              onUpload={onUpload}
              claimingId={claimingId}
              claimError={claimError}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Kanban ──────────────────────────────────────────────────────────────

export function EditKanban() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<EditStatus | "ALL">("ALL");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<{ id: string; message: string } | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);

  // Fetch
  const { data, isLoading } = useQuery<{ tasks: EditTask[] }>({
    queryKey: ["editing"],
    queryFn: async () => {
      const res = await fetch("/api/v2/editing");
      if (!res.ok) throw new Error("Failed to fetch editing tasks");
      return res.json();
    },
  });

  const tasks = data?.tasks ?? [];

  // Active editors = unique editors with tasks in CLAIMED/ROUGH_CUT/INTERNAL_REVIEW
  const activeEditorIds = new Set(
    tasks
      .filter((t) => ["CLAIMED", "ROUGH_CUT", "INTERNAL_REVIEW"].includes(t.status) && t.claimedBy)
      .map((t) => t.claimedBy!.id)
  );

  // Group by status
  const grouped: Record<EditStatus, EditTask[]> = {
    READY_FOR_EDIT: [],
    CLAIMED: [],
    ROUGH_CUT: [],
    INTERNAL_REVIEW: [],
    REVISIONS: [],
    FINAL_EXPORT: [],
    UPLOAD_READY: [],
    ARCHIVED: [],
  };
  for (const t of tasks) {
    if (grouped[t.status]) grouped[t.status].push(t);
  }

  async function handleClaim(id: string) {
    setClaimingId(id);
    setClaimError(null);
    try {
      const res = await fetch(`/api/v2/editing/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) {
        const name = json?.task?.claimedBy?.name ?? "another editor";
        setClaimError({ id, message: `Already claimed by ${name}` });
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Claim failed");
      queryClient.invalidateQueries({ queryKey: ["editing"] });
    } catch {
      setClaimError({ id, message: "Failed to claim task" });
    } finally {
      setClaimingId(null);
    }
  }

  async function handleUnclaim(id: string) {
    setClaimingId(id);
    setClaimError(null);
    try {
      const res = await fetch(`/api/v2/editing/${id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unclaim" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Unclaim failed");
      }
      queryClient.invalidateQueries({ queryKey: ["editing"] });
    } catch {
      setClaimError({ id, message: "Failed to unclaim task" });
    } finally {
      setClaimingId(null);
    }
  }

  const visibleColumns = filterStatus === "ALL"
    ? COLUMNS
    : COLUMNS.filter((c) => c.key === filterStatus);

  return (
    <>
      <style>{`
        @keyframes ekFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ekSlideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

        .ek-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          background: var(--app-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
        }

        /* Header */
        .ek-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--app-border);
          flex-shrink: 0;
          background: var(--app-surface);
        }
        .ek-header-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--app-text);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .ek-active-badge {
          background: rgba(59,130,246,0.12);
          color: #3b82f6;
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 20px;
          padding: 2px 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .ek-filter {
          margin-left: auto;
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 7px;
          color: var(--app-text);
          font-size: 12px;
          padding: 6px 10px;
          outline: none;
          font-family: inherit;
          cursor: pointer;
        }

        /* Board */
        .ek-board {
          display: flex;
          gap: 0;
          overflow-x: auto;
          flex: 1;
          min-height: 0;
          padding: 20px 16px;
          scroll-behavior: smooth;
        }
        .ek-board::-webkit-scrollbar { height: 4px; }
        .ek-board::-webkit-scrollbar-track { background: transparent; }
        .ek-board::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 4px; }

        /* Column */
        .ek-column {
          display: flex;
          flex-direction: column;
          min-width: 240px;
          max-width: 240px;
          background: var(--app-surface);
          border-radius: 10px;
          border: 1px solid var(--app-border);
          overflow: hidden;
          flex-shrink: 0;
          margin-right: 12px;
        }
        .ek-col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px;
          border-bottom: 1px solid var(--app-border);
          background: var(--app-elevated);
        }
        .ek-col-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--app-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ek-col-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--app-text-muted);
          background: var(--app-bg);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          padding: 1px 7px;
          min-width: 20px;
          text-align: center;
        }
        .ek-col-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px;
          overflow-y: auto;
          flex: 1;
        }
        .ek-col-body::-webkit-scrollbar { width: 3px; }
        .ek-col-body::-webkit-scrollbar-thumb { background: var(--app-border); border-radius: 3px; }

        /* Empty */
        .ek-empty {
          font-size: 12px;
          color: var(--app-text-muted);
          text-align: center;
          padding: 20px 0;
          margin: 0;
        }

        /* Skeleton */
        .ek-skeleton-card {
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: ekPulse 1.4s ease-in-out infinite;
        }
        @keyframes ekPulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.45 }
        }
        .ek-skel {
          background: var(--app-border);
          border-radius: 4px;
        }
        .ek-skel-title { height: 12px; width: 80%; }
        .ek-skel-meta { height: 10px; width: 50%; }
        .ek-skel-bar { height: 10px; width: 65%; }

        /* Card */
        .ek-card {
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 120ms, box-shadow 120ms;
          cursor: default;
        }
        .ek-card:hover {
          border-color: color-mix(in srgb, var(--app-border) 50%, var(--app-text-muted) 50%);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .ek-card--claimed {
          border-left: 3px solid #3b82f6;
        }
        .ek-card--revision {
          background: color-mix(in srgb, var(--app-elevated) 88%, #ef4444 12%);
          border-color: rgba(239,68,68,0.25);
        }

        /* Revision banner */
        .ek-revision-banner {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 7px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          text-align: center;
        }

        /* Card content */
        .ek-card-head { display: flex; flex-direction: column; gap: 2px; }
        .ek-card-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--app-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .ek-card-brand {
          font-size: 11px;
          color: var(--app-text-muted);
          letter-spacing: 0.01em;
        }

        /* Badges */
        .ek-card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .ek-badge {
          font-size: 10px;
          font-weight: 600;
          border-radius: 5px;
          padding: 2px 6px;
          letter-spacing: 0.02em;
        }
        .ek-badge--red {
          background: rgba(239,68,68,0.15);
          color: #ef4444;
        }
        .ek-badge--blue {
          background: rgba(59,130,246,0.12);
          color: #3b82f6;
        }
        .ek-badge--dim {
          background: var(--app-bg);
          color: var(--app-text-muted);
          border: 1px solid var(--app-border);
        }

        /* Editor */
        .ek-card-editor {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .ek-avatar {
          width: 20px; height: 20px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .ek-avatar--fallback {
          background: #3b82f6;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ek-editor-name {
          font-size: 11px;
          color: var(--app-text-secondary);
          font-weight: 500;
        }

        /* Claim error */
        .ek-claim-error {
          font-size: 11px;
          color: #ef4444;
          margin: 0;
          padding: 4px 6px;
          background: rgba(239,68,68,0.08);
          border-radius: 4px;
        }

        /* Actions */
        .ek-card-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ek-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 11px;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: opacity 120ms, background 120ms;
          text-decoration: none;
          letter-spacing: 0.01em;
        }
        .ek-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ek-btn--primary {
          background: #3b82f6;
          color: #fff;
          width: 100%;
        }
        .ek-btn--primary:hover:not(:disabled) { background: #2563eb; }
        .ek-btn--secondary {
          background: var(--app-bg);
          color: var(--app-text-secondary);
          border: 1px solid var(--app-border);
          width: 100%;
        }
        .ek-btn--secondary:hover:not(:disabled) { background: var(--app-hover); }
        .ek-btn--ghost {
          background: transparent;
          color: var(--app-text-muted);
          border: 1px solid var(--app-border);
          flex: 1;
        }
        .ek-btn--ghost:hover:not(:disabled) { background: var(--app-hover); color: var(--app-text); }
        .ek-btn--arrow {
          background: var(--app-bg);
          color: var(--app-text-secondary);
          border: 1px solid var(--app-border);
          padding: 5px 9px;
          font-size: 14px;
        }
        .ek-btn--arrow:hover { background: var(--app-hover); color: var(--app-text); }
      `}</style>

      <div className="ek-root">
        {/* Header */}
        <div className="ek-header">
          <h1 className="ek-header-title">Editing</h1>
          {activeEditorIds.size > 0 && (
            <span className="ek-active-badge">{activeEditorIds.size} active</span>
          )}
          <select
            className="ek-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as EditStatus | "ALL")}
          >
            <option value="ALL">All Stages</option>
            {COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Board */}
        <div className="ek-board">
          {visibleColumns.map((col) => (
            <EditColumn
              key={col.key}
              col={col}
              tasks={grouped[col.key]}
              loading={isLoading}
              onClaim={handleClaim}
              onUnclaim={handleUnclaim}
              onUpload={(id) => setUploadTaskId(id)}
              claimingId={claimingId}
              claimError={claimError}
            />
          ))}
        </div>
      </div>

      {/* Upload Version Modal */}
      {uploadTaskId && (
        <UploadVersionModal
          taskId={uploadTaskId}
          onClose={() => setUploadTaskId(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["editing"] })}
        />
      )}
    </>
  );
}
