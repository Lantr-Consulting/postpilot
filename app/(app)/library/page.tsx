"use client";

import { useState } from "react";
import { addMaterial, ingestMaterial, pollRun, repurposeMaterial } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { ATOMS, MATERIALS } from "@/lib/mock.localized";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { AtomBadge, Card, SectionHeading } from "@/components/ui";
import { pick, useLanguage } from "@/lib/language";

const KIND_LABEL: Record<string, { zh: string; en: string }> = {
  transcript: { zh: "访谈记录", en: "Transcript" },
  notes: { zh: "笔记", en: "Notes" },
  post: { zh: "往期内容", en: "Past post" },
  newsletter: { zh: "邮件通讯", en: "Newsletter" },
  other: { zh: "其他材料", en: "Other" },
};

export default function LibraryPage() {
  const toast = useToast();
  const language = useLanguage();
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
      toast("info", pick(language, "登录后可以建立自己的材料库；当前显示的是演示数据。", "Sign in to build your own library. This is demo data."));
      return;
    }
    setMining(true);
    try {
      const mat = await addMaterial({
        title: title.trim() || pick(language, "未命名材料", "Untitled material"),
        kind,
        text,
      });
      await refresh(); // material appears as "uploaded" right away
      const run = await ingestMaterial(mat.id); // async: poll to completion
      const done = await pollRun(run.id, () => refresh());
      await refresh();
      if (done.status === "done") {
        toast("success", done.report ?? pick(language, "材料整理完成。", "Material processed."));
        setPasting(false);
        setTitle("");
        setText("");
      } else {
        toast("error", done.report ?? pick(language, "材料整理失败，请重试。", "Processing failed. Please try again."));
      }
    } catch (e) {
      toast(
        "error",
        e instanceof Error && e.message.length > 3 ? e.message : pick(language, "材料整理失败，请重试。", "Processing failed. Please try again.")
      );
    }
    setMining(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title={pick(language, "材料库", "Library")}
        sub={pick(language, "把访谈、笔记和旧内容放进来，产品会整理出可以引用的经历、观点和数据。每篇初稿都会标明用了哪些原始材料。", "Add transcripts, notes, and past posts. PostPilot extracts citable stories, takes, and data, then shows which source each draft used.")}
      />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Materials rail */}
        <div className="flex flex-col gap-5">
          <Card title={pick(language, "添加材料", "Add material")}>
            {pasting ? (
              <div className="flex flex-col gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={pick(language, "标题，例如：第 12 期播客访谈", "Title, e.g. Podcast interview #12")}
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
                >
                  <option value="transcript">{pick(language, "访谈记录", "Transcript")}</option>
                  <option value="notes">{pick(language, "笔记或随手记录", "Notes")}</option>
                  <option value="post">{pick(language, "往期内容", "Past post")}</option>
                  <option value="newsletter">{pick(language, "邮件通讯", "Newsletter")}</option>
                  <option value="other">{pick(language, "其他", "Other")}</option>
                </select>
                <textarea
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={pick(language, "粘贴原始文字…", "Paste the original text…")}
                  className="w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveMaterial}
                    disabled={mining || !text.trim()}
                    className="btn-primary px-3.5 py-1.5 text-xs"
                  >
                    {mining ? pick(language, "正在整理…", "Processing…") : pick(language, "保存并整理", "Save and process")}
                  </button>
                  <button
                    onClick={() => setPasting(false)}
                    disabled={mining}
                    className="btn-ghost px-3.5 py-1.5 text-xs"
                  >
                    {pick(language, "取消", "Cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-ink-muted">
                  {pick(language, "支持访谈记录、演讲笔记、旧内容、邮件通讯和随手记录。产品只会从你提供的文字中提取可引用材料。", "Use transcripts, talk notes, past posts, newsletters, or rough notes. PostPilot only extracts claims from text you provide.")}
                </p>
                <button
                  onClick={() => setPasting(true)}
                  className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
                >
                  {pick(language, "粘贴材料", "Paste material")}
                </button>
              </>
            )}
          </Card>

          <Card title={pick(language, "原始材料", "Source materials")}>
            {materials.length === 0 ? (
              <p className="text-xs text-ink-muted">
                {pick(language, "这里还没有内容，请先添加第一份材料。", "Nothing here yet. Add your first source material.")}
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
                          {m.atomCount} {pick(language, "条可引用材料", "citable items")}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          {m.status === "ingesting" ? pick(language, "正在整理…", "Processing…") : pick(language, "已上传", "Uploaded")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {(KIND_LABEL[m.kind] ?? KIND_LABEL.other)[language]} · {m.words.toLocaleString(language === "zh" ? "zh-CN" : "en-US")} {pick(language, "字", "words")} ·{" "}
                      {fmtDate(m.addedAt, language)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-ink-muted">
                      {m.excerpt}
                    </p>
                    {m.status === "mined" && (
                      <button
                        onClick={async () => {
                          if (!live) {
                            toast("info", pick(language, "登录后可以从自己的材料中继续整理选题。", "Sign in to turn your own materials into ideas."));
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
                                  ? pick(language, "选题已经放进内容工作台。", "Ideas are now in the Studio.")
                                  : pick(language, "整理选题失败，请重试。", "Could not create ideas. Please try again."))
                            );
                          } catch (e) {
                            toast(
                              "error",
                              e instanceof Error && e.message.length > 3
                                ? e.message
                                : pick(language, "整理选题失败，请重试。", "Could not create ideas. Please try again.")
                            );
                          }
                          setRepurposing(null);
                        }}
                        disabled={repurposing === m.id}
                        className="btn-ghost mt-2 px-3 py-1 text-[11px]"
                      >
                        {repurposing === m.id ? pick(language, "正在整理选题…", "Finding ideas…") : pick(language, "从这份材料找选题", "Find ideas in this material")}
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
          title={`${pick(language, "可引用材料", "Citable material")} (${atoms.length})`}
          action={
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={pick(language, "搜索经历、观点或内容方向…", "Search stories, takes, or pillars…")}
              className="w-56 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
            />
          }
        >
          {atoms.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {q
                ? pick(language, `没有找到与“${query}”相关的内容，请换一个关键词。`, `Nothing matched “${query}”. Try another term.`)
                : pick(language, "还没有可引用材料。添加原始文字后，整理出的经历、观点和数据会显示在这里。", "No citable items yet. Add source text and extracted stories, takes, and data will appear here.")}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {atoms.map((a) => (
                <li id={a.id} key={a.id} className="index-card scroll-mt-24 flex flex-col rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <AtomBadge kind={a.kind} />
                    <span className="text-[11px] text-ink-muted">
                      {pick(language, `已使用 ${a.usedCount} 次`, `Used ${a.usedCount} times`)}
                    </span>
                  </div>
                  <p className="font-display mt-2 flex-1 text-[15px] leading-[28px] text-ink">
                    {a.text}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-muted">
                    {a.pillars.join(" · ")}
                    {a.narrative && <> · {pick(language, "故事线：", "Arc: ")}{a.narrative}</>}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-ink-muted">
                    {pick(language, "来自：", "From: ")}{a.materialTitle}
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
