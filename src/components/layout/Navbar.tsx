"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";
import { useKanbanStore } from "@/store/kanban-store";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/useNotifications";
import type { Notification, NotificationType } from "@prisma/client";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/settings": "Settings",
  "/calendar": "Calendar",
  "/analytics": "Analytics",
  "/team": "Team",
  "/deliverables": "Deliverables",
  "/production": "Production",
  "/editing": "Editing",
  "/publishing": "Publishing",
};

// ── Notification helpers ───────────────────────────────────────────────────────

function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notificationIcon(type: NotificationType) {
  const icons: Partial<Record<NotificationType, string>> = {
    DEADLINE_MISSED: "🔴",
    DEADLINE_APPROACHING: "⏰",
    PRODUCTION_DELAYED: "⚠️",
    EDIT_CLAIMED: "✂️",
    REVIEW_REQUESTED: "👁",
    UPLOAD_SCHEDULED: "📤",
    PUBLISH_REMINDER: "📣",
    COMMENT_ADDED: "💬",
    REVISION_REQUESTED: "🔄",
    TASK_ASSIGNED: "📋",
  };
  return icons[type] ?? "🔔";
}

// ── Notification Panel ─────────────────────────────────────────────────────────

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      markRead.mutate(n.id);
    }
    if (n.link) {
      window.location.href = n.link;
      onClose();
    }
  }

  return (
    <div className="notif-panel" ref={panelRef} role="dialog" aria-label="Notifications">
      <div className="notif-panel-header">
        <span className="notif-panel-title">Notifications</span>
        <button
          className="notif-mark-all-btn"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || notifications.every((n) => n.read)}
        >
          Mark all read
        </button>
      </div>

      <div className="notif-list">
        {isLoading && (
          <div className="notif-empty">Loading…</div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="notif-empty">
            <span className="notif-empty-icon">🔔</span>
            <span>No notifications yet</span>
          </div>
        )}
        {!isLoading && notifications.map((n) => (
          <button
            key={n.id}
            className={`notif-item${n.read ? " notif-item--read" : ""}`}
            onClick={() => handleNotificationClick(n)}
          >
            <span className="notif-item-icon" aria-hidden="true">
              {notificationIcon(n.type)}
            </span>
            <div className="notif-item-body">
              <span className="notif-item-title">{n.title}</span>
              {n.body && <span className="notif-item-desc">{n.body}</span>}
              <span className="notif-item-time">{relativeTime(n.createdAt)}</span>
            </div>
            {!n.read && <span className="notif-item-dot" aria-label="Unread" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Global Search ──────────────────────────────────────────────────────────────

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { searchCards, boards } = useKanbanStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length >= 2 ? searchCards(query) : [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openCard(boardId: string) {
    router.push(`/projects/${boardId}`);
    onClose();
  }

  return (
    <div className="search-overlay" onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="search-panel">
        <div className="search-input-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--app-text-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search cards, scripts, tags…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="search-kbd" onClick={onClose}>esc</kbd>
        </div>

        {query.length >= 2 && (
          <div className="search-results">
            {results.length === 0 ? (
              <div className="search-empty">No results for "{query}"</div>
            ) : (
              results.map((card) => {
                const board = boards.find((b) => b.id === card.boardId);
                return (
                  <button
                    key={card.id}
                    className="search-result-item"
                    onClick={() => openCard(card.boardId)}
                  >
                    <span className="search-result-emoji">{board?.emoji ?? "📋"}</span>
                    <div className="search-result-info">
                      <span className="search-result-title">{card.title}</span>
                      <span className="search-result-meta">{board?.title}</span>
                    </div>
                    {card.deliverableType && (
                      <span className="search-result-type">{card.deliverableType}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {query.length === 0 && (
          <div className="search-hint">
            <span>Start typing to search across all boards</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

export function Navbar() {
  const {
    toggleSidebar,
    sidebarCollapsed,
    darkMode,
    toggleDarkMode,
    searchOpen,
    setSearchOpen,
    notificationsOpen,
    setNotificationsOpen,
  } = useUIStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { unreadCount } = useNotifications();

  // Resolve dynamic board names
  const { boards } = useKanbanStore();
  let title = Object.entries(pageTitles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Studio";

  // Board detail page title — only after mount to avoid SSR mismatch
  if (mounted && pathname.startsWith("/projects/")) {
    const boardId = pathname.split("/projects/")[1];
    const board = boards.find((b) => b.id === boardId);
    if (board) title = `${board.emoji} ${board.title}`;
  }

  const handleBellClick = useCallback(() => {
    setNotificationsOpen(!notificationsOpen);
  }, [notificationsOpen, setNotificationsOpen]);

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <button
            onClick={toggleSidebar}
            className="navbar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
          <h1 className="navbar-title">{title}</h1>
        </div>

        <div className="navbar-right">
          {/* Search trigger */}
          <button
            className="navbar-search-btn"
            onClick={() => setSearchOpen(true)}
            title="Search (⌘K)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="navbar-search-placeholder">Search…</span>
            <kbd>⌘K</kbd>
          </button>

          {/* Notification bell */}
          <div className="notif-bell-wrap">
            <button
              className={`navbar-icon-btn notif-bell-btn${notificationsOpen ? " notif-bell-btn--active" : ""}`}
              onClick={handleBellClick}
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              aria-expanded={notificationsOpen}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {mounted && unreadCount > 0 && (
                <span className="notif-badge" aria-hidden="true">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <NotificationPanel onClose={() => setNotificationsOpen(false)} />
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            className="navbar-icon-btn"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <div className="navbar-avatar" aria-label="User">
            <span>R</span>
          </div>
        </div>
      </header>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
