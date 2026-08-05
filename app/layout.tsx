import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "PostPilot｜Lantr 往届学生作品",
  description:
    "一位 Lantr 往届学生完成的内容创作助手：根据用户提供的真实材料寻找选题、准备初稿，并在发布前逐项检查。所有内容仍由用户审核和发布。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      // data-theme is set pre-paint from localStorage; the server can't know it.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-screen">
        <Script
          id="postpilot-preferences"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("pp-theme")==="light")document.documentElement.dataset.theme="light";var l=document.cookie.match(/(?:^|; )lantr-lang=(en|zh)/)?.[1]||localStorage.getItem("lantr-lang");document.documentElement.lang=l==="en"?"en":"zh-CN"}catch(e){}',
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
