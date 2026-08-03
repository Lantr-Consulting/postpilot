import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

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
  title: "PostPilot — an AI Growth Lead that knows your story",
  description:
    "It learns your IP, mines your raw materials into cited atoms, drafts posts through an editorial engine, and runs campaigns while you're away. Export-only — you press publish. A Lantr sample project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // data-theme is set pre-paint from localStorage; the server can't know it.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        {/* Apply the saved theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("pp-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}',
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
