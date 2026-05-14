"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <section
      ref={ref}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        position: "relative",
        padding: "80px 24px",
        overflow: "hidden",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,209,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "900px",
          width: "100%",
          gap: "0px",
        }}
      >
        {/* Label */}
        <motion.p
          variants={itemVariants}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#00D1FF",
            margin: "0 0 28px",
          }}
        >
          Ready to collaborate?
        </motion.p>

        {/* Headline */}
        <motion.h2
          variants={itemVariants}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(48px, 8vw, 120px)",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "#ffffff",
            margin: "0 0 36px",
            whiteSpace: "pre-line",
          }}
        >
          {"Let's Build\nSomething\nUnforgettable."}
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={itemVariants}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "16px",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.45)",
            maxWidth: "480px",
            margin: "0 0 48px",
          }}
        >
          Speaking engagements, partnerships, reviews, or just a conversation — Rajiv is all ears.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={itemVariants}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          <motion.a
            href="mailto:rajiv@techtonight.in"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#00D1FF",
              color: "#050505",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              borderRadius: "999px",
              padding: "20px 40px",
              textDecoration: "none",
              cursor: "pointer",
              border: "none",
              whiteSpace: "nowrap",
            }}
          >
            Start a Conversation
          </motion.a>

          <motion.a
            href="#work"
            whileHover={{
              borderColor: "#00D1FF",
              color: "#00D1FF",
            }}
            transition={{ duration: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: "#ffffff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              borderRadius: "999px",
              padding: "20px 40px",
              textDecoration: "none",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            View All Work →
          </motion.a>
        </motion.div>

        {/* Contact info */}
        <motion.p
          variants={itemVariants}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.02em",
            margin: 0,
          }}
        >
          rajiv@techtonight.in&nbsp;&nbsp;·&nbsp;&nbsp;New Delhi, India
        </motion.p>
      </motion.div>
    </section>
  );
}
