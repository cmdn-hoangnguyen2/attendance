import type { CommandErrorCode, CommandResult } from "../types/commands";

const commandMessages: Record<CommandErrorCode, string> = {
  UNAUTHENTICATED: "Vui lòng đăng nhập để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
  CONFLICT: "Dữ liệu đã thay đổi. Vui lòng kiểm tra và thử lại.",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  ARCHIVED: "Dữ liệu đã được lưu trữ và không cho phép thao tác này.",
  MEETING_CLOSED: "Buổi họp đã đóng và không cho phép thao tác này.",
  PERMISSION_CHANGED: "Quyền của bạn đã thay đổi. Vui lòng tải lại trang.",
  MEMBERSHIP_INACTIVE: "Bạn không còn là thành viên hoạt động của phòng.",
  INTERNAL_ERROR: "Không thể hoàn tất thao tác. Vui lòng thử lại.",
};
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function failure(code: CommandErrorCode): Extract<CommandResult<never>, { success: false }> {
  return { success: false, error: { code, message: commandMessages[code] } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The caller owns requestId and must reuse it for an explicit retry. */
export async function postCommand<T>(
  url: string,
  body: unknown,
  requestId: string,
): Promise<CommandResult<T>> {
  if (
    typeof url !== "string"
    || !url.startsWith("/")
    || url.startsWith("//")
    || /[\\\u0000-\u0020\u007f]/.test(url)
    || typeof requestId !== "string"
    || !requestIdPattern.test(requestId)
  ) {
    return failure("VALIDATION_ERROR");
  }

  let serializedBody: string | undefined;
  try {
    serializedBody = JSON.stringify(body);
  } catch {
    return failure("VALIDATION_ERROR");
  }
  if (serializedBody === undefined) return failure("VALIDATION_ERROR");

  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
      },
      body: serializedBody,
    });
    const result: unknown = await response.json();
    if (!isRecord(result)) return failure("INTERNAL_ERROR");

    if (result.success === true) {
      if (!response.ok || !Object.hasOwn(result, "data")) return failure("INTERNAL_ERROR");
      return { success: true, data: result.data as T };
    }
    if (response.ok || result.success !== false || !isRecord(result.error)) {
      return failure("INTERNAL_ERROR");
    }

    const error = result.error;
    if (
      typeof error.code !== "string"
      || !Object.hasOwn(commandMessages, error.code)
      || typeof error.message !== "string"
      || error.message.trim().length === 0
    ) {
      return failure("INTERNAL_ERROR");
    }
    if (
      error.fields !== undefined
      && (!isRecord(error.fields) || !Object.values(error.fields).every((value) => typeof value === "string"))
    ) {
      return failure("INTERNAL_ERROR");
    }

    const code = error.code as CommandErrorCode;
    const sanitizedResult = failure(code);
    if (code !== "INTERNAL_ERROR" && isRecord(error.fields)) {
      sanitizedResult.error.fields = Object.fromEntries(Object.entries(error.fields)) as Record<string, string>;
    }
    return sanitizedResult;
  } catch {
    return failure("INTERNAL_ERROR");
  }
}
