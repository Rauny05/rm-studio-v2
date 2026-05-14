"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

/* ── Data ── */
const TECH_ITEMS = [
  {
    id: 1,
    category: "Smartphone",
    name: "iPhone 16 Pro",
    emoji: "📱",
    verdict: "Buy It",
    score: 9.2,
    color: "#00D1FF",
    opinion:
      "Apple finally nailed the camera system for Indian conditions. The titanium build is gorgeous. Worth every rupee if you're in the ecosystem.",
  },
  {
    id: 2,
    category: "Laptop",
    name: "MacBook Pro M4",
    emoji: "💻",
    verdict: "Buy It",
    score: 9.5,
    color: "#7B61FF",
    opinion:
      "The M4 chip is witchcraft. 22 hours of battery in real usage. This is the laptop I'll recommend for the next 5 years.",
  },
  {
    id: 3,
    category: "EV",
    name: "Tata Nexon EV",
    emoji: "🚗",
    verdict: "India's Best",
    score: 8.8,
    color: "#FFC857",
    opinion:
      "The first EV that truly understands Indian roads, Indian budgets, and Indian charging anxiety. A watershed moment.",
  },
  {
    id: 4,
    category: "Wearable",
    name: "Apple Watch Ultra 2",
    emoji: "⌚",
    verdict: "Niche Buy",
    score: 8.1,
    color: "#00D1FF",
    opinion:
      "Brilliant engineering for athletes and adventurers. For everyone else? The regular Apple Watch does 90% of this at half the price.",
  },
  {
    id: 5,
    category: "Audio",
    name: "Sony WH-1000XM6",
    emoji: "🎧",
    verdict: "Must Have",
    score: 9.0,
    color: "#7B61FF",
    opinion:
      "The gold standard of noise cancellation. On any flight, train, or noisy office — these are your best friends. Period.",
  },
  {
    id: 6,
    category: "AI Tool",
    name: "ChatGPT Pro",
    emoji: "🤖",
    verdict: "Try It",
    score: 8.5,
    color: "#FFC857",
    opinion:
      "The most transformative software since the smartphone. Use it daily. Understand its limits. The future is here — use it wisely.",
  },
] as const;

/* Float durations per card so they feel organic */
const FLOAT_DURATIONS = [3.8, 4.2, 3.5, 4.6, 3.2, 4.9];

/* ── Individual gadget card ── */
function GadgetCard({
  item,
  index,
}: {
  item: (typeof TECH_ITEMS)[number];
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  /* 3D tilt on mouse move */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      /* Float animation — each card has slightly different timing */
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: FLOAT_DURATIONS[index],
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.3,
      }}
      style={{ perspective: "800px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="glass-card"
        style={{
          borderRadius: "24px",
          padding: "24px",
          cursor: "pointer",
          transformStyle: "preserve-3d",
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.15s ease-out",
          userSelect: "none",
        }}
        whileHover={{ borderColor: `${item.color}33` }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* Top row: emoji + category + score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "48px", lineHeight: 1 }}>{item.emoji}</span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Category pill */}
            <span
              style={{
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "100px",
                padding: "4px 10px",
              }}
            >
              {item.category}
            </span>

            {/* Score badge */}
            <span
              style={{
                fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "14px",
                color: "#00D1FF",
                background: "rgba(0,209,255,0.08)",
                border: "1px solid rgba(0,209,255,0.2)",
                borderRadius: "100px",
                padding: "4px 10px",
                letterSpacing: "-0.01em",
              }}
            >
              {item.score}
              <span
                style={{
                  fontSize: "10px",
                  color: "rgba(0,209,255,0.6)",
                  fontWeight: 500,
                }}
              >
                /10
              </span>
            </span>
          </div>
        </div>

        {/* Name */}
        <h3
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "20px",
            letterSpacing: "-0.02em",
            color: "#ffffff",
            margin: "0 0 12px",
          }}
        >
          {item.name}
        </h3>

        {/* Verdict badge */}
        <span
          style={{
            display: "inline-block",
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: item.color,
            background: `${item.color}18`,
            border: `1px solid ${item.color}40`,
            borderRadius: "100px",
            padding: "5px 14px",
            marginBottom: "16px",
          }}
        >
          {item.verdict}
        </span>

        {/* Expandable opinion */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="opinion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.7)",
                  margin: "0 0 16px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "16px",
                }}
              >
                {item.opinion}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle hint */}
        <p
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          {expanded ? "Close" : "Tap to read verdict"}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Request review input area ── */
function RequestReview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [gadget, setGadget] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gadget.trim()) return;
    setSubmitted(true);
    setGadget("");
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card"
      style={{
        borderRadius: "20px",
        padding: "40px",
        maxWidth: "600px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: "20px",
          letterSpacing: "-0.02em",
          color: "#ffffff",
          margin: "0 0 8px",
        }}
      >
        Can&apos;t find your gadget?
      </p>
      <p
        style={{
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontSize: "14px",
          color: "rgba(255,255,255,0.45)",
          margin: "0 0 28px",
        }}
      >
        Let me know what you&apos;d like reviewed next.
      </p>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.p
            key="thanks"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "15px",
              color: "#00D1FF",
              margin: 0,
            }}
          >
            Got it — I&apos;ll put it on the list.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "12px" }}
          >
            <input
              type="text"
              value={gadget}
              onChange={(e) => setGadget(e.target.value)}
              placeholder="e.g. Samsung Galaxy S25 Ultra"
              style={{
                flex: 1,
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: "14px",
                color: "#ffffff",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                padding: "14px 18px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(0,209,255,0.4)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")
              }
            />
            <button
              type="submit"
              style={{
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#050505",
                background: "#00D1FF",
                border: "none",
                borderRadius: "12px",
                padding: "14px 24px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 24px rgba(0,209,255,0.45)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Request →
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main export ── */
export function TechLab() {
  const headerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section
      className="section-pad"
      style={{
        background:
          "linear-gradient(180deg, #050505 0%, #080818 50%, #050505 100%)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section header */}
        <div ref={headerRef} style={{ marginBottom: "64px" }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#00D1FF",
              margin: "0 0 20px",
            }}
          >
            Tech Lab
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(44px, 7vw, 80px)",
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Every gadget,
            <br />
            <span className="gradient-text-primary">a verdict.</span>
          </motion.h2>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "80px",
          }}
        >
          {TECH_ITEMS.map((item, i) => (
            <GadgetCard key={item.id} item={item} index={i} />
          ))}
        </div>

        {/* Request review */}
        <RequestReview />
      </div>
    </section>
  );
}
