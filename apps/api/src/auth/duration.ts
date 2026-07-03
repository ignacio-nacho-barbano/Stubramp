// Parse a compact duration string (e.g. "15m", "30d") into milliseconds.
// Shared by the access-token cookie maxAge and the refresh-token TTL.
const DURATION_UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function durationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  const unit = match ? DURATION_UNITS[match[2]!] : undefined;
  if (!match || unit === undefined) {
    throw new Error(`Invalid duration: ${value}`);
  }
  return Number(match[1]) * unit;
}
