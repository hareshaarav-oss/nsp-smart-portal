/** Active volunteers are numbered 1, 2, 3… in A–Z order. 1–100 stay in Unit 1. */

export function alphaRank<T>(
  rows: T[],
  nameOf: (row: T) => string,
  idOf: (row: T) => string,
  active: (row: T) => boolean,
) {
  const live = rows.filter(active);
  live.sort(
    (a, b) =>
      nameOf(a).localeCompare(nameOf(b), "en", { sensitivity: "base" }) ||
      idOf(a).localeCompare(idOf(b)),
  );
  const rank = new Map<T, number>();
  live.forEach((row, index) => rank.set(row, index + 1));
  return rank;
}

export function nssId(n: number) {
  return `NSS${String(n).padStart(3, "0")}`;
}

export function unitForNumber(n: number): "Unit 1" | "Unit 2" {
  return n <= 100 ? "Unit 1" : "Unit 2";
}

export function rankForNewName(names: string[], fullName: string) {
  const mine = fullName.trim();
  let n = 1;
  for (const name of names) {
    if (name.localeCompare(mine, "en", { sensitivity: "base" }) < 0) n += 1;
  }
  return n;
}
