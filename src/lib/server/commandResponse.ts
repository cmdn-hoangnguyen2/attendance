import type { CommandErrorCode, CommandResult } from "@/types/commands";

const errors: Record<CommandErrorCode, { status: number; message: string }> = {
  UNAUTHENTICATED: { status: 401, message: "Vui lòng đăng nhập để tiếp tục." },
  FORBIDDEN: { status: 403, message: "Bạn không có quyền thực hiện thao tác này." },
  NOT_FOUND: { status: 404, message: "Không tìm thấy dữ liệu yêu cầu." },
  CONFLICT: { status: 409, message: "Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại." },
  VALIDATION_ERROR: { status: 400, message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại." },
  ARCHIVED: { status: 403, message: "Dữ liệu đã lưu trữ không cho phép thao tác này." },
  MEETING_CLOSED: { status: 409, message: "Buổi họp đã đóng." },
  PERMISSION_CHANGED: { status: 403, message: "Quyền truy cập của bạn đã thay đổi." },
  MEMBERSHIP_INACTIVE: { status: 403, message: "Bạn không còn là thành viên đang hoạt động." },
  INTERNAL_ERROR: { status: 500, message: "Không thể thực hiện thao tác. Vui lòng thử lại sau." },
};

// Only approved UI copy can cross this boundary; provider diagnostics are never field errors.
const validationMessages = new Set([
  "Tên phòng không được để trống.",
  "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fieldPattern = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

function safeFields(fields: unknown): Record<string, string> | undefined {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return;
  const entries = Object.entries(fields).filter(([key, message]) =>
    fieldPattern.test(key) && key !== "constructor" && key !== "prototype"
    && typeof message === "string" && validationMessages.has(message),
  );
  if (entries.length === 0) return;
  return Object.fromEntries(entries);
}

export class CommandError extends Error {
  readonly code: CommandErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: CommandErrorCode, fields?: unknown) {
    const safeCode = Object.hasOwn(errors, code) ? code : "INTERNAL_ERROR";
    super(errors[safeCode].message);
    this.name = "CommandError";
    this.code = safeCode;
    if (safeCode === "VALIDATION_ERROR") this.fields = safeFields(fields);
  }
}

export function commandSuccess<T>(data: T): Response {
  const result: CommandResult<T> = { success: true, data };
  return Response.json(result, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export function commandFailure(code: CommandErrorCode, fields?: unknown): Response {
  const error = new CommandError(code, fields);
  const result: CommandResult<never> = {
    success: false,
    error: { code: error.code, message: error.message },
  };
  if (error.fields) result.error.fields = error.fields;
  return Response.json(result, {
    status: errors[error.code].status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function commandErrorResponse(error: unknown): Response {
  if (error instanceof CommandError) return commandFailure(error.code, error.fields);
  return commandFailure("INTERNAL_ERROR");
}

export function requireSameOrigin(request: Request, appBaseUrl: string | undefined): void {
  let configuredUrl: URL;
  try {
    configuredUrl = new URL(appBaseUrl ?? "");
  } catch {
    throw new CommandError("INTERNAL_ERROR");
  }
  if (!["http:", "https:"].includes(configuredUrl.protocol) || configuredUrl.username || configuredUrl.password) {
    throw new CommandError("INTERNAL_ERROR");
  }
  const origin = configuredUrl.origin;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (new URL(request.url).origin !== origin || request.headers.get("origin") !== origin) {
    throw new CommandError("FORBIDDEN");
  }
  if (fetchSite && fetchSite !== "same-origin") throw new CommandError("FORBIDDEN");
}

export async function readCommandInput(request: Request): Promise<{
  payload: Record<string, unknown>; requestId: string;
}> {
  const requestId = request.headers.get("idempotency-key");
  if (!requestId || !uuidPattern.test(requestId)) throw new CommandError("VALIDATION_ERROR");
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new CommandError("VALIDATION_ERROR");
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new CommandError("VALIDATION_ERROR");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new CommandError("VALIDATION_ERROR");
  }
  return { payload: payload as Record<string, unknown>, requestId };
}
