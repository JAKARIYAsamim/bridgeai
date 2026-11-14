import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter } from "next/font/google";
import { DemoBanner, ToastProvider } from "@/components/ui";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const hind = Hind_Siliguri({ variable: "--font-hind", subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "BridgeAI",
  description: "Connects autism therapists and families between sessions.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5856d6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${hind.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ToastProvider>
          <DemoBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
