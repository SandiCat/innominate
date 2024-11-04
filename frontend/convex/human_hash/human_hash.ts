import { adjectives, nouns } from "./words";

export function humanReadableID(): string {
  const adjective = choice(adjectives);
  const noun = choice(nouns);
  return `${adjective}-${noun}`;
}

function choice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
