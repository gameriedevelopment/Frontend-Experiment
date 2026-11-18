import axios from "axios";

// Server text that names routes, code or database internals is never shown to players.
const TECHNICAL = [
  /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i,
  /\/api\/v\d/i,
  /internal server error/i,
  /\w+(Exception|Error):/,
  /\b(QueryFailedError|EntityNotFound|TypeError|ReferenceError|SyntaxError|ECONN\w*|ETIMEDOUT)\b/,
  /\b(relation|column|constraint|violates|duplicate key|syntax error at|null value in)\b/i,
  /\bproperty [\w.]+ should not exist\b/i,
  /\b\w+\.\w+(\.\d+)?(\.\w+)? must\b/,
  /\(uuid is expected\)|must be a UUID/i,
  /request failed with status code/i,
  /timeout of \d+ms exceeded/i,
  /^network error$/i,
];

export function isTechnicalMessage(message: string) {
  return TECHNICAL.some((pattern) => pattern.test(message));
}

function serverMessage(error: unknown): string | null {
  const candidate = error as { response?: { data?: { message?: unknown } }; message?: unknown };
  const message = candidate.response?.data?.message ?? candidate.message;
  const text = Array.isArray(message)
    ? message.filter((item) => typeof item === "string").join(", ")
    : message && typeof message === "object"
      ? (message as { message?: unknown }).message
      : message;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  // Empty states pass `query.error`, which is null when the request worked but found nothing.
  if (error == null) return fallback;
  if (axios.isAxiosError(error)) {
    if (!error.response && !axios.isCancel(error)) return "We couldn't reach Gamerie. Check your connection and try again.";
    const status = error.response?.status ?? 0;
    if (status === 429) return "Too many attempts. Wait a minute and try again.";
    if (status >= 500) return fallback;
  }
  const message = serverMessage(error);
  return message && !isTechnicalMessage(message) ? message : fallback;
}
