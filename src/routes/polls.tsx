import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/nss/shell";
import { OfficialLetterhead } from "@/components/nss/official-letterhead";
import { PollBoard } from "@/components/nss/poll-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sharePoll, type LivePoll } from "@/lib/nss/polls";
import { useSessionStore } from "@/lib/nss/session";
import { useUi } from "@/lib/nss/ui-prefs";

export const Route = createFileRoute("/polls")({ component: PollsPage });

function replyKey() {
  try {
    const saved = localStorage.getItem("nsp-poll-who") || "";
    if (/^[A-Za-z0-9_-]{6,32}$/.test(saved)) return saved;
    const next = `who${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("nsp-poll-who", next);
    return next;
  } catch {
    return `who${Date.now().toString(36)}`;
  }
}

function PollsPage() {
  const { lang } = useUi();
  const gu = lang === "gu";
  const tr = (en: string, guText: string) => (gu ? guText : en);
  const session = useSessionStore((s) => s.session);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [picked, setPicked] = useState("");
  const [name, setName] = useState(session?.name || "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || "";
    if (id) setPicked(id);
  }, []);

  useEffect(() => {
    let stop = false;
    const pull = () => {
      void fetch("/api/nss-cloud?polls=1")
        .then((res) => res.json())
        .then((data: { polls?: LivePoll[] }) => {
          if (!stop && Array.isArray(data.polls)) setPolls(data.polls);
        })
        .catch(() => undefined);
    };
    pull();
    const timer = window.setInterval(pull, 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const poll = useMemo(() => polls.find((item) => item.id === picked) || null, [polls, picked]);
  const openPolls = polls.filter((item) => item.open);

  function choose(id: string) {
    setPicked(id);
    setAnswers({});
    setNote("");
    const url = id ? `/polls?id=${encodeURIComponent(id)}` : "/polls";
    window.history.replaceState({}, "", url);
  }

  async function submit() {
    if (!poll) return;
    setBusy(true);
    setNote("");
    try {
      const who = session?.volunteerId || replyKey();
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "answer-poll",
          pollId: poll.id,
          replyId: who,
          name: session?.name || name,
          answers,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; polls?: LivePoll[] };
      if (!res.ok || !data.ok) {
        setNote(data.error || tr("The answer was not saved.", "જવાબ સાચવાયો નહીં."));
        return;
      }
      if (Array.isArray(data.polls)) setPolls(data.polls);
      setNote(tr("Your answer is in the live result.", "તમારો જવાબ લાઇવ પરિણામમાં ઉમેરાયો."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-16">
        <OfficialLetterhead title={tr("Live poll", "લાઇવ મતદાન")} compact />
        {!poll ? (
          openPolls.length ? (
            <div className="space-y-3">
              {openPolls.map((item) => (
                <button key={item.id} type="button" className="w-full border border-saffron/40 bg-card p-4 text-left" onClick={() => choose(item.id)}>
                  <p className="font-display text-lg text-navy">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.questions.length} {tr("questions", "પ્રશ્ન")} · {item.replies.length} {tr("replies", "જવાબ")}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{tr("No live poll right now.", "અત્યારે કોઈ લાઇવ મતદાન નથી.")}</p>
          )
        ) : (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <button type="button" className="text-sm text-navy underline" onClick={() => choose("")}>
                {tr("All polls", "બધા મતદાન")}
              </button>
              <h2 className="font-display text-2xl text-navy">{poll.title}</h2>
              {poll.open ? (
                <div className="space-y-4">
                  {session?.name ? null : (
                    <Input className="gu" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("Your name", "તમારું નામ")} />
                  )}
                  {poll.questions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <p className="font-medium text-navy">{question.prompt}</p>
                      {question.kind === "choice" ? (
                        <div className="space-y-2">
                          {question.options.map((option, index) => (
                            <label key={`${question.id}-${index}`} className="flex items-start gap-2 text-sm">
                              <input
                                type="radio"
                                name={question.id}
                                className="mt-1"
                                checked={answers[question.id] === String(index)}
                                onChange={() => setAnswers((current) => ({ ...current, [question.id]: String(index) }))}
                              />
                              <span className="gu break-words">{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : question.kind === "long" ? (
                        <Textarea className="gu" value={answers[question.id] || ""} onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))} />
                      ) : (
                        <Input className="gu" value={answers[question.id] || ""} onChange={(e) => setAnswers((current) => ({ ...current, [question.id]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                  <Button type="button" disabled={busy} onClick={() => void submit()}>
                    {tr("Submit answer", "જવાબ મોકલો")}
                  </Button>
                  {note ? <p className="text-sm text-navy">{note}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{tr("This poll is closed. The result stays below.", "આ મતદાન બંધ છે. પરિણામ નીચે રહેશે.")}</p>
              )}
              <PollBoard poll={poll} gu={gu} />
              <Button type="button" className="bg-[#128C7E] text-white hover:bg-[#0f766e]" onClick={() => void sharePoll(poll, gu)}>
                <MessageCircle className="size-4" />
                {tr("Share on WhatsApp", "વોટ્સએપ પર મોકલો")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {tr("WhatsApp gets the live link and the result so far. Anyone who opens it can answer and watch it change.", "વોટ્સએપમાં લાઇવ લિંક અને અત્યારનું પરિણામ જાય છે. લિંક ખોલનાર જવાબ આપી શકે અને બદલાતું જોઈ શકે.")}
              </p>
            </CardContent>
          </Card>
        )}
        <p className="text-center text-sm">
          <Link to="/" className="text-navy underline">{tr("Home", "હોમ")}</Link>
        </p>
      </div>
    </AppShell>
  );
}
