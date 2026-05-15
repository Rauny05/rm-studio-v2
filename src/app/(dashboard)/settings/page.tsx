"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const ROLES = [
  { key: "ADMIN", label: "Admin", desc: "Full access to everything" },
  { key: "PRODUCTION_LEAD", label: "Production Lead", desc: "Manage shoots and production tasks" },
  { key: "EDITOR", label: "Editor", desc: "Claim and manage edit tasks" },
  { key: "THUMBNAIL_DESIGNER", label: "Thumbnail Designer", desc: "Create and upload thumbnails" },
  { key: "PUBLISHER", label: "Publisher", desc: "Schedule and publish content" },
  { key: "WRITER", label: "Writer", desc: "Create scripts and deliverables" },
  { key: "FINANCE", label: "Finance", desc: "View financial data and analytics" },
  { key: "VIEWER", label: "Viewer", desc: "Read-only access" },
];

const SHEET_ID = "1PImkkw3DEsbZ8Vaveqmc-nyPkP_xQhoAGfesPeE1_fY";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--app-text-muted)", margin: "0 0 16px" }}>
        {title}
      </h3>
      <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--app-border)" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--app-text)", marginBottom: desc ? 2 : 0 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "var(--app-text-muted)" }}>{desc}</div>}
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: color + "20", color, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const role = (session?.user as { role?: string })?.role ?? "VIEWER";
  const roleInfo = ROLES.find(r => r.key === role) ?? ROLES[ROLES.length - 1];

  async function handleSheetSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/deliverables");
      const data = await res.json();
      if (data.rows?.length) {
        setSyncResult(`✓ Synced ${data.rows.length} deliverables from Google Sheets`);
      } else {
        setSyncResult("⚠ No data found in the sheet");
      }
    } catch {
      setSyncResult("✗ Sync failed — check console");
    }
    setSyncing(false);
  }

  function copySheetUrl() {
    navigator.clipboard.writeText(`https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px", color: "var(--app-text)" }}>
          Settings
        </h2>
        <p style={{ fontSize: 14, color: "var(--app-text-muted)", margin: 0 }}>
          Manage your account, integrations, and workspace preferences.
        </p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid var(--app-border)" }}>
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={56}
              height={56}
              style={{ borderRadius: "50%", border: "2px solid var(--app-border)" }}
            />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#7c3aed22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {session?.user?.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--app-text)" }}>{session?.user?.name ?? "—"}</div>
            <div style={{ fontSize: 13, color: "var(--app-text-muted)", marginTop: 2 }}>{session?.user?.email ?? "—"}</div>
            <div style={{ marginTop: 6 }}>
              <Badge color="#7c3aed">{roleInfo.label}</Badge>
            </div>
          </div>
        </div>
        <Row label="Role" desc={roleInfo.desc}>
          <Badge color="#7c3aed">{roleInfo.label}</Badge>
        </Row>
        <Row label="Auth provider" desc="Signed in via Google OAuth">
          <Badge color="#2563eb">Google</Badge>
        </Row>
        <div style={{ padding: "16px 20px" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            style={{ padding: "8px 16px", borderRadius: 8, background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </Section>

      {/* Google Sheets Integration */}
      <Section title="Google Sheets Integration">
        <Row label="Connected sheet" desc={`Sheet ID: ${SHEET_ID.slice(0, 20)}…`}>
          <button
            onClick={copySheetUrl}
            style={{ padding: "6px 12px", borderRadius: 6, background: "var(--app-bg)", border: "1px solid var(--app-border)", fontSize: 12, color: "var(--app-text)", cursor: "pointer" }}
          >
            {copied ? "✓ Copied" : "Copy URL"}
          </button>
        </Row>
        <Row label="Sync deliverables" desc="Pull latest data from the Google Sheet into the database">
          <button
            onClick={handleSheetSync}
            disabled={syncing}
            style={{ padding: "6px 14px", borderRadius: 6, background: syncing ? "var(--app-bg)" : "#22c55e", color: syncing ? "var(--app-text-muted)" : "#fff", border: "1px solid var(--app-border)", fontSize: 12, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer" }}
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </Row>
        {syncResult && (
          <div style={{ padding: "12px 20px", fontSize: 13, color: syncResult.startsWith("✓") ? "#22c55e" : "#f97316", borderTop: "1px solid var(--app-border)" }}>
            {syncResult}
          </div>
        )}
        <Row label="Auto-sync" desc="Automatic sync runs on page load (5 min cache)" />
      </Section>

      {/* Roles Reference */}
      <Section title="Roles & Permissions">
        {ROLES.map((r, i) => (
          <div
            key={r.key}
            style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < ROLES.length - 1 ? "1px solid var(--app-border)" : "none", background: r.key === role ? "#7c3aed08" : "transparent" }}
          >
            <div>
              <span style={{ fontSize: 13, fontWeight: r.key === role ? 700 : 500, color: r.key === role ? "#7c3aed" : "var(--app-text)" }}>{r.label}</span>
              <span style={{ fontSize: 12, color: "var(--app-text-muted)", marginLeft: 8 }}>{r.desc}</span>
            </div>
            {r.key === role && <Badge color="#7c3aed">You</Badge>}
          </div>
        ))}
      </Section>

      {/* App info */}
      <Section title="About">
        <Row label="Version" desc="RM Studio v2 — Production OS"><Badge color="#71717a">v2.0</Badge></Row>
        <Row label="Database" desc="Supabase (PostgreSQL 17, ap-south-1)"><Badge color="#22c55e">Connected</Badge></Row>
        <Row label="Auth" desc="NextAuth v5 — JWT sessions + Google OAuth" />
        <Row label="Deployment" desc="Vercel (bom1 — Mumbai)" />
      </Section>
    </div>
  );
}
