export class ApiError extends Error {
  readonly code: string;

  constructor(message: string, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new ApiError("So'rov vaqti tugadi. Qayta urinib ko'ring.", "TIMEOUT")),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number; label?: string } = {},
): Promise<T> {
  const { retries = 2, delayMs = 400, label = "API" } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (isOffline()) {
        throw new ApiError("Internet aloqasi yo'q.", "OFFLINE");
      }
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      if (error instanceof ApiError && error.code === "OFFLINE") break;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }

  if (lastError instanceof ApiError) throw lastError;
  console.error(`[${label}]`, lastError);
  throw new ApiError("Nimadir xato ketdi. Qayta urinib ko'ring.", "UNKNOWN");
}

export async function callServerFn<T>(
  fn: () => Promise<T>,
  options?: { timeoutMs?: number; retries?: number; label?: string },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 15_000;
  return withRetry(() => withTimeout(fn(), timeoutMs), {
    retries: options?.retries ?? 1,
    label: options?.label,
  });
}
