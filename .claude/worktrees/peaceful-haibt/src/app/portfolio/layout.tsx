import type { Metadata } from "next";
import { spaceGrotesk, inter } from "./fonts";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Rajiv Makhni — Tech. Simplified. Humanized.",
  description:
    "India's most iconic tech journalist. 30 years of decoding technology for 1.4 billion Indians.",
  openGraph: {
    title: "Rajiv Makhni — Tech. Simplified. Humanized.",
    description:
      "India's most iconic tech journalist. 30 years of decoding technology for 1.4 billion Indians.",
    type: "website",
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} portfolio-root`}
    >
      {children}
    </div>
  );
}
