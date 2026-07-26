import { randomInt } from "node:crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(): string {
  const segment = () =>
    Array.from({ length: 4 }, () => CHARS[randomInt(CHARS.length)]).join("");
  return `${segment()}-${segment()}-${segment()}`;
}
