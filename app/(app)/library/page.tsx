"use client";

import { useState } from "react";
import { addMaterial, ingestMaterial, pollRun, repurposeMaterial } from "@/lib/api";
import { useWorkspace } from "@/lib/use-workspace";
import { ATOMS, MATERIALS } from "@/lib/mock";
import { fmtDate } from "@/lib/format";
import { useToast } from "@/components/toast";
import { AtomBadge, Card, SectionHeading } from "@/components/ui";

const KIND_LABEL: Record<string, string> = {
  transcript: "Transcript",
  notes: "Notes",
  post: "Past post",
  newsletter: "Newsletter",
  other: "Material",
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
      toast("info", "Sign in to build your own Library — this is sample data.");
      return;
    }
    setMining(true);
    try {
      const mat = await addMaterial({
        title: title.trim() || "Untitled material",
        kind,
        text,
      });
      await refresh(); // material appears as "uploaded" right away
      const run = await ingestMaterial(mat.id); // async: poll to completion
      const done = await pollRun(run.id, () => refresh());
      await refresh();
      if (done.status === "done") {
        toast("success", done.report ?? "Mined.");
        setPasting(false);
        setTitle("");
        setText("");
      } else {
        toast("error", done.report ?? "Mining failed — try again.");
      }
    } catch (e) {
      toast(
        "error",
        e instanceof Error && e.message.length > 3 ? e.message : "Mining failed — try again."
      );
    }
    setMining(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Library"
        sub="Feed it your raw materials; it mines the stories only you can tell. Drafts cite these atoms — the agent never invents your life."
      />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Materials rail */}
        <div className="flex flex-col gap-5">
          <Card title="Add material">
            {pasting ? (
              <div className="flex flex-col gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title (e.g. Podcast ep. 12 transcript)"
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="w-full rounded-lg border border-hairline bg-page px-3 py-2 text-sm text-ink"
                >
                  <option value="transcript">Transcript</option>
                  <option value="notes">Notes / brain dump</option>
                  <option value="post">Past post</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the raw text…"
                  className="w-full rounded-lg border border-hairline bg-page p-3 text-sm text-ink placeholder:text-ink-muted"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveMaterial}
                    disabled={mining || !text.trim()}
                    className="btn-primary px-3.5 py-1.5 text-xs"
                  >
                    {mining ? "Mining atoms…" : "Save & mine it"}
                  </button>
                  <button
                    onClick={() => setPasting(false)}
                    disabled={mining}
                    className="btn-ghost px-3.5 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-ink-muted">
                  Transcripts, talk notes, old posts, newsletters, brain dumps —
                  text in, atoms out.
                </p>
                <button
                  onClick={() => setPasting(true)}
                  className="btn-primary mt-3 w-full px-3.5 py-2 text-sm"
                >
                  Paste material
                </button>
              </>
            )}
          </Card>

          <Card title="Materials">
            {materials.length === 0 ? (
              <p className="text-xs text-ink-muted">
                Nothing here yet — paste your first material above.
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
                          {m.atomCount} atoms
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                          {m.status === "ingesting" ? "mining…" : "uploaded"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {KIND_LABEL[m.kind]} · {m.words.toLocaleString()} words ·{" "}
                      {fmtDate(m.addedAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[11px] italic leading-relaxed text-ink-muted">
                      {m.excerpt}
                    </p>
                    {m.status === "mined" && (
                      <button
                        onClick={async () => {
                          if (!live) {
                            toast("info", "Sign in to repurpose your own material.");
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
                                  ? "Ideas are in the Studio."
                                  : "Repurposing failed — try again.")
                            );
                          } catch (e) {
                            toast(
                              "error",
                              e instanceof Error && e.message.length > 3
                                ? e.message
                                : "Repurposing failed — try again."
                            );
                          }
                          setRepurposing(null);
                        }}
                        disabled={repurposing === m.id}
                        className="btn-ghost mt-2 px-3 py-1 text-[11px]"
                      >
                        {repurposing === m.id ? "Cutting ideas…" : "Repurpose this"}
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
          title={`Content atoms (${atoms.length})`}
          action={
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stories, takes, pillars…"
              className="w-56 rounded-full border border-hairline bg-page px-3.5 py-1.5 text-xs text-ink placeholder:text-ink-muted"
            />
          }
        >
          {atoms.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {q
                ? `Nothing matches “${query}”. Try a pillar name or a kind (story, take, lesson, quote, stat).`
                : "No atoms yet — mine a material and your reusable stories, takes, and stats land here."}
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {atoms.map((a) => (
                <li key={a.id} className="index-card flex flex-col rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <AtomBadge kind={a.kind} />
                    <span className="text-[11px] text-ink-muted">
                      used {a.usedCount}×
                    </span>
                  </div>
                  <p className="font-display mt-2 flex-1 text-[15px] leading-[28px] text-ink">
                    {a.text}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-muted">
                    {a.pillars.join(" · ")}
                    {a.narrative && <> · arc: {a.narrative}</>}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-ink-muted">
                    from {a.materialTitle}
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
