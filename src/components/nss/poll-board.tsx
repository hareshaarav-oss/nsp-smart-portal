import { choiceCounts, type LivePoll } from "@/lib/nss/polls";

export function PollBoard({ poll, gu }: { poll: LivePoll; gu: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-saffron">
        {gu ? "લાઇવ પરિણામ" : "Live result"} · {poll.replies.length}
      </p>
      {poll.questions.map((question) => {
        if (question.kind === "choice") {
          const counts = choiceCounts(poll, question);
          const total = counts.reduce((sum, count) => sum + count, 0) || 1;
          return (
            <div key={question.id}>
              <p className="font-medium text-navy">{question.prompt}</p>
              <div className="mt-2 space-y-2">
                {question.options.map((option, index) => {
                  const count = counts[index] ?? 0;
                  const width = Math.round((count / total) * 100);
                  return (
                    <div key={`${question.id}-${index}`}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words">{option}</span>
                        <span className="shrink-0 font-semibold text-navy">{count}</span>
                      </div>
                      <div className="h-2 bg-navy/10">
                        <div className="h-2 bg-saffron" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        const written = poll.replies
          .map((reply) => ({ name: reply.name, text: reply.answers[question.id] || "", at: reply.at }))
          .filter((reply) => reply.text)
          .slice(0, 20);
        return (
          <div key={question.id}>
            <p className="font-medium text-navy">{question.prompt}</p>
            {written.length ? (
              <ul className="mt-2 space-y-2">
                {written.map((reply, index) => (
                  <li key={`${question.id}-${reply.at}-${index}`} className="border border-saffron/30 bg-[#fff6ea] px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-saffron">{reply.name}</p>
                    <p className="gu whitespace-pre-wrap break-words text-navy">{reply.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">{gu ? "હજી કોઈ લખાણ નથી." : "No written answer yet."}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
