type LogContext = Record<string, unknown>;

const LOG_PREFIX = "[GameOfTag]"; // Jednotny prefix pro lepsi dohledatelnost v logu.

function formatContext(context?: LogContext) {
  if (!context) return "";
  try {
    return ` ${JSON.stringify(context)}`;
  } catch {
    return ` ${String(context)}`;
  }
}

export function logInfo(message: string, context?: LogContext) {
  console.info(`${LOG_PREFIX} ${message}${formatContext(context)}`);
}

export function logWarn(message: string, context?: LogContext) {
  console.warn(`${LOG_PREFIX} ${message}${formatContext(context)}`);
}

export function logError(message: string, context?: LogContext) {
  console.error(`${LOG_PREFIX} ${message}${formatContext(context)}`);
}
