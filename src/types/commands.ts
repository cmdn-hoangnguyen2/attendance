export type CommandErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "ARCHIVED"
  | "MEETING_CLOSED"
  | "PERMISSION_CHANGED"
  | "MEMBERSHIP_INACTIVE"
  | "INTERNAL_ERROR";

export type CommandResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: CommandErrorCode;
        message: string;
        fields?: Record<string, string>;
      };
    };
