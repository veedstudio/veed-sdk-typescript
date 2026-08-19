// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

/** setTimeout clamps a delay above 2^31-1 ms to 1 ms, so an unclamped
 * Retry-After turns the backoff into a hot loop. */
export const MAX_RETRY_AFTER_SECONDS = 60;

export class VeedError extends Error {}

export class APIConnectionError extends VeedError {}

export interface ErrorDetail {
  type: string;
  field?: string;
  message?: string;
  reason?: string;
  retry_after_ms?: number;
  value?: unknown;
}

/**
 * HTTP-layer error: the request itself was rejected. For submits this means
 * no job was created (per the API contract).
 */
export class APIError extends VeedError {
  readonly status: number;
  readonly code: string;
  /** Correlation id for VEED's logs; include it in support requests. */
  readonly requestID: string;
  readonly details: ErrorDetail[];
  /** Seconds to wait, from the Retry-After header on rate-limited responses. */
  readonly retryAfter: number;

  constructor(args: {
    status: number;
    code: string;
    message: string;
    requestID: string;
    details?: ErrorDetail[] | null;
    retryAfter?: number;
  }) {
    super(`veed: ${args.status} ${args.code}: ${args.message} (request_id: ${args.requestID})`);
    this.status = args.status;
    this.code = args.code;
    this.requestID = args.requestID;
    this.details = args.details ?? [];
    this.retryAfter = args.retryAfter ?? 0;
  }
}

export class InvalidRequestError extends APIError {}
export class AuthenticationError extends APIError {}
export class PermissionDeniedError extends APIError {}
export class NotFoundError extends APIError {}
export class RateLimitError extends APIError {}
export class InternalServerError extends APIError {}

const STATUS_MAP: Record<number, typeof APIError> = {
  400: InvalidRequestError,
  401: AuthenticationError,
  403: PermissionDeniedError,
  404: NotFoundError,
  422: InvalidRequestError,
  429: RateLimitError,
};

export async function errorFromResponse(res: Response): Promise<APIError> {
  const cls = STATUS_MAP[res.status] ?? (res.status >= 500 ? InternalServerError : APIError);
  let code = "";
  let message = "";
  let details: ErrorDetail[] | null = null;
  let requestID = res.headers.get("x-request-id") ?? "";
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string; request_id?: string; details?: ErrorDetail[] | null };
    };
    code = body.error?.code ?? "";
    message = body.error?.message ?? "";
    details = body.error?.details ?? null;
    requestID = body.error?.request_id ?? requestID;
  } catch {
    message = res.statusText;
  }
  const ra = res.headers.get("retry-after");
  const retryAfter = ra && /^\d+$/.test(ra) ? Math.min(Number(ra), MAX_RETRY_AFTER_SECONDS) : 0;
  return new cls({ status: res.status, code, message, requestID, details, retryAfter });
}

/**
 * Job-layer failure: the job was accepted, but rendering failed. Thrown by
 * wait/generate, not as an HTTP error. `code` holds the model-specific
 * failure code and `job` the final job object.
 */
export class JobFailedError extends VeedError {
  readonly jobID: string;
  readonly code: string;
  readonly details: unknown;
  readonly job: unknown;

  constructor(args: { jobID: string; code: string; message: string; details?: unknown; job?: unknown }) {
    super(`veed: job ${args.jobID} failed (${args.code}): ${args.message}`);
    this.jobID = args.jobID;
    this.code = args.code;
    this.details = args.details;
    this.job = args.job;
  }
}

export class JobCancelledError extends VeedError {
  constructor(
    readonly jobID: string,
    readonly job?: unknown,
  ) {
    super(`veed: job ${jobID} was cancelled`);
  }
}

/**
 * wait/generate gave up before the job reached a terminal state. The job may
 * still finish server-side; resume with wait(jobID).
 */
export class WaitTimeoutError extends VeedError {
  constructor(
    readonly jobID: string,
    readonly timeoutMs: number,
    readonly job?: unknown,
  ) {
    super(
      `veed: timed out after ${timeoutMs}ms waiting for job ${jobID} (the job may still finish; resume with wait)`,
    );
  }
}
