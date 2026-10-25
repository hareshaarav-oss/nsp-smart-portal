export function SevaChakra({
  hours,
  volunteers,
  target,
  camps,
  gu,
}: {
  hours: number;
  volunteers: number;
  target: number;
  camps: number;
  gu: boolean;
}) {
  const safeTarget = Math.max(1, target);
  const average = volunteers > 0 ? hours / volunteers : 0;
  const pct = Math.max(0, Math.min(1, average / safeTarget));
  const radius = 58;
  const length = 2 * Math.PI * radius;
  const done = length * pct;
  const averageLabel = average.toFixed(1);
  return (
    <section className="mt-6 grid items-center gap-6 border border-navy/15 bg-card px-5 py-6 md:grid-cols-[220px_1fr]" aria-label={gu ? "સેવા ચક્ર" : "Seva chakra"}>
      <div className="relative mx-auto size-52">
        <svg viewBox="0 0 160 160" className="size-full" aria-hidden="true">
          <circle cx="80" cy="80" r="72" fill="none" stroke="#0b1c36" strokeWidth="1" opacity="0.2" />
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#0b1c36" strokeWidth="10" opacity="0.08" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#9a7b3c"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${done} ${length - done}`}
            transform="rotate(-90 80 80)"
          />
          <circle cx="80" cy="80" r="4" fill="#9a7b3c" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-4xl tabular-nums text-navy">{hours}</p>
          <p className="gu text-[11px] font-semibold tracking-[0.18em] text-saffron">સેવા ચક્ર</p>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-saffron">Not Me, But You</p>
        <h2 className="gu mt-1 font-display text-3xl text-navy md:text-4xl">હું નહિ પણ તમે</h2>
        <p className="gu mt-3 max-w-xl text-sm leading-relaxed text-navy/80">
          {gu
            ? `આ ચક્ર આ એકમની સેવા છે. કૉલેજ ક્લાઉડ પર ${hours} કલાક નોંધાયા છે, ${volunteers} સ્વયંસેવકો અને ${camps} કાર્યક્રમ સાથે. સોનેરી ચાપ એક સ્વયંસેવકની સરેરાશ ${averageLabel} કલાક દર્શાવે છે, વર્ષના ${safeTarget} કલાક તરફ.`
            : `This ring is this unit’s own seva. ${hours} hours are on the college cloud, across ${volunteers} volunteers and ${camps} programmes. The gold arc is one volunteer’s average, ${averageLabel} hours, toward the ${safeTarget}-hour year.`}
        </p>
      </div>
    </section>
  );
}
