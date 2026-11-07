export type PollKind = "short" | "long" | "choice";

export type PollQuestion = {
  id: string;
  kind: PollKind;
  prompt: string;
  options: string[];
};

export type PollReply = {
  id: string;
  name: string;
  at: string;
  answers: Record<string, string>;
};

export type LivePoll = {
  id: string;
  title: string;
  open: boolean;
  createdAt: string;
  questions: PollQuestion[];
  replies: PollReply[];
};

const KINDS = new Set<PollKind>(["short", "long", "choice"]);

function cleanId(value: unknown, fallback: string) {
  const id = String(value ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  return id || fallback;
}

export function cleanQuestion(raw: unknown, index: number): PollQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const kind = KINDS.has(row.kind as PollKind) ? (row.kind as PollKind) : "short";
  const prompt = String(row.prompt ?? "").trim().slice(0, 180);
  if (!prompt) return null;
  const options =
    kind === "choice"
      ? (Array.isArray(row.options) ? row.options : [])
          .map((item) => String(item ?? "").trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 8)
      : [];
  if (kind === "choice" && options.length < 2) return null;
  return { id: cleanId(row.id, `q${index + 1}`), kind, prompt, options };
}

export function cleanPollDraft(raw: unknown, previous?: LivePoll): LivePoll | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = String(row.title ?? "").trim().slice(0, 120);
  if (!title) return null;
  const questions = (Array.isArray(row.questions) ? row.questions : [])
    .map((item, index) => cleanQuestion(item, index))
    .filter((item): item is PollQuestion => Boolean(item))
    .slice(0, 12);
  if (!questions.length) return null;
  const seen = new Set<string>();
  for (const question of questions) {
    let id = question.id;
    let n = 2;
    while (seen.has(id)) {
      id = `${question.id}${n}`;
      n += 1;
    }
    question.id = id;
    seen.add(id);
  }
  const id = cleanId(row.id, previous?.id || `poll${Date.now().toString(36)}`);
  return {
    id,
    title,
    open: row.open !== false,
    createdAt: previous?.createdAt || new Date().toISOString(),
    questions,
    replies: previous?.replies ?? [],
  };
}

export function cleanReply(raw: unknown, questions: PollQuestion[]): PollReply | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const bag = row.answers && typeof row.answers === "object" ? (row.answers as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  for (const question of questions) {
    const value = String(bag[question.id] ?? "").trim();
    if (!value) continue;
    if (question.kind === "choice") {
      const pick = Number(value);
      if (!Number.isInteger(pick) || pick < 0 || pick >= question.options.length) continue;
      answers[question.id] = String(pick);
    } else {
      answers[question.id] = value.slice(0, question.kind === "long" ? 600 : 160);
    }
  }
  if (!Object.keys(answers).length) return null;
  const name = String(row.name ?? "").trim().slice(0, 60) || "Volunteer";
  return {
    id: cleanId(row.id, ""),
    name,
    at: new Date().toISOString(),
    answers,
  };
}

export function parsePollBoard(raw: unknown): LivePoll[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const polls: LivePoll[] = [];
    for (const item of parsed) {
      const draft = cleanPollDraft(item);
      if (!draft) continue;
      const replies = Array.isArray((item as { replies?: unknown }).replies) ? (item as { replies: unknown[] }).replies : [];
      const kept: PollReply[] = [];
      for (const reply of replies) {
        const clean = cleanReply(reply, draft.questions);
        if (!clean?.id) continue;
        const at = String((reply as { at?: unknown }).at ?? "");
        kept.push({ ...clean, at: /^\d{4}-\d{2}-\d{2}T/.test(at) ? at : clean.at });
      }
      polls.push({ ...draft, replies: kept.slice(-250) });
    }
    return polls.slice(0, 20);
  } catch {
    return [];
  }
}

export function upsertPoll(polls: LivePoll[], raw: unknown) {
  const id = raw && typeof raw === "object" ? cleanId((raw as { id?: unknown }).id, "") : "";
  const previous = id ? polls.find((poll) => poll.id === id) : undefined;
  const next = cleanPollDraft(raw, previous);
  if (!next) return { polls, error: "Write a title and at least one question." };
  const rest = polls.filter((poll) => poll.id !== next.id);
  return { polls: [next, ...rest].slice(0, 20), error: "" };
}

export function recordReply(polls: LivePoll[], pollId: string, raw: unknown) {
  const poll = polls.find((item) => item.id === pollId);
  if (!poll) return { polls, error: "This poll is not open." };
  if (!poll.open) return { polls, error: "This poll is closed." };
  const reply = cleanReply(raw, poll.questions);
  if (!reply?.id) return { polls, error: "Answer at least one question." };
  const replies = [reply, ...poll.replies.filter((item) => item.id !== reply.id)].slice(0, 250);
  return {
    polls: polls.map((item) => (item.id === poll.id ? { ...item, replies } : item)),
    error: "",
  };
}

export function choiceCounts(poll: LivePoll, question: PollQuestion) {
  const counts = question.options.map(() => 0);
  for (const reply of poll.replies) {
    const pick = Number(reply.answers[question.id]);
    if (Number.isInteger(pick) && counts[pick] !== undefined) counts[pick] += 1;
  }
  return counts;
}

export function pollLink(id: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://nsp-smart-portal.vercel.app";
  return `${origin}/polls?id=${encodeURIComponent(id)}`;
}

export function pollShareText(poll: LivePoll, gu: boolean) {
  const lines = [
    `*${poll.title}*`,
    "",
    gu ? "લાઇવ મતદાન:" : "Live poll:",
    pollLink(poll.id),
    "",
    gu ? `જવાબ: ${poll.replies.length}` : `Replies: ${poll.replies.length}`,
  ];
  for (const question of poll.questions) {
    lines.push("");
    lines.push(question.prompt);
    if (question.kind === "choice") {
      const counts = choiceCounts(poll, question);
      question.options.forEach((option, index) => lines.push(`${option} — ${counts[index] ?? 0}`));
    } else {
      const count = poll.replies.filter((reply) => (reply.answers[question.id] || "").trim()).length;
      lines.push(gu ? `${count} લખાણ` : `${count} written`);
    }
  }
  lines.push("");
  lines.push(gu ? "લિંક ખોલો, જવાબ આપો અને લાઇવ પરિણામ જુઓ." : "Open the link to answer and see the live result.");
  return lines.join("\n");
}

export async function sharePoll(poll: LivePoll, gu: boolean) {
  const text = pollShareText(poll, gu);
  const url = pollLink(poll.id);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: poll.title, text, url });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    }
  }
  const href = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const opened = window.open(href, "_blank", "noopener,noreferrer");
  if (!opened) window.location.assign(href);
  return "opened" as const;
}
