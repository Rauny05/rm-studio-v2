"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "REEL", label: "Reel" },
  { value: "SHORT", label: "Short" },
  { value: "YOUTUBE_VIDEO", label: "YouTube Video" },
  { value: "PODCAST", label: "Podcast" },
  { value: "BRAND_INTEGRATION", label: "Brand Integration" },
  { value: "PRODUCT_REVIEW", label: "Product Review" },
  { value: "EVENT_COVERAGE", label: "Event Coverage" },
  { value: "COMPARISON_VIDEO", label: "Comparison Video" },
  { value: "THUMBNAIL_ONLY", label: "Thumbnail Only" },
  { value: "COMMUNITY_POST", label: "Community Post" },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const PLATFORM_OPTIONS: { value: string; label: string }[] = [
  { value: "YOUTUBE", label: "YouTube" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "PODCAST", label: "Podcast" },
  { value: "TWITTER", label: "Twitter" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "COMMUNITY", label: "Community" },
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  brand: string;
  type: string;
  priority: string;
  deadline: string;
  platforms: string[];
  pocName: string;
  pocCompany: string;
  notes: string;
}

interface FieldErrors {
  title?: string;
  brand?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewDeliverablePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    title: "",
    brand: "",
    type: "REEL",
    priority: "MEDIUM",
    deadline: "",
    platforms: [],
    pocName: "",
    pocCompany: "",
    notes: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "title" || key === "brand") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function togglePlatform(p: string) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }));
  }

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.brand.trim()) errs.brand = "Brand is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        type: form.type,
        priority: form.priority,
        deadline: form.deadline || undefined,
        platforms: form.platforms,
        pocName: form.pocName.trim() || undefined,
        pocCompany: form.pocCompany.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      const res = await fetch("/api/v2/deliverables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create deliverable");

      router.push(`/deliverables/${data.deliverable.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        .nd-page {
          min-height: 100%;
          background: var(--app-bg);
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          padding: 28px 28px 64px;
          box-sizing: border-box;
        }

        /* Header */
        .nd-header {
          margin-bottom: 28px;
        }
        .nd-back-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          color: var(--app-text-muted);
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 120ms;
          letter-spacing: 0.01em;
        }
        .nd-back-link:hover {
          color: var(--app-text-secondary);
        }
        .nd-page-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--app-text);
          letter-spacing: -0.03em;
          margin: 0;
        }

        /* Form card */
        .nd-card {
          background: var(--app-surface);
          border: 1px solid var(--app-border);
          border-radius: 12px;
          padding: 28px 28px 32px;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Form groups */
        .nd-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .nd-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
        }
        .nd-field:last-child {
          margin-bottom: 0;
        }
        .nd-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--app-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .nd-label--required::after {
          content: " *";
          color: #ef4444;
        }

        /* Inputs */
        .nd-input,
        .nd-select,
        .nd-textarea {
          background: var(--app-elevated);
          border: 1px solid var(--app-border);
          border-radius: 7px;
          color: var(--app-text);
          font-size: 13px;
          font-family: inherit;
          padding: 9px 12px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 150ms, box-shadow 150ms;
          appearance: none;
          -webkit-appearance: none;
        }
        .nd-input::placeholder,
        .nd-textarea::placeholder {
          color: var(--app-text-muted);
        }
        .nd-input:focus,
        .nd-select:focus,
        .nd-textarea:focus {
          border-color: var(--app-accent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-accent) 18%, transparent 82%);
        }
        .nd-input--error,
        .nd-select--error {
          border-color: #ef4444;
        }
        .nd-input--error:focus,
        .nd-select--error:focus {
          box-shadow: 0 0 0 2px rgba(239,68,68,0.15);
        }
        .nd-select {
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .nd-textarea {
          resize: vertical;
          min-height: 88px;
          line-height: 1.5;
        }

        /* Field error */
        .nd-field-error {
          font-size: 11px;
          color: #ef4444;
          margin: 0;
        }

        /* Divider */
        .nd-divider {
          border: none;
          border-top: 1px solid var(--app-border);
          margin: 20px 0;
        }

        /* Platforms */
        .nd-platforms-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .nd-platform-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--app-border);
          background: var(--app-elevated);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          font-family: inherit;
          color: var(--app-text-secondary);
          transition: border-color 120ms, background 120ms, color 120ms;
          user-select: none;
        }
        .nd-platform-toggle:hover {
          background: var(--app-hover);
          border-color: var(--app-text-muted);
        }
        .nd-platform-toggle--checked {
          background: color-mix(in srgb, var(--app-accent) 10%, transparent 90%);
          border-color: color-mix(in srgb, var(--app-accent) 50%, transparent 50%);
          color: var(--app-text);
        }
        .nd-platform-check {
          width: 14px;
          height: 14px;
          border: 1.5px solid var(--app-border);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 120ms, border-color 120ms;
        }
        .nd-platform-toggle--checked .nd-platform-check {
          background: var(--app-accent);
          border-color: var(--app-accent);
        }

        /* Submit area */
        .nd-submit-area {
          margin-top: 28px;
        }
        .nd-submit-error {
          font-size: 12px;
          color: #ef4444;
          padding: 9px 12px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 7px;
          margin-bottom: 14px;
        }
        .nd-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 11px 20px;
          background: var(--app-accent);
          color: var(--app-bg);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: opacity 140ms;
        }
        .nd-submit-btn:hover:not(:disabled) {
          opacity: 0.88;
        }
        .nd-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="nd-page">
        {/* Header */}
        <div className="nd-header">
          <Link href="/deliverables" className="nd-back-link">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Deliverables
          </Link>
          <h1 className="nd-page-title">New Deliverable</h1>
        </div>

        {/* Form card */}
        <div className="nd-card">
          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div className="nd-field">
              <label className="nd-label nd-label--required">Title</label>
              <input
                className={`nd-input${errors.title ? " nd-input--error" : ""}`}
                type="text"
                placeholder="e.g. OnePlus 13 Review"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                disabled={submitting}
              />
              {errors.title && (
                <p className="nd-field-error">{errors.title}</p>
              )}
            </div>

            {/* Brand */}
            <div className="nd-field">
              <label className="nd-label nd-label--required">Brand</label>
              <input
                className={`nd-input${errors.brand ? " nd-input--error" : ""}`}
                type="text"
                placeholder="e.g. OnePlus"
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value)}
                disabled={submitting}
              />
              {errors.brand && (
                <p className="nd-field-error">{errors.brand}</p>
              )}
            </div>

            {/* Type + Priority */}
            <div className="nd-form-grid-2">
              <div className="nd-field">
                <label className="nd-label">Type</label>
                <select
                  className="nd-select"
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  disabled={submitting}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="nd-field">
                <label className="nd-label">Priority</label>
                <select
                  className="nd-select"
                  value={form.priority}
                  onChange={(e) => setField("priority", e.target.value)}
                  disabled={submitting}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div className="nd-field">
              <label className="nd-label">Deadline</label>
              <input
                className="nd-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setField("deadline", e.target.value)}
                disabled={submitting}
              />
            </div>

            <hr className="nd-divider" />

            {/* Platforms */}
            <div className="nd-field">
              <label className="nd-label">Platforms</label>
              <div className="nd-platforms-grid">
                {PLATFORM_OPTIONS.map((p) => {
                  const checked = form.platforms.includes(p.value);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      className={`nd-platform-toggle${checked ? " nd-platform-toggle--checked" : ""}`}
                      onClick={() => togglePlatform(p.value)}
                      disabled={submitting}
                    >
                      <span className="nd-platform-check">
                        {checked && (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--app-bg)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="nd-divider" />

            {/* POC Name + Company */}
            <div className="nd-form-grid-2">
              <div className="nd-field">
                <label className="nd-label">POC Name</label>
                <input
                  className="nd-input"
                  type="text"
                  placeholder="Contact name"
                  value={form.pocName}
                  onChange={(e) => setField("pocName", e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="nd-field">
                <label className="nd-label">POC Company</label>
                <input
                  className="nd-input"
                  type="text"
                  placeholder="Company"
                  value={form.pocCompany}
                  onChange={(e) => setField("pocCompany", e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="nd-field">
              <label className="nd-label">Notes</label>
              <textarea
                className="nd-textarea"
                placeholder="Deliverable brief, special requirements…"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Submit */}
            <div className="nd-submit-area">
              {submitError && (
                <div className="nd-submit-error">{submitError}</div>
              )}
              <button
                type="submit"
                className="nd-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Deliverable"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
