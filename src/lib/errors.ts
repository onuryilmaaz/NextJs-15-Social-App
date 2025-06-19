// Error types for better categorization
export enum ErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  CONFLICT_ERROR = "CONFLICT_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  UPLOAD_ERROR = "UPLOAD_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  field?: string;
  statusCode: number;
}

export class AppException extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly field?: string;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    code?: string,
    field?: string,
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
    this.name = "AppException";
  }
}

// Predefined error creators
export const createError = {
  validation: (message: string, field?: string) =>
    new AppException(
      ErrorType.VALIDATION_ERROR,
      message,
      400,
      "VALIDATION_ERROR",
      field,
    ),

  authentication: (message: string = "Authentication required") =>
    new AppException(
      ErrorType.AUTHENTICATION_ERROR,
      message,
      401,
      "UNAUTHORIZED",
    ),

  authorization: (message: string = "Insufficient permissions") =>
    new AppException(ErrorType.AUTHORIZATION_ERROR, message, 403, "FORBIDDEN"),

  notFound: (resource: string = "Resource") =>
    new AppException(
      ErrorType.NOT_FOUND_ERROR,
      `${resource} not found`,
      404,
      "NOT_FOUND",
    ),

  conflict: (message: string) =>
    new AppException(ErrorType.CONFLICT_ERROR, message, 409, "CONFLICT"),

  rateLimit: (message: string = "Too many requests") =>
    new AppException(ErrorType.RATE_LIMIT_ERROR, message, 429, "RATE_LIMIT"),

  upload: (message: string) =>
    new AppException(ErrorType.UPLOAD_ERROR, message, 400, "UPLOAD_ERROR"),

  database: (message: string = "Database operation failed") =>
    new AppException(ErrorType.DATABASE_ERROR, message, 500, "DATABASE_ERROR"),

  network: (message: string = "Network request failed") =>
    new AppException(ErrorType.NETWORK_ERROR, message, 503, "NETWORK_ERROR"),

  unknown: (message: string = "An unexpected error occurred") =>
    new AppException(ErrorType.UNKNOWN_ERROR, message, 500, "UNKNOWN_ERROR"),
};

// Error response handler for API routes
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof AppException) {
    return Response.json(
      {
        error: error.message,
        type: error.type,
        code: error.code,
        field: error.field,
      },
      { status: error.statusCode },
    );
  }

  // Handle Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002": // Unique constraint violation
        const field = prismaError.meta?.target?.[0] || "field";
        return Response.json(
          {
            error: `This ${field} is already taken`,
            type: ErrorType.CONFLICT_ERROR,
            code: "DUPLICATE_VALUE",
            field,
          },
          { status: 409 },
        );

      case "P2025": // Record not found
        return Response.json(
          {
            error: "The requested resource was not found",
            type: ErrorType.NOT_FOUND_ERROR,
            code: "NOT_FOUND",
          },
          { status: 404 },
        );

      case "P2003": // Foreign key constraint violation
        return Response.json(
          {
            error: "Related resource not found",
            type: ErrorType.VALIDATION_ERROR,
            code: "INVALID_REFERENCE",
          },
          { status: 400 },
        );

      default:
        return Response.json(
          {
            error: "Database operation failed",
            type: ErrorType.DATABASE_ERROR,
            code: "DATABASE_ERROR",
          },
          { status: 500 },
        );
    }
  }

  // Handle validation errors (Zod)
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as any;
    const firstIssue = zodError.issues?.[0];

    return Response.json(
      {
        error: firstIssue?.message || "Validation failed",
        type: ErrorType.VALIDATION_ERROR,
        code: "VALIDATION_ERROR",
        field: firstIssue?.path?.join("."),
      },
      { status: 400 },
    );
  }

  // Default error
  return Response.json(
    {
      error: "An unexpected error occurred",
      type: ErrorType.UNKNOWN_ERROR,
      code: "UNKNOWN_ERROR",
    },
    { status: 500 },
  );
}

// Client-side error message mapper
export function getErrorMessage(error: any): string {
  if (error?.type) {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return error.message || "Please check your input and try again";
      case ErrorType.AUTHENTICATION_ERROR:
        return "Please log in to continue";
      case ErrorType.AUTHORIZATION_ERROR:
        return "You don't have permission to perform this action";
      case ErrorType.NOT_FOUND_ERROR:
        return error.message || "The requested item was not found";
      case ErrorType.CONFLICT_ERROR:
        return error.message || "This action conflicts with existing data";
      case ErrorType.RATE_LIMIT_ERROR:
        return "Too many requests. Please wait a moment and try again";
      case ErrorType.UPLOAD_ERROR:
        return error.message || "Failed to upload file. Please try again";
      case ErrorType.DATABASE_ERROR:
        return "A database error occurred. Please try again";
      case ErrorType.NETWORK_ERROR:
        return "Network error. Please check your connection and try again";
      default:
        return error.message || "Something went wrong. Please try again";
    }
  }

  // Handle HTTP status codes
  if (error?.status || error?.response?.status) {
    const status = error.status || error.response.status;
    switch (status) {
      case 400:
        return "Invalid request. Please check your input";
      case 401:
        return "Please log in to continue";
      case 403:
        return "You don't have permission to perform this action";
      case 404:
        return "The requested item was not found";
      case 409:
        return "This action conflicts with existing data";
      case 429:
        return "Too many requests. Please wait a moment and try again";
      case 500:
        return "Server error. Please try again later";
      case 503:
        return "Service temporarily unavailable. Please try again later";
      default:
        return "Something went wrong. Please try again";
    }
  }

  return error?.message || "Something went wrong. Please try again";
}
