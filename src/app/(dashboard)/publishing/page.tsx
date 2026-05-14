"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Deliverable {
  id: string;
  title: string;
  brand: string | null;
  type: string;
  deadline: string | null;
  pnNo: string | null;
  platforms: string[];
  publishDate: string | null;
  publishTask: {
    checklist: { label: string; done: boolean }[];
  } | null;
}

interface EditTask {
  id: string;
  status: string;
  deliverable: Deliverable;
}

interface PublishingData {
  uploadReady: EditTask[];
  scheduled: Deliverable[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_DISPLAY: Record<string, string> = {
  REEL: "Reel",
  SHORT: "Short",
  YOUTUBE_VIDEO: "YouTube Video",
  PODCAST: "Podcast",
  BRAND_INTEGRATION: "Brand Integration",
  PRODUCT_REVIEW: "Product Review",
  EVENT_COVERAGE: "Event Coverage",
  COMPARISON_VIDEO: "Comparison Video",
  THUMBNAIL_ONLY: "Thumbnail Only",
  COMMUNITY_POST: "Community Post",
};

const PLATFORM_COLOR: Record<string, string> = {
  YOUTUBE: "#ef4444",
  INSTAGRAM: "#ec4899",
  TIKTOK: "#a855f7",
  PODCAST: "#f59e0b",
  TWITTER: "#38bdf8",
  LINKEDIN: "#3b82f6",
  COMMUNITY: "#22c55e",
};

function formatPublishDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton Cards ────────────────────────────────────────────────────────────

function SkeletonReadyCard() {
  return (
    <div className="pub-ready-card pub-skeleton">
      <div className="pub-skel pub-skel-title" />
      <div className="pub-skel pub-skel-meta" />
      <div className="pub-skel pub-skel-chip" />
      <div className="pub-skel pub-skel-btn" />
    </div>
  );
}

function SkeletonScheduledCard() {
  return (
    <div className="pub-sched-card pub-skeleton">
      <div className="pub-skel pub-skel-title" />
      <div className="pub-skel pub-skel-meta" />
      <div style={{ display: "flex", gap: 6 }}>
        <div className="pub-skel pub-skel-chip" />
        <div className="pub-skel pub-skel-chip" />
      </div>
    </div>
  );
}

// ─── Ready Card ───────────────────────────────────────────────────────────────

function ReadyCard({ task }: { task: EditTask }) {
  const [publishing, setPublishing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { deliverable } = task;

  const deadline = deliverable.deadline ? new Date(deliverable.deadline) : null;
  const isOverdue = deadline ? deadline < new Date() : false;

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v2/deliverables/${deliverable.id}/transition`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStatus: "PUBLISHED" }),
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Transition failed");
      }
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ["publishing"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className={`pub-ready-card${done ? " pub-ready-card--done" : ""}`}>
      <div className="pub-ready-top">
        <div className="pub-ready-info">
          <p className="pub-card-title">{deliverable.title}</p>
          {deliverable.brand && (
            <span className="pub-card-brand">{deliverable.brand}</span>
          )}
        </div>
        <span className="pub-type-chip">
          {TYPE_DISPLAY[deliverable.type] ?? deliverable.type}
        </span>
      </div>

      {deadline && (
        <div
          className={`pub-deadline${isOverdue ? " pub-deadline--overdue" : ""}`}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {isOverdue ? "Overdue · " : ""}
          {deadline.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      )}

      {error && <p className="pub-card-error">{error}</p>}

      <button
        className={`pub-publish-btn${done ? " pub-publish-btn--done" : ""}`}
        onClick={handlePublish}
        disabled={publishing || done}
      >
        {done ? (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Published
          </>
        ) : publishing ? (
          "Publishing…"
        ) : (
          "Mark Published"
        )}
      </button>
    </div>
  );
}

// ─── Scheduled Card ───────────────────────────────────────────────────────────

function ScheduledCard({ deliverable }: { deliverable: Deliverable }) {
  const checklist = deliverable.publishTask?.checklist ?? [];
  const doneCount = checklist.filter((c) => c.done).length;
  const total = checklist.length;

  return (
    <div className="pub-sched-card">
      <div className="pub-sched-main">
        <div className="pub-sched-info">
          <p className="pub-card-title">{deliverable.title}</p>
          {deliverable.brand && (
            <span className="pub-card-brand">{deliverable.brand}</span>
          )}
        </div>

        {deliverable.publishDate && (
          <div className="pub-sched-date">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatPublishDate(deliverable.publishDate)}
          </div>
        )}
      </div>

      {deliverable.platforms.length > 0 && (
        <div className="pub-platforms">
          {deliverable.platforms.map((p) => (
            <span
              key={p}
              className="pub-platform-chip"
              style={{
                background: `${PLATFORM_COLOR[p] ?? "#737373"}1a`,
                color: PLATFORM_COLOR[p] ?? "#a3a3a3",
                borderColor: `${PLATFORM_COLOR[p] ?? "#737373"}30`,
              }}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="pub-checklist-summary">
          <div className="pub-checklist-bar">
            <div
              className="pub-checklist-fill"
              style={{
                width: `${(doneCount / total) * 100}%`,
                background:
                  doneCount === total ? "#22c55e" : "var(--app-accent)",
              }}
            />
          </div>
          <span className="pub-checklist-label">
            {doneCount}/{total} tasks
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublishingPage() {
  const { data, isLoading, error } = useQuery<PublishingData>({
    queryKey: ["publishing"],
    queryFn: async () => {
      const [editRes, schedRes] = await Promise.all([
        fetch("/api/v2/editing?status=UPLOAD_READY"),
        fetch("/api/v2/deliverables?status=SCHEDULED"),
      ]);
      if (!editRes.ok) throw new Error("Failed to fetch upload-ready tasks");
      if (!schedRes.ok) throw new Error("Failed to fetch scheduled deliverables");

      const [editData, schedData] = await Promise.all([
        editRes.json(),
        schedRes.json(),
      ]);

      return {
        uploadReady: editData.tasks ?? [],
        scheduled: schedData.deliverables ?? [],
      };
    },
  });

  return (
    <>
      <style>{`
        @keyframes pubPulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }

        .pub-page {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          background: var(--app-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          padding: 28px 28px 48px;
          box-sizing: border-box;
        }

        /* Header */
        .pub-header {
          margin-bottom: 32px;
        }
        .pub-header-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--app-text);
          letter-spacing: -0.03em;
          margin: 0;
        }

        /* Section */
        .pub-section {
          margin-bottom: 40px;
        }
        .pub-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .pub-section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--app-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0;
        }
        .pub-section-count {
          font-size: 11px;
          font-weight: 600;
          color: var(--app-text-muted);
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          padding: 1px 8px;
        }

