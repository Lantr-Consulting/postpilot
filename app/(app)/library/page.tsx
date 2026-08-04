"use client";

import { useState } from "react";
import { addMaterial, ingestMaterial, pollRun, repurposeMaterial } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { ATOMS, MATERIALS } from "@/lib/mock";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { AtomBadge, Card, SectionHeading } from "@/components/ui";

const KIND_LABEL: Record<string, string> = {
  transcript: "访谈记录",
  notes: "笔记",
  post: "往期内容",
  newsletter: "邮件通讯",
  other: "其他材料",
};

export default function LibraryPage() {
  const toast = useToast();
  const { ws, live, refresh } = useWorkspace();

  const materials = live && ws ? ws.materials : MATERIALS;
  const allAtoms = live && ws ? ws.atoms : ATOMS;

  const [query, setQuery] = useState("");
  const [pasting, setPasting] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("notes");
  const [text, setText] = useState("");
  const [mining, setMining] = useState(false);
  const [repurposing, setRepurposing] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const atoms = q
    ? allAtoms.filter(
        (a) =>
          a.text.toLowerCase().includes(q) ||
          a.pillars.some((p) => p.toLowerCase().includes(q)) ||
          a.kind.includes(q)
      )
    : allAtoms;

  async function saveMaterial() {
    if (!text.trim()) return;
    if (!live) {
      setPasting(false);
      toast("info", "登录后可以建立自己的材料库；当前显示的是演示数据。");
      return;
    }
    setMining(true);
    try {
      const mat = await addMaterial({
        title: title.trim() || "未命名材料",
        kind,
        text,
      });
      await refresh(); // material appears as "uploaded" right away
      const run = await ingestMaterial(mat.id); // async: poll to completion
      const done = await pollRun(run.id, () => refresh());
      await refresh();
      if (done.status === "done") {
        toast("success", done.report ?? "材料整理完成。" );
        setPasting(false);
        setTitle("");
        setText("");
      } else {
        toast("error", done.report ?? "材料整理失败，请重试。" );
      }
    } catch (e) {
      toast(
        "error",
        e instanceof Error && e.message.length > 3 ? e.message : "材料整理失败，请重试。"
      );
    }
    setMining(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="材料库"
        sub="把访谈、笔记和旧内容放进来，产品会整理出可以引用的经历、观点和数据。每篇初稿都会标明用了哪些原始材料。"
      />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Materials rail */}
        <div className="flex flex-col gap-5">
          <Card title="添加材料">
            {pasting ? (
              <div className="flex flex-col gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="标题，例如：第 12 期播客访谈"
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
                >
                  <option value="transcript">访谈记录</option>
                  <option value="notes">笔记或随手记录</option>
                  <option value="post">往期内容</option>
                  <option value="newsletter">邮件通讯</option>
                  <option value="other">其他</option>
                </select>
                <textarea
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="粘贴原始文字…"
                  className="w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveMaterial}
                    disabled={mining || !text.trim()}
                    className="btn-primary px-3.5 py-1.5 text-xs"
                  >
                    {mining ? "正在整理…" : "保存并整理"}
                  </button>
                  <button
                    onClick={() => setPasting(false)}
                    disabled={mining}
                    className="btn-ghost px-3.5 py-1.5 text-xs"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-ink-muted">
                  支持访谈记录、演讲笔记、旧内容、邮件通讯和随手记录。产品只会从你提供的文字中提取可引用材料。
                </p>
                <button
                  onClick={() => setPasting(true)}
                  className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
                >
                  粘贴材料
                </button>
              </>
            )}
          </Card>

          <Card title="原始材料">
            {materials.length === 0 ? (
              <p className="text-xs text-ink-muted">
                这里还没有内容，请先添加第一份材料。
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {materials.map((m) => (
                  <li key={m.id} className="rounded-xl bg-surface-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold leading-snug">
                        {m.title}
                      </span>
                      {m.status === "mined" ? (
                        <span className="shrink-0 rounded-full bg-good/10 px-2 py-0.5 text-[10px] font-medium text-good">
                          {m.atomCount} 条可引用材料
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          {m.status === "ingesting" ? "正在整理…" : "已上传"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {KIND_LABEL[m.kind]} · {m.words.toLocaleString("zh-CN")} 字 ·{" "}
                      {fmtDate(m.addedAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-ink-muted">
                      {m.excerpt}
                    </p>
                    {m.status === "mined" && (
                      <button
                        onClick={async () => {
                          if (!live) {
                            toast("info", "登录后可以从自己的材料中继续整理选题。" );
                            return;
                          }
                          if (repurposing) return;
                          setRepurposing(m.id);
                          try {
                            const run = await repurposeMaterial(m.id);
                            const done = await pollRun(run.id);
                            toast(
                              done.status === "done" ? "success" : "error",
                              done.report ??
                                (done.status === "done"
                                  ? "选题已经放进内容工作台。"
                                  : "整理选题失败，请重试。")
                            );
                          } catch (e) {
                            toast(
                              "error",
                              e instanceof Error && e.message.length > 3
                                ? e.message
                                : "整理选题失败，请重试。"
                            );
                          }
                          setRepurposing(null);
                        }}
                        disabled={repurposing === m.id}
                        className="btn-ghost mt-2 px-3 py-1 text-[11px]"
                      >
                        {repurposing === m.id ? "正在整理选题…" : "从这份材料找选题"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Atoms */}
        <Card
          title={`可引用材料（${atoms.length}）`}
          action={
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索经历、观点或内容方向…"
              className="w-56 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
            />
          }
        >
          {atoms.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {q
                ? `没有找到与“${query}”相关的内容，请换一个关键词。`
                : "还没有可引用材料。添加原始文字后，整理出的经历、观点和数据会显示在这里。"}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {atoms.map((a) => (
                <li id={a.id} key={a.id} className="index-card scroll-mt-24 flex flex-col rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <AtomBadge kind={a.kind} />
                    <span className="text-[11px] text-ink-muted">
                      已使用 {a.usedCount} 次
                    </span>
                  </div>
                  <p className="font-display mt-2 flex-1 text-[15px] leading-[28px] text-ink">
                    {a.text}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-muted">
                    {a.pillars.join(" · ")}
                    {a.narrative && <> · 故事线：{a.narrative}</>}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-ink-muted">
                    来自：{a.materialTitle}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
