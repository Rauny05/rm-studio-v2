"use client";

import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Data ── */
const PILLARS = [
  {
    icon: "◈",
    title: "Simplify First",
    body: "Before I explain any technology, I ask myself: can my grandmother understand this? If yes, we're good. If not, I go back to the drawing board.",
  },
  {
    icon: "◎",
    title: "Truth Over Hype",
    body: "In 30 years, I've seen a thousand 'revolutionary' products. Maybe 12 actually were. I owe my audience honesty — even when it's uncomfortable.",
  },
  {
    icon: "◇",
    title: "India First",
    body: "Every review, every opinion, every analysis is filtered through one question: what does this mean for India? For its 1.4 billion people?",
  },
];

const MILESTONES = [
  { year: "1995", event: "Started as tech correspondent" },
  { year: "2002", event: "Launched Gadget Guru, India's first tech show" },
  { year: "2008", event: "First Indian to review iPhone on air" },
  { year: "2016", event: "1 billion cumulative views" },
  { year: "2020", event: "Launched Tech Tonight on CNBC-TV18" },
  { year: "2025", event: "30 Years. Still Day One." },
];

const QUOTE_TEXT = "I don't review gadgets. I translate the future.";

/* ── Word-split heading animation ── */
function AnimatedHeading() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const line1 = "Technology is not".split(" ");
  const line2 = "for technologists.".split(" ");

  const wordVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
    }),
  };

  return (
    <div ref={ref}>
      <h2
        style={{
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(52px, 8vw, 96px)",
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          margin: 0,
          color: "#ffffff",
        }}
      >
        {/* Line 1 */}
        <span style={{ display: "block" }}>
          {line1.map((word, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={wordVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              style={{ display: "inline-block", marginRight: "0.28em" }}
            >
              {word}
            </motion.span>
          ))}
        </span>

        {/* Line 2 — last word gradient */}
        <span style={{ display: "block" }}>
          {line2.map((word, i) => {
            const isLast = i === line2.length - 1;
            return (
              <motion.span
                key={i}
                custom={line1.length + i}
                variants={wordVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                className={isLast ? "gradient-text-primary" : undefined}
                style={{ display: "inline-block", marginRight: isLast ? 0 : "0.28em" }}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      </h2>
    </div>
  );
}

/* ── Philosophy pillar card ── */
function PillarCard({
  pillar,
  index,
}: {
  pillar: (typeof PILLARS)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
      className="glass-card"
      style={{
        borderRadius: "16px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <span
        style={{
          fontSize: "28px",
          color: "#00D1FF",
          lineHeight: 1,
        }}
      >
        {pillar.icon}
      </span>
      <h3
        style={{
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: "20px",
          letterSpacing: "-0.02em",
          color: "#ffffff",
          margin: 0,
        }}
      >
        {pillar.title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontSize: "15px",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.45)",
          margin: 0,
        }}
      >
        {pillar.body}
      </p>
    </motion.div>
  );
}

/* ── GSAP pull-quote with char-by-char reveal ── */
function PullQuote() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const chars = charsRef.current;
    if (!chars.length || typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        chars,
        { opacity: 0 },
        {
          opacity: 1,
          stagger: 0.025,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            end: "top 30%",
            scrub: false,
            toggleActions: "play none none reverse",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const chars = QUOTE_TEXT.split("");

  return (
    <div
      ref={containerRef}
      style={{
        textAlign: "center",
        padding: "80px 24px",
        position: "relative",
        maxWidth: "860px",
        margin: "0 auto",
      }}
    >
      {/* Opening quotation mark */}
      <div
        style={{
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          fontSize: "120px",
          lineHeight: 0.8,
          color: "#00D1FF",
          opacity: 0.3,
          userSelect: "none",
          marginBottom: "8px",
        }}
        aria-hidden="true"
      >
        &ldquo;
      </div>

      {/* Quote chars */}
      <p
        style={{
          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: "clamp(28px, 4vw, 44px)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "#ffffff",
          margin: "0 0 24px",
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) charsRef.current[i] = el;
            }}
            style={{ opacity: 0 }}
          >
            {char}
          </span>
        ))}
      </p>

      {/* Attribution */}
      <p
        style={{
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontSize: "14px",
          color: "rgba(255,255,255,0.45)",
          margin: 0,
          letterSpacing: "0.04em",
        }}
      >
        — Rajiv Makhni, TED Talk 2023
      </p>
    </div>
  );
}

/* ── Horizontal timeline ── */
function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
            duration: 1,
          },
          duration: 1.2,
        }
      );

      gsap.fromTo(
        ".timeline-item",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          ease: "power2.out",
          duration: 0.6,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} style={{ padding: "0 24px" }}>
      {/* Scrollable wrapper on mobile */}
      <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            gap: "0",
            minWidth: "700px",
          }}
        >
          {/* Connecting line */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "24px",
              right: "24px",
              height: "1px",
              background: "rgba(255,255,255,0.12)",
              zIndex: 0,
            }}
          >
            <div
              ref={lineRef}
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, #00D1FF, #7B61FF)",
                transformOrigin: "left center",
                transform: "scaleX(0)",
              }}
            />
          </div>

          {MILESTONES.map((m, i) => (
            <div
              key={i}
              className="timeline-item"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                position: "relative",
                zIndex: 1,
                opacity: 0,
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#050505",
                  border: "2px solid #00D1FF",
                  boxShadow: "0 0 12px rgba(0,209,255,0.4)",
                  flexShrink: 0,
                }}
              />

              {/* Year */}
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#00D1FF",
                  letterSpacing: "-0.01em",
                }}
              >
                {m.year}
              </span>

              {/* Event */}
              <span
                style={{
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: "12px",
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.55)",
                  textAlign: "center",
                  maxWidth: "100px",
                }}
              >
                {m.event}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export function TechPhilosophy() {
  return (
    <section
      className="section-pad grid-lines"
      style={{ background: "#050505", overflow: "hidden" }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#00D1FF",
            margin: "0 0 24px",
          }}
        >
          The Philosophy
        </motion.p>

        {/* Animated heading */}
        <div style={{ marginBottom: "72px" }}>
          <AnimatedHeading />
        </div>

        {/* Philosophy pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "0",
          }}
        >
          {PILLARS.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>

        {/* Pull quote */}
        <PullQuote />

        {/* Section divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.06)",
            margin: "0 0 72px",
          }}
        />

        {/* Timeline heading */}
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            margin: "0 0 40px 24px",
          }}
        >
          A Career in Milestones
        </motion.h3>

        {/* Horizontal timeline */}
        <Timeline />
      </div>
    </section>
  );
}
