export function parseIdLocation(code: string): number | null {
  const match = code.match(/[a-zA-Z](\d+)$/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return null;
}