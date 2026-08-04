"use client";
import { useLanguage } from "@/lib/language";
import EnglishPage from "./page.en";
import ChinesePage from "./page.zh";
export default function LocalizedPage() {
  return useLanguage() === "en" ? <EnglishPage /> : <ChinesePage />;
}
