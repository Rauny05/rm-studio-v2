"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// GSAP imported for potential future use — ScrollTrigger registration
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ContentCategory = "Reviews" | "Explainers" | "Opinions" | "Podcasts";
type ContentType = "video" | "article" | "podcast";

interface ContentItem {
  id: number;
  category: ContentCategory;
  title: string;
  duration: string;
  views: string;
  type: ContentType;
  tag: string | null;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FILTER_TABS = ["All", "Reviews", "Explainers", "Opinions", "Podcasts"];

const CONTENT_ITEMS: ContentItem[] = [
  { id: 1, category: "Reviews", title: "iPhone 16 Pro: India's Honest Verdict", duration: "18:42", views: "4.2M", type: "video", tag: "EXCLUSIVE" },
  { id: 2, category: "Explainers", title: "AI Is Eating India: What You Need to Know", duration: "24:15", views: "8.1M", type: "video", tag: "VIRAL" },
  { id: 3, category: "Opinions", title: "Why India's 5G Rollout Is Both Brilliant and Broken", duration: "12 min read", views: "2.3M", type: "article", tag: null },
  { id: 4, category: "Podcasts", title: "Tech Tomorrow: The Next 10 Years", duration: "52:10", views: "1.8M", type: "podcast", tag: "SERIES" },
  { id: 5, category: "Reviews", title: "Samsung Galaxy S25 Ultra vs OnePlus 13", duration: "22:30", views: "5.6M", type: "video", tag: null },
  { id: 6, category: "Explainers", title: "How ChatGPT Actually Works — No Jargon", duration: "15:20", views: "12M", type: "video", tag: "TOP" },
  { id: 7, category: "Opinions", title: "The EV Revolution India Wasn't Ready For", duration: "8 min read", views: "1.1M", type: "article", tag: null },
  { id: 8, category: "Reviews", title: "MacBook Pro M4: Is It Worth ₹2 Lakh?", duration: "20:45", views: "3.4M", type: "video", tag: "TRENDING" },
  { id: 9, category: "Podcasts", title: "Founders Unplugged: The Startup India Story", duration: "48:22", views: "980K", type: "podcast", tag: null },
];

const CATEGORY_ICONS: Record<ContentCategory, string> = {
  Reviews: "📱",
  Explainers: "🧠",
  Opinions: "💬",
  Podcasts: "🎙",
};

const ACTION_LABEL: Record<ContentType, string> = {
  video: "▶ Play",
  article: "Read",
  podcast: "▶ Listen",
};

// ─── Card Component ───────────────────────────────────────────────────────────

interface TiltState {
  rotateX: number;
  rotateY: number;
}

function ContentCard({ item }: { item: ContentItem }) {
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rotateX: -dy * 6, rotateY: dx * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
    setHovered(false);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={hovered ? "glow-primary" : ""}
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        transformStyle: "preserve-3d",
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: hovered
          ? "transform 0.1s ease-out, box-shadow 0.3s ease"
          : "transform 0.4s ease-out, box-shadow 0.3s ease",
      }}
    >
      {/* Thumbnail area — 16:9 */}
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          background: "#000000",
          overflow: "hidden",
        }}
      >
        {/* Category icon background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
            opacity: 0.18,
          }}
        >
          {CATEGORY_ICONS[item.category]}
        </div>

        {/* Gradient overlay */}
        <div
          className="content-card-overlay"
          style={{
            position: "absolute",
            inset: 0,
          }}
        />

        {/* Tag pill top-right */}
        {item.tag && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
            }}
          >
            <span
              className="tag-pill"
              style={{
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
              }}
            >
              {item.tag}
            </span>
          </div>
        )}

        {/* Category icon — visible center */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
          }}
        >
          {CATEGORY_ICONS[item.category]}
        </div>

        {/* Play/Read overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              background: "#00D1FF",
              color: "#050505",
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              letterSpacing: "0.06em",
              borderRadius: "100px",
              padding: "8px 20px",
              whiteSpace: "nowrap",
            }}
          >
            {ACTION_LABEL[item.type]}
          </div>
        </motion.div>
      </div>

      {/* Card info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h4
          style={{
            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            fontWeight: 500,
            fontSize: "15px",
            color: "#ffffff",
            margin: "0 0 8px 0",
            lineHeight: 1.35,
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "12px",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {item.duration}
          </span>
          <span
            style={{
              width: "2px",
              height: "2px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "12px",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {item.views} views
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContentUniverse() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered =
    activeFilter === "All"
      ? CONTENT_ITEMS
      : CONTENT_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <section
      className="section-pad"
      style={{
        background: "#050505",
        position: "relative",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 40px",
        }}
      >
        {/* Section header */}
        <div style={{ marginBottom: "48px" }}>
          <p
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#00D1FF",
              margin: "0 0 12px 0",
            }}
          >
            CONTENT UNIVERSE
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
              margin: "0 0 36px 0",
            }}
          >
            Watch. Read. Listen.
          </h2>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = tab === activeFilter;
              return (
                <motion.button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    fontFamily: "var(--font-inter), 'Inter', sans-serif",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "8px 20px",
                    borderRadius: "100px",
                    cursor: "pointer",
                    border: isActive
                      ? "1px solid #00D1FF"
                      : "1px solid rgba(255,255,255,0.12)",
                    background: isActive ? "#00D1FF" : "transparent",
                    color: isActive ? "#050505" : "rgba(255,255,255,0.6)",
                    transition: "background 0.25s ease, color 0.25s ease, border-color 0.25s ease",
                  }}
                >
                  {tab}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content grid */}
        <motion.div
          layout
          className="content-universe-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ContentCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Inline responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .content-universe-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .content-universe-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
