export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function unauthorized(message = "Autentifikatsiya talab qilinadi") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Ruxsat yo'q") {
  return new AppError(403, "FORBIDDEN", message);
}

export function notFound(message = "Topilmadi") {
  return new AppError(404, "NOT_FOUND", message);
}

export function validationError(message: string, details?: unknown) {
  return new AppError(422, "VALIDATION_ERROR", message, details);
}

export function conflict(message: string) {
  return new AppError(409, "CONFLICT", message);
}

export function toErrorResponse(error: unknown): { status: number; body: object } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: { error: { code: error.code, message: error.message, details: error.details } },
    };
  }
  console.error(error);
  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: "Ichki xatolik" } },
  };
}
