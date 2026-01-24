import { headers } from "next/headers";

export async function getClientKey() {
  // Kombinace IP a user-agentu nam staci pro hruby rate limit.
  const h = await headers(); // Next vraci Promise, jinak h nema get().
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = h.get("x-real-ip");
  const userAgent = h.get("user-agent") ?? "unknown";
  const ip = forwardedFor || realIp || "unknown";
  return `${ip}:${userAgent}`;
}
