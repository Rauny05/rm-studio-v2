"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const CARDS = [
  {
    number: "01",
    label: "JOURNALIST",
    title: "The Voice of Tech India",
    body: "From Gadget Guru to Tech Tonight — redefining how India consumes technology news for 30 years.",
    stat: "30+ Years",
    color: "#00D1FF",
  },
  {
    number: "02",
    label: "BROADCASTER",
    title: "Prime Time. Every Time.",
    body: "CNBC-TV18, NDTV Gadgets, Doordarshan — reaching 400M+ viewers with clear, honest tech journalism.",
    stat: "400M+ Viewers",
    color: "#7B61FF",
  },
  {
    number: "03",
    label: "REVIEWER",
    title: "India's Most Trusted Review",
    body: "First Indian journalist to review every iPhone, Galaxy, and Pixel from day one. Zero compromise.",
    stat: "1000+ Reviews",
    color: "#FFC857",
  },
  {
    number: "04",
    label: "EDUCATOR",
    title: "Simplifying the Complex",
    body: "From AI to EVs — breaking down the world's hardest tech concepts for everyday Indians.",
    stat: "50M+ Students",
    color: "#00D1FF",
  },
  {
    number: "05",
    label: "SPEAKER",
    title: "The Stage Is Alive",
    body: "Keynotes at CES, MWC, and India's biggest tech conferences. The room always listens.",
    stat: "200+ Stages",
    color: "#7B61FF",
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Identity() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  // Track horizontal scroll progress for the progress bar
  const [hScrollProgress, setHScrollProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const ctx = gsap.context(() => {
      const tween = gsap.to(inner, {
        x: () => -(inner.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + inner.scrollWidth,
          scrub: 1,
          pin: true,
          onUpdate: (self) => {
            setHScrollProgress(self.progress);
          },
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        height: "100vh",
        overflow: "hidden",
        background: "#050505",
        position: "relative",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          position: "absolute",
          top: "48px",
          left: "10vw",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), 'Inter', sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#00D1FF",
            marginBottom: "10px",
            margin: "0 0 10px 0",
          }}
        >
          THE STORY
        </p>
        <h2
          className="rm-display"
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(36px, 5vw, 64px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "#ffffff",
            margin: 0,
            whiteSpace: "pre-line",
          }}
        >
          {"Three Decades,\nOne Mission."}
        </h2>
      </div>

      {/* Horizontal scroll inner container */}
      <div
        ref={innerRef}
        className="horizontal-scroll-container"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "100vh",
          willChange: "transform",
          paddingLeft: "10vw",
          gap: "24px",
        }}
      >
        {CARDS.map((card, i) => (
          <motion.div
            key={card.number}
            className="glass-card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              minWidth: "420px",
              height: "520px",
              borderRadius: "16px",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: "default",
              flexShrink: 0,
              // Add extra right padding on the last card
              marginRight: i === CARDS.length - 1 ? "10vw" : "0",
            }}
          >
            {/* Top: Big number + label pill */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "72px",
                  lineHeight: 1,
                  color: hexToRgba(card.color, 0.15),
                  marginBottom: "16px",
                  letterSpacing: "-0.04em",
                }}
              >
                {card.number}
              </div>

              <span
                className="tag-pill"
                style={{
                  display: "inline-block",
                  background: hexToRgba(card.color, 0.1),
                  border: `1px solid ${hexToRgba(card.color, 0.2)}`,
                  color: card.color,
                  borderRadius: "100px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                }}
              >
                {card.label}
              </span>
            </div>

            {/* Middle: Title + Body */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 0" }}>
              <h3
                className="rm-heading"
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "28px",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  color: "#ffffff",
                  margin: "0 0 16px 0",
                }}
              >
                {card.title}
              </h3>
              <p
                className="rm-body"
                style={{
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.45)",
                  margin: 0,
                }}
              >
                {card.body}
              </p>
            </div>

            {/* Bottom: Stat + colored border line */}
            <div
              style={{
                borderTop: `1px solid ${hexToRgba(card.color, 0.25)}`,
                paddingTop: "20px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "26px",
                  color: card.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {card.stat}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress indicator at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          left: "10vw",
          right: "10vw",
          height: "1px",
          background: "rgba(255,255,255,0.08)",
          zIndex: 10,
          borderRadius: "1px",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #00D1FF, #7B61FF)",
            borderRadius: "1px",
            transformOrigin: "left",
            scaleX: hScrollProgress,
          }}
        />
      </div>
    </section>
  );
}