        /* Empty state */
        .pub-empty {
          font-size: 13px;
          color: var(--app-text-muted);
          padding: 24px 0;
        }

        /* Error state */
        .pub-error {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-size: 13px;
          padding: 16px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
        }

        /* Skeleton */
        .pub-skeleton {
          animation: pubPulse 1.4s ease-in-out infinite;
        }
        .pub-skel {
          background: var(--app-border);
          border-radius: 4px;
        }
        .pub-skel-title { height: 13px; width: 70%; margin-bottom: 2px; }
        .pub-skel-meta  { height: 10px; width: 40%; }
        .pub-skel-chip  { height: 20px; width: 64px; border-radius: 20px; }
        .pub-skel-btn   { height: 32px; width: 100%; border-radius: 7px; margin-top: 4px; }

        /* Ready grid */
        .pub-ready-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }
        .pub-ready-card {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .pub-ready-card:hover {
          border-color: color-mix(in srgb, var(--app-border) 40%, var(--app-text-muted) 60%);
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .pub-ready-card--done {
          opacity: 0.55;
          pointer-events: none;
        }
        .pub-ready-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .pub-ready-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }

        /* Shared card elements */
        .pub-card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--app-text);
          letter-spacing: -0.01em;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pub-card-brand {
          font-size: 11px;
          color: var(--app-text-muted);
        }
        .pub-card-error {
          font-size: 11px;
          color: #ef4444;
          margin: 0;
          padding: 4px 7px;
          background: rgba(239,68,68,0.08);
          border-radius: 4px;
        }

        /* Type chip */
        .pub-type-chip {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 600;
          color: var(--app-text-secondary);
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 5px;
          padding: 3px 7px;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        /* Deadline */
        .pub-deadline {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--app-text-muted);
        }
        .pub-deadline--overdue {
          color: #ef4444;
        }

        /* Publish button */
        .pub-publish-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 14px;
          border: none;
          border-radius: 7px;
          background: var(--app-accent);
          color: var(--app-bg);
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: opacity 140ms, background 140ms;
          letter-spacing: -0.01em;
        }
        .pub-publish-btn:hover:not(:disabled) {
          opacity: 0.88;
        }
        .pub-publish-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pub-publish-btn--done {
          background: rgba(34,197,94,0.15);
          color: #22c55e;
          border: 1px solid rgba(34,197,94,0.3);
          opacity: 1 !important;
        }

        /* Scheduled list */
        .pub-sched-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pub-sched-card {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: border-color 120ms;
        }
        .pub-sched-card:hover {
          border-color: color-mix(in srgb, var(--app-border) 40%, var(--app-text-muted) 60%);
        }
        .pub-sched-main {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .pub-sched-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .pub-sched-date {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          color: var(--app-text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Platforms */
        .pub-platforms {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .pub-platform-chip {
          font-size: 10px;
          font-weight: 600;
          border-radius: 20px;
          border: 1px solid transparent;
          padding: 2px 8px;
          letter-spacing: 0.02em;
        }

        /* Checklist summary */
        .pub-checklist-summary {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pub-checklist-bar {
          flex: 1;
          height: 3px;
          background: var(--app-elevated);
          border-radius: 3px;
          overflow: hidden;
        }
        .pub-checklist-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 300ms ease;
        }
        .pub-checklist-label {
          font-size: 11px;
          color: var(--app-text-muted);
          white-space: nowrap;
        }
      `}</style>

      <div className="pub-page">
        {/* Header */}
        <div className="pub-header">
          <h1 className="pub-header-title">Publishing</h1>
        </div>

        {/* Error */}
        {error && (
          <div className="pub-error">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error instanceof Error ? error.message : "Failed to load publishing data"}
          </div>
        )}

        {/* Section 1 — Ready to Publish */}
        <div className="pub-section">
          <div className="pub-section-header">
            <h2 className="pub-section-title">Ready to Publish</h2>
            {!isLoading && data && (
              <span className="pub-section-count">
                {data.uploadReady.length}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="pub-ready-grid">
              <SkeletonReadyCard />
              <SkeletonReadyCard />
              <SkeletonReadyCard />
            </div>
          ) : !data || data.uploadReady.length === 0 ? (
            <p className="pub-empty">No videos ready to publish right now.</p>
          ) : (
            <div className="pub-ready-grid">
              {data.uploadReady.map((task) => (
                <ReadyCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        {/* Section 2 — Scheduled */}
        <div className="pub-section">
          <div className="pub-section-header">
            <h2 className="pub-section-title">Scheduled</h2>
            {!isLoading && data && (
              <span className="pub-section-count">{data.scheduled.length}</span>
            )}
          </div>

          {isLoading ? (
            <div className="pub-sched-list">
              <SkeletonScheduledCard />
              <SkeletonScheduledCard />
            </div>
          ) : !data || data.scheduled.length === 0 ? (
            <p className="pub-empty">No scheduled deliverables.</p>
          ) : (
            <div className="pub-sched-list">
              {data.scheduled.map((d) => (
                <ScheduledCard key={d.id} deliverable={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
