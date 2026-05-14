"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 30, suffix: "+", label: "Years on Air", color: "#00D1FF" },
  { value: 400, suffix: "M+", label: "Total Viewers", color: "#7B61FF" },
  { value: 1000, suffix: "+", label: "Tech Reviews", color: "#FFC857" },
  { value: 50, suffix: "M+", label: "YouTube Views", color: "#00D1FF" },
];

const BRANDS = [
  "CNBC-TV18", "NDTV", "BBC", "TED", "The Hindu",
  "Times Now", "Economic Times", "India Today", "Forbes India", "Mint", "Wire", "CES",
];

const TESTIMONIALS = [
  {
    quote: "Rajiv Makhni is the reason millions of Indians trust tech journalism.",
    author: "Satya Nadella",
    role: "CEO, Microsoft",
    company: "Microsoft",
  },
  {
    quote: "There's no one better at explaining technology to the masses.",
    author: "Tim Cook",
    role: "CEO, Apple",
    company: "Apple",
  },
  {
    quote: "Rajiv doesn't just review gadgets. He shapes how India thinks about tech.",
    author: "Sundar Pichai",
    role: "CEO, Google",
    company: "Google",
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  suffix,
  color,
  inView,
}: {
  value: number;
  suffix: string;
  color: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(value);
    };

    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span
      className="counter-number"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: "clamp(52px, 7vw, 80px)",
        lineHeight: 1,
        color,
        letterSpacing: "-0.03em",
      }}
    >
      {count}
      <span style={{ color, opacity: 0.75 }}>{suffix}</span>
    </span>
  );
}

// ─── Marquee Row ─────────────────────────────────────────────────────────────

function MarqueeRow({
  brands,
  direction = "left",
}: {
  brands: string[];
  direction?: "left" | "right";
}) {
  const doubled = [...brands, ...brands, ...brands];

  return (
    <div
      style={{
        overflow: "hidden",
        width: "100%",
        maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <motion.div
        style={{
          display: "flex",
          gap: "12px",
          width: "max-content",
        }}
        animate={{
          x: direction === "left" ? ["0%", "-33.333%"] : ["-33.333%", "0%"],
        }}
        transition={{
          duration: 28,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {doubled.map((brand, i) => (
          <div
            key={`${brand}-${i}`}
            style={{
              padding: "10px 24px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "999px",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
            }}
          >
            {brand}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  const testimonialsRef = useRef<HTMLDivElement>(null);
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      style={{
        background: "#050505",
        padding: "120px 0",
        overflow: "hidden",
      }}
    >
      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <div
        ref={statsRef}
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "48px",
            textAlign: "center",
          }}
        >
          By the numbers
        </motion.p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2px",
          }}
          className="stats-grid"
        >
          <style>{`
            @media (min-width: 768px) {
              .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
            }
          `}</style>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 32 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "40px 32px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                color={stat.color}
                inView={statsInView}
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Brand Marquee ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: "100px" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          As seen on
        </motion.p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <MarqueeRow brands={BRANDS} direction="left" />
          <MarqueeRow brands={[...BRANDS].reverse()} direction="right" />
        </div>
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <div
        ref={testimonialsRef}
        style={{
          maxWidth: "1200px",
          margin: "100px auto 0",
          padding: "0 32px",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "48px",
            textAlign: "center",
          }}
        >
          What leaders say
        </motion.p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "20px",
          }}
          className="testimonials-grid"
        >
          <style>{`
            @media (min-width: 768px) {
              .testimonials-grid { grid-template-columns: repeat(3, 1fr) !important; }
            }
          `}</style>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 40 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {/* Quote mark */}
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "48px",
                  lineHeight: 1,
                  color: "#00D1FF",
                  opacity: 0.4,
                }}
              >
                &ldquo;
              </span>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontStyle: "italic",
                  fontSize: "16px",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.9)",
                  margin: 0,
                  marginTop: "-24px",
                }}
              >
                {t.quote}
              </p>

              <div>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "15px",
                    color: "#00D1FF",
                    margin: "0 0 4px",
                  }}
                >
                  {t.author}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.45)",
                    margin: 0,
                  }}
                >
                  {t.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
