import { logError } from "./logger";

type ErrorContext = Record<string, unknown>;

function normalizeError(error: unknown) {
  // Zjednoduseni error objektu, aby se dal bezpečně zalogovat.
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export function handleServerError(
  fallbackMessage: string,
  error: unknown,
  context?: ErrorContext
) {
  logError(fallbackMessage, { ...context, error: normalizeError(error) });
  return { success: false, message: fallbackMessage };
}
