import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/toast";
import { TopBar } from "@/components/topbar";
import { DisclaimerBanner } from "@/components/ui";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The desk voice: a characterful serif for headings and the creator's own
// words (atoms). Optical sizing keeps it warm at display sizes.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "PostPilot — your AI Growth Lead",
  description:
    "Learns your IP, mines your materials, plans your calendar, and drafts posts you approve and export. A Lantr sample project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex h-screen overflow-hidden">
        <ToastProvider>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <DisclaimerBanner />
            <MobileNav />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-y-auto px-5 py-8">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
