import type { StableNairaFailureResponse } from "./types";

export class StableNairaApiError extends Error {
  public readonly status: number;
  public readonly code: number;
  public readonly details?: StableNairaFailureResponse;

  public constructor(params: {
    status: number;
    code: number;
    message: string;
    details?: StableNairaFailureResponse;
  }) {
    super(params.message);
    this.name = "StableNairaApiError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export class StableNairaNetworkError extends Error {
  public readonly cause?: unknown;

  public constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StableNairaNetworkError";
    this.cause = cause;
  }
}
