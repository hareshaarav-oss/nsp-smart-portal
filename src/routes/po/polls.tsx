import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PollBoard } from "@/components/nss/poll-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pollShareText, type LivePoll, type PollKind, type PollQuestion } from "@/lib/nss/polls";
import { useSessionStore } from "@/lib/nss/session";
import { useUi } from "@/lib/nss/ui-prefs";
import { openWhatsApp } from "@/lib/nss/whatsapp";

export const Route = createFileRoute("/po/polls")({ component: PoPolls });

type DraftQuestion = PollQuestion;

function blankQuestion(kind: PollKind = "choice"): DraftQuestion {
  return {
    id: `q${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
    kind,
    prompt: "",
    options: kind === "choice" ? ["", ""] : [],
  };
}

async function loadPolls() {
  const res = await fetch("/api/nss-cloud?polls=1");
  const data = (await res.json()) as { ok?: boolean; polls?: LivePoll[] };
  return Array.isArray(data.polls) ? data.polls : [];
}

function PoPolls() {
  const { lang } = useUi();
  const gu = lang === "gu";
  const tr = (en: string, guText: string) => (gu ? guText : en);
  const token = useSessionStore((s) => s.session?.chatToken || "");
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [editing, setEditing] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let stop = false;
    const pull = () => {
      void loadPolls().then((rows) => {
        if (!stop) setPolls(rows);
      });
    };
    pull();
    const timer = window.setInterval(pull, 8000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  function setQuestion(id: string, patch: Partial<DraftQuestion>) {
    setQuestions((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function edit(poll: LivePoll) {
    setEditing(poll.id);
    setTitle(poll.title);
    setQuestions(poll.questions.map((question) => ({ ...question, options: [...question.options] })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditing("");
    setTitle("");
    setQuestions([blankQuestion()]);
  }

  async function save() {
    if (!token) {
      setNote(tr("Sign out and sign in again on the officer desk, then save.", "ડેસ્કમાંથી બહાર નીકળી ફરી પ્રવેશ કરો, પછી સાચવો."));
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/nss-cloud", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-poll",
          chatToken: token,
          poll: {
            id: editing,
            title,
            open: true,
            questions: questions.map((question) => ({
              ...question,
              options: question.kind === "choice" ? question.options.map((option) => option.trim()).filter(Boolean) : [],
            })),
          },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; polls?: LivePoll[] };
      if (!res.ok || !data.ok) {
        const message = res.status === 403
          ? tr("Sign out and sign in again on the officer desk, then save.", "ડેસ્કમાંથી બહાર નીકળી ફરી પ્રવેશ કરો, પછી સાચવો.")
          : data.error || tr("Could not save the poll.", "મતદાન સાચવાયું નહીં.");
        setNote(message);
        toast.error(message);
        return;
      }
      setPolls(data.polls ?? []);
      resetForm();
      setNote(tr("Saved. The poll is live.", "સાચવાઈ ગયું. મતદાન લાઇવ છે."));
      toast.success(tr("Poll is live.", "મતદાન લાઇવ થઈ ગયું."));
    } finally {
      setBusy(false);
    }
  }

  async function change(action: "save-poll" | "delete-poll", poll: LivePoll, open = poll.open) {
    if (!token) return;
    const res = await fetch("/api/nss-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        chatToken: token,
        pollId: poll.id,
        poll: action === "save-poll" ? { ...poll, open } : undefined,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; polls?: LivePoll[] };
    if (!data.ok) {
      toast.error(data.error || tr("Could not update the poll.", "મતદાન બદલાયું નહીં."));
      return;
    }
    setPolls(data.polls ?? []);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-navy">{tr("Live poll", "લાઇવ મતદાન")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {tr(
            "Write your own questions. Use a short answer, a long answer, or choices. WhatsApp opens the live page; it does not post by itself.",
            "પ્રશ્ન તમે જ લખો. ટૂંકો જવાબ, લાંબો જવાબ અથવા વિકલ્પો. વોટ્સએપ લાઇવ પાનું ખોલે છે, પોતે પોસ્ટ નથી કરતું.",
          )}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-1.5">
            <Label>{tr("Poll title", "મતદાનનું નામ")}</Label>
            <Input className="gu" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tr("Example: Special camp feedback", "ઉદાહરણ: વિશેષ શિબિર અંગે અભિપ્રાય")} />
          </div>
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-2 border border-saffron/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{tr("Question", "પ્રશ્ન")} {index + 1}</p>
                <button type="button" className="text-xs text-muted-foreground" onClick={() => setQuestions((rows) => rows.filter((row) => row.id !== question.id))}>
                  {tr("Remove", "કાઢો")}
                </button>
              </div>
              <select
                className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
                value={question.kind}
                onChange={(e) => {
                  const kind = e.target.value as PollKind;
                  setQuestion(question.id, { kind, options: kind === "choice" ? question.options.length >= 2 ? question.options : ["", ""] : [] });
                }}
              >
                <option value="choice">{tr("Multiple choice", "વિકલ્પો")}</option>
                <option value="short">{tr("Short answer", "ટૂંકો જવાબ")}</option>
                <option value="long">{tr("Long answer", "લાંબો જવાબ")}</option>
              </select>
              <Textarea className="gu min-h-16" value={question.prompt} onChange={(e) => setQuestion(question.id, { prompt: e.target.value })} placeholder={tr("Write the question", "પ્રશ્ન લખો")} />
              {question.kind === "choice" ? (
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <Input
                      key={`${question.id}-o-${optionIndex}`}
                      className="gu"
                      value={option}
                      placeholder={`${tr("Option", "વિકલ્પ")} ${optionIndex + 1}`}
                      onChange={(e) => {
                        const options = [...question.options];
                        options[optionIndex] = e.target.value;
                        setQuestion(question.id, { options });
                      }}
                    />
                  ))}
                  {question.options.length < 8 ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setQuestion(question.id, { options: [...question.options, ""] })}>
                      <Plus className="size-4" />
                      {tr("Add option", "વિકલ્પ ઉમેરો")}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {questions.length < 12 ? (
            <Button type="button" variant="outline" onClick={() => setQuestions((rows) => [...rows, blankQuestion()])}>
              <Plus className="size-4" />
              {tr("Add question", "પ્રશ્ન ઉમેરો")}
            </Button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void save()}>
              {editing ? tr("Update poll", "મતદાન સુધારો") : tr("Start live poll", "લાઇવ મતદાન શરૂ કરો")}
            </Button>
            {editing ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                {tr("Cancel", "રદ")}
              </Button>
            ) : null}
          </div>
          {note ? <p className="text-sm text-navy">{note}</p> : null}
        </CardContent>
      </Card>

      {polls.map((poll) => (
        <Card key={poll.id}>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg text-navy">{poll.title}</p>
                <p className="text-xs text-muted-foreground">{poll.open ? tr("Open", "ખુલ્લું") : tr("Closed", "બંધ")} · {poll.replies.length}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => openWhatsApp("", pollShareText(poll, gu))}>
                  <MessageCircle className="size-4" />
                  WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => edit(poll)}>
                  {tr("Edit", "ફેરફાર")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => void change("save-poll", poll, !poll.open)}>
                  {poll.open ? tr("Close", "બંધ કરો") : tr("Reopen", "ફરી ખોલો")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void change("delete-poll", poll)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <PollBoard poll={poll} gu={gu} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
