"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Deliverable = {
  id: string; pnNo: string; title: string; brand: string;
  status: string; priority: string; type: string; deadline: string | null;
  emailSent: boolean; advance50: boolean; payment100: boolean;
  pocName: string | null; pocCompany: string | null; createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:"#71717a", ACTIVE:"#2563eb", IN_PRODUCTION:"#f97316",
  IN_EDIT:"#8b5cf6", IN_REVIEW:"#eab308", REVISION_REQUESTED:"#ef4444",
  APPROVED:"#22c55e", SCHEDULED:"#06b6d4", PUBLISHED:"#10b981", ARCHIVED:"#52525b",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT:"Draft", ACTIVE:"Active", IN_PRODUCTION:"Production",
  IN_EDIT:"Editing", IN_REVIEW:"Review", REVISION_REQUESTED:"Revision",
  APPROVED:"Approved", SCHEDULED:"Scheduled", PUBLISHED:"Published", ARCHIVED:"Archived",
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW:"#22c55e", MEDIUM:"#f97316", HIGH:"#ef4444", URGENT:"#dc2626",
};

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string | number; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)", borderRadius:12, padding:"20px 22px", display:"flex", flexDirection:"column", gap:10, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:accent, borderRadius:"12px 12px 0 0" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--app-text-muted)" }}>{label}</span>
        <span style={{ opacity:0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize:32, fontWeight:700, letterSpacing:"-0.04em", color:"var(--app-text)", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:"var(--app-text-muted)" }}>{sub}</div>
    </div>
  );
}

function MiniBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:64, padding:"0 4px" }}>
      {data.map(d => (
        <div key={d.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:9, color:"var(--app-text-muted)", fontWeight:600 }}>{d.value > 0 ? d.value : ""}</span>
          <div style={{ width:"100%", height:Math.max((d.value / max) * 44, d.value > 0 ? 4 : 2), background:d.color, borderRadius:3, opacity:0.85 }} />
          <span style={{ fontSize:9, color:"var(--app-text-muted)", textAlign:"center", lineHeight:1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentDots({ emailSent, advance50, payment100 }: { emailSent:boolean; advance50:boolean; payment100:boolean }) {
  return (
    <div style={{ display:"flex", gap:3, alignItems:"center" }}>
      {[emailSent, advance50, payment100].map((done, i) => (
        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:done ? "#22c55e" : "var(--app-border)" }} />
      ))}
    </div>
  );
}

function DeliverableRow({ d }: { d: Deliverable }) {
  const color = STATUS_COLOR[d.status] ?? "#71717a";
  const pColor = PRIORITY_COLOR[d.priority] ?? "#71717a";
  return (
    <Link
      href={`/deliverables/${d.id}`}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid var(--app-border)", textDecoration:"none" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width:3, height:26, borderRadius:2, background:pColor, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:"var(--app-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.title}</div>
        <div style={{ fontSize:11, color:"var(--app-text-muted)", marginTop:1 }}>{d.brand} · {d.pnNo}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <PaymentDots emailSent={d.emailSent} advance50={d.advance50} payment100={d.payment100} />
        <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, background:color+"20", color }}>{STATUS_LABEL[d.status] ?? d.status}</span>
      </div>
    </Link>
  );
}

