"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Priority } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DeliverableCalendarItem {
  id: string;
  title: string;
  priority: Priority;
  deadline: string | null;
  pnNo: string;
}

interface DeliverablesResponse {
  deliverables: DeliverableCalendarItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function priorityColor(priority: Priority): string {
  switch (priority) {
    case "HIGH":
    case "URGENT":
      return "var(--cal-chip-high)";
    case "MEDIUM":
      return "var(--cal-chip-medium)";
    case "LOW":
      return "var(--cal-chip-low)";
    default:
      return "var(--cal-chip-medium)";
  }
}

function priorityBg(priority: Priority): string {
  switch (priority) {
    case "HIGH":
    case "URGENT":
      return "var(--cal-chip-high-bg)";
    case "MEDIUM":
      return "var(--cal-chip-medium-bg)";
    case "LOW":
      return "var(--cal-chip-low-bg)";
    default:
      return "var(--cal-chip-medium-bg)";
  }
}

/** Returns array of day-cells for the monthly grid (including padding nulls). */
function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

/** Group deliverables by "YYYY-MM-DD" deadline key */
function groupByDate(
  deliverables: DeliverableCalendarItem[]
): Map<string, DeliverableCalendarItem[]> {
  const map = new Map<string, DeliverableCalendarItem[]>();
  for (const d of deliverables) {
    if (!d.deadline) continue;
    const key = d.deadline.slice(0, 10); // "YYYY-MM-DD"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return map;
}

function padDate(n: number): string {
  return String(n).padStart(2, "0");
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchDeliverables(): Promise<DeliverableCalendarItem[]> {
  const res = await fetch("/api/v2/deliverables?limit=200");
  if (!res.ok) throw new Error("Failed to fetch deliverables");
  const data: DeliverablesResponse = await res.json();
  return data.deliverables ?? [];
}

// ── Calendar Page ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deliverables-calendar"],
    queryFn: fetchDeliverables,
    staleTime: 60_000,
  });

  const deliverablesByDate = useMemo(
    () => groupByDate(data ?? []),
    [data]
  );

  const cells = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="cal-page">
      {/* Header */}
      <div className="cal-header">
        <div className="cal-header-left">
          <h2 className="cal-month-title">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          {!isCurrentMonth && (
            <button className="cal-today-btn" onClick={goToToday}>
              Today
            </button>
          )}
        </div>
        <div className="cal-nav">
          <button
            className="cal-nav-btn"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="cal-nav-btn"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="cal-day-labels">
        {DAY_NAMES.map((d) => (
          <div key={d} className="cal-day-label">{d}</div>
        ))}
      </div>

      {/* Grid */}
      {isError && (
        <div className="cal-error">Failed to load deliverables. Please try again.</div>
      )}

      {isLoading && (
        <div className="cal-loading">
          <div className="cal-spinner" />
          <span>Loading calendar…</span>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="cal-grid">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`pad-${idx}`} className="cal-cell cal-cell--empty" />;
            }

            const dateKey = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
            const items = deliverablesByDate.get(dateKey) ?? [];
            const isToday =
              isCurrentMonth && day === today.getDate();

            return (
              <div
                key={dateKey}
                className={`cal-cell${isToday ? " cal-cell--today" : ""}${items.length > 0 ? " cal-cell--has-items" : ""}`}
              >
                <span className={`cal-cell-day${isToday ? " cal-cell-day--today" : ""}`}>
                  {day}
                </span>

                {items.length > 0 && (
                  <div className="cal-chips">
                    {items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        className="cal-chip"
                        style={{
                          color: priorityColor(item.priority),
                          background: priorityBg(item.priority),
                        }}
                        onClick={() => router.push(`/deliverables?id=${item.id}`)}
                        title={`${item.title} (${item.priority})`}
                      >
                        {item.title}
                      </button>
                    ))}
                    {items.length > 3 && (
                      <span className="cal-chip-overflow">
                        +{items.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="cal-legend">
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "var(--cal-chip-high)" }} />
          High / Urgent
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "var(--cal-chip-medium)" }} />
          Medium
        </span>
        <span className="cal-legend-item">
          <span className="cal-legend-dot" style={{ background: "var(--cal-chip-low)" }} />
          Low
        </span>
      </div>
    </div>
  );
}
