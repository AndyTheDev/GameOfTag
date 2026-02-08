import { EventEmitter } from "events";

type LogUpdate = {
  type: "log_update";
  timestamp: number;
};

const globalEmitter = globalThis as typeof globalThis & {
  __logEmitter?: EventEmitter;
};

const logEmitter = globalEmitter.__logEmitter ?? new EventEmitter(); // Sdileni emitteru pro SSE napric instancemi.
globalEmitter.__logEmitter = logEmitter;

export function emitLogUpdate() {
  const payload: LogUpdate = { type: "log_update", timestamp: Date.now() };
  logEmitter.emit("log_update", payload);
}

export function onLogUpdate(listener: (payload: LogUpdate) => void) {
  logEmitter.on("log_update", listener);
  return () => logEmitter.off("log_update", listener);
}