export function DashboardView() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery<{ deliverables: Deliverable[] }>({
    queryKey: ["dashboard-deliverables"],
    queryFn: () => fetch("/api/v2/deliverables").then(r => r.json()),
    staleTime: 60_000,
  });

  const deliverables = data?.deliverables ?? [];
  const total = deliverables.length;
  const active = deliverables.filter(d => ["ACTIVE","IN_PRODUCTION","IN_EDIT","IN_REVIEW","REVISION_REQUESTED","APPROVED","SCHEDULED"].includes(d.status)).length;
  const published = deliverables.filter(d => d.status === "PUBLISHED").length;
  const paid = deliverables.filter(d => d.payment100).length;
  const emailCount = deliverables.filter(d => d.emailSent).length;
  const advanceCount = deliverables.filter(d => d.advance50).length;

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400_000);
  const dueSoon = deliverables
    .filter(d => d.deadline && new Date(d.deadline) >= now && new Date(d.deadline) <= in7)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const recent = [...deliverables]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  const statusCounts = deliverables.reduce((acc, d) => { acc[d.status] = (acc[d.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const chartData = Object.entries(STATUS_COLOR).filter(([s]) => statusCounts[s]).map(([s, color]) => ({ label: STATUS_LABEL[s] ?? s, value: statusCounts[s] ?? 0, color }));

  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.04em", margin:"0 0 4px", color:"var(--app-text)" }}>
          {greeting}{firstName ? `, ${firstName}` : ""} 👋
        </h2>
        <p style={{ fontSize:14, color:"var(--app-text-muted)", margin:0 }}>
          {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          {isLoading ? " · Loading…" : ` · ${total} deliverables`}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        <StatCard accent="#7c3aed" label="Total" value={total} sub={`${active} active`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <StatCard accent="#2563eb" label="Active" value={active} sub={`${Math.round(active/(total||1)*100)}% of total`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard accent="#10b981" label="Published" value={published} sub={`${Math.round(published/(total||1)*100)}% completion`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard accent="#f97316" label="Fully paid" value={paid} sub={`${advanceCount} at 50% · ${emailCount} emailed`}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)", borderRadius:12, padding:"18px 20px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--app-text)", marginBottom:14 }}>Status breakdown</div>
          {chartData.length > 0 ? (
            <>
              <MiniBar data={chartData} />
              <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 10px", marginTop:12 }}>
                {chartData.map(d => (
                  <span key={d.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--app-text-muted)" }}>
                    <span style={{ width:7, height:7, borderRadius:2, background:d.color, display:"inline-block" }} />
                    {d.label} ({d.value})
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--app-text-muted)", fontSize:13 }}>No data yet</div>
          )}
        </div>

        <div style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)", borderRadius:12, padding:"18px 20px" }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--app-text)", marginBottom:14 }}>Payment funnel</div>
          {[
            { label:"Email sent", value:emailCount, color:"#06b6d4" },
            { label:"50% advance", value:advanceCount, color:"#f97316" },
            { label:"Full payment", value:paid, color:"#22c55e" },
          ].map(item => (
            <div key={item.label} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"var(--app-text-muted)" }}>{item.label}</span>
                <span style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.value}</span>
              </div>
              <div style={{ height:6, background:"var(--app-border)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(item.value/(total||1))*100}%`, background:item.color, borderRadius:3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:12, fontSize:12, color:"var(--app-text-muted)" }}>
            {total > 0 ? `${Math.round((paid/total)*100)}% fully paid of ${total} total` : "No data"}
          </div>
        </div>
      </div>

      {/* Bottom panels */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid var(--app-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--app-text)" }}>⏰ Due this week</span>
            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:dueSoon.length > 0 ? "#ef444420":"var(--app-border)", color:dueSoon.length > 0 ? "#ef4444":"var(--app-text-muted)", fontWeight:600 }}>{dueSoon.length}</span>
          </div>
          {dueSoon.length === 0
            ? <div style={{ padding:24, textAlign:"center", color:"var(--app-text-muted)", fontSize:13 }}>🎉 Nothing due soon</div>
            : dueSoon.map(d => <DeliverableRow key={d.id} d={d} />)
          }
        </div>

        <div style={{ background:"var(--app-surface)", border:"1px solid var(--app-border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"13px 16px", borderBottom:"1px solid var(--app-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--app-text)" }}>🕐 Recently added</span>
            <Link href="/deliverables" style={{ fontSize:11, color:"#7c3aed", textDecoration:"none", fontWeight:600 }}>View all →</Link>
          </div>
          {recent.length === 0
            ? <div style={{ padding:24, textAlign:"center", color:"var(--app-text-muted)", fontSize:13 }}>No deliverables yet</div>
            : recent.map(d => <DeliverableRow key={d.id} d={d} />)
          }
        </div>
      </div>
    </div>
  );
}
