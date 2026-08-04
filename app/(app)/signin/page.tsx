"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

export default function SignInPage() {
  const router = useRouter();
  const language = useLanguage();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const creds = { email: email.trim(), password };
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp(creds)
        : await supabase.auth.signInWithPassword(creds);
    if (error) {
      setError(
        mode === "signin" && error.message.includes("Invalid login credentials")
          ? pick(language, "邮箱或密码不正确；如果还没有账户，请选择“注册账户”。", "Incorrect email or password. If you are new, choose Create account.")
          : pick(language, "登录遇到问题，请检查邮箱和密码后重试。", "We could not sign you in. Check your email and password, then try again.")
      );
      setBusy(false);
      return;
    }
    window.location.assign("/creator-ip");
    void router;
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-5">
      <header className="text-center">
        <h1 className="font-display text-xl font-semibold">
          {mode === "signin" ? pick(language, "登录", "Sign in") : pick(language, "注册体验账户", "Create a demo account")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {pick(language, "每个账户都有独立的内容档案、材料库和创作记录。", "Every account has its own content profile, source library, and creative history.")}
        </p>
      </header>
      <Card>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-page p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                m === mode ? "btn-primary" : "text-ink-2 hover:text-ink"
              }`}
            >
              {m === "signin" ? pick(language, "登录", "Sign in") : pick(language, "注册账户", "Create account")}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="text-sm font-medium" htmlFor="email">
            {pick(language, "邮箱", "Email")}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-hairline bg-page px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-accent"
          />
          <label className="text-sm font-medium" htmlFor="password">
            {pick(language, "密码", "Password")}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? pick(language, "至少 6 位", "At least 6 characters") : pick(language, "请输入密码", "Enter your password")}
            className="rounded-lg border border-hairline bg-page px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-muted focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-3.5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {busy
              ? pick(language, "请稍候…", "Please wait…")
              : mode === "signin"
                ? pick(language, "登录", "Sign in")
                : pick(language, "注册并填写内容档案", "Create account and build profile")}
          </button>
          {error && <p className="text-xs text-critical">{error}</p>}
        </form>
      </Card>
      <p className="text-center text-xs text-ink-muted">
        {pick(language, "AI 只负责准备初稿，所有内容都由你审核并亲自发布。", "AI prepares drafts; you review and publish every post yourself.")}
      </p>
    </div>
  );
}
