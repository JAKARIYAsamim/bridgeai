import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import { Suspense } from "react";
import { MotionInit } from "@/components/legacy/motion-init";
import { ToastProvider } from "@/components/ui";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BridgeAI",
  description: "Connects autism therapists and families between sessions.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#eeecfb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${inter.variable} ${hind.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="stage">
          <main className="phone" id="phone">
            <div className="statusbar" id="statusbar" aria-hidden="true">
              <span>9:41</span>
              <i className="island" />
              <span className="sb-icons">
                <svg viewBox="0 0 18 12" style={{ height: 11, width: "auto" }}>
                  <rect x="0" y="8" width="3" height="4" rx="1" />
                  <rect x="5" y="5.500" width="3" height="6.500" rx="1" />
                  <rect x="10" y="3" width="3" height="9" rx="1" />
                  <rect x="15" y="0" width="3" height="12" rx="1" />
                </svg>
                <svg viewBox="0 0 16 12" style={{ height: 11, width: "auto" }}>
                  <path d="M8 9.500a1.500 1.500 0 1 0 0 2.500 1.500 1.500 0 0 0 0-2.500Z" />
                  <path d="M3.300 7.300a6.600 6.600 0 0 1 9.400 0l-1.400 1.400a4.600 4.600 0 0 0-6.600 0L3.300 7.300Z" />
                  <path d="M.500 4.500a10.600 10.600 0 0 1 15 0l-1.400 1.400a8.600 8.600 0 0 0-12.200 0L.500 4.500Z" />
                </svg>
                <svg viewBox="0 0 27 12" style={{ height: 11, width: "auto" }}>
                  <rect x=".500" y=".500" width="22" height="11" rx="3.200" fill="none" stroke="currentColor" opacity=".45" />
                  <rect x="2" y="2" width="19" height="8" rx="2" />
                  <rect x="24" y="4" width="2" height="4" rx="1" opacity=".5" />
                </svg>
              </span>
            </div>
            <div id="wall" />
            <MotionInit />
            <LangProvider fallback="bn">
              <ToastProvider>
                <div id="app">
                  <Suspense fallback={null}>
                    {children}
                  </Suspense>
                </div>
              </ToastProvider>
            </LangProvider>
            <div id="topedge" aria-hidden="true" />
          </main>
        </div>
      </body>
    </html>
  );
}
