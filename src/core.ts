// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import {
  APIConnectionError,
  APIError,
  JobCancelledError,
  JobFailedError,
  RateLimitError,
  VeedError,
  WaitTimeoutError,
  errorFromResponse,
} from "./error.js";

export const VERSION = "0.1.1";
export const DEFAULT_BASE_URL = "https://api.veed.io";
export const DEFAULT_WAIT_TIMEOUT_MS = 900_000;

/** Union kept open so a new server-side status never breaks old SDK versions. */
export type JobStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | (string & {});

/** A downloadable media file produced by a job. */
export interface File {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

/** One structured entry of a job-level failure. */
export interface JobErrorDetail {
  type: string;
  message: string;
  field?: string;
}

export interface ClientOptions {
  /** Workspace API key (vp_...). Defaults to $VEED_API_KEY. */
  apiKey?: string;
  /** Defaults to $VEED_BASE_URL or https://api.veed.io. */
  baseURL?: string;
  timeoutMs?: number;
  /** Retries on 408/429/5xx; safe for submits because a rejected submit never creates a job. */
  maxRetries?: number;
  fetch?: typeof fetch;
  /** Client-wide default for X-Veed-Store-IO; per-call RequestOptions override it. */
  storeIO?: boolean;
  /** Client-wide default for X-Veed-Media-Expiration-Seconds; per-call RequestOptions override it. */
  mediaExpirationSeconds?: number;
}

export interface RequestOptions {
  /** false: do not store request/response bodies in your VEED request logs. */
  storeIO?: boolean;
  /** Seconds before returned signed media URLs expire (API default: 86400). */
  mediaExpirationSeconds?: number;
}

export interface WaitOptions extends RequestOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoff(attempt: number): number {
  return Math.random() * Math.min(500 * 2 ** attempt, 8000);
}

function retryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export class Transport {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;
  private readonly defaultStoreIO?: boolean;
  private readonly defaultMediaExpirationSeconds?: number;

  constructor(options: ClientOptions) {
    const apiKey = options.apiKey ?? process.env["VEED_API_KEY"];
    if (!apiKey) {
      throw new VeedError(
        "veed: missing API key: pass { apiKey } or set VEED_API_KEY (create keys in your VEED workspace)",
      );
    }
    this.apiKey = apiKey;
    this.baseURL = (options.baseURL ?? process.env["VEED_BASE_URL"] ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 60_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.fetchFn = options.fetch ?? fetch;
    this.defaultStoreIO = options.storeIO;
    this.defaultMediaExpirationSeconds = options.mediaExpirationSeconds;
  }

  private headers(hasBody: boolean, options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "User-Agent": `veed-sdk-typescript/${VERSION}`,
    };
    if (hasBody) headers["Content-Type"] = "application/json";
    const storeIO = options?.storeIO ?? this.defaultStoreIO;
    const mediaExpiration = options?.mediaExpirationSeconds ?? this.defaultMediaExpirationSeconds;
    if (storeIO !== undefined) headers["X-Veed-Store-IO"] = storeIO ? "1" : "0";
    if (mediaExpiration !== undefined) {
      headers["X-Veed-Media-Expiration-Seconds"] = String(mediaExpiration);
    }
    return headers;
  }

  async request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await this.fetchFn(this.baseURL + path, {
          method,
          headers: this.headers(body !== undefined, options),
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err) {
        if (attempt < this.maxRetries) {
          await sleep(backoff(attempt));
          continue;
        }
        throw new APIConnectionError(`veed: request failed: ${err}`);
      }
      if (res.ok) {
        const payload = (await res.json()) as { data?: T };
        if (payload?.data === undefined) {
          throw new APIError({
            status: res.status,
            code: "",
            message: "response is missing the data envelope",
            requestID: res.headers.get("x-request-id") ?? "",
          });
        }
        return payload.data;
      }
      const err = await errorFromResponse(res);
      if (retryable(res.status) && attempt < this.maxRetries) {
        await sleep(err.retryAfter > 0 ? err.retryAfter * 1000 : backoff(attempt));
        continue;
      }
      throw err;
    }
  }
}

interface JobLike {
  job_id: string;
  status: JobStatus;
  error?: { code: string; message: string; details?: JobErrorDetail[] | null } | null;
}

export async function waitForJob<J extends JobLike>(
  get: () => Promise<J>,
  jobID: string,
  defaultPollIntervalMs: number,
  options?: WaitOptions,
): Promise<J> {
  const pollMs = options?.pollIntervalMs ?? defaultPollIntervalMs;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const deadline = Date.now() + timeoutMs;
  let last: J | undefined;
  for (;;) {
    let sleepMs = pollMs;
    try {
      const job = await get();
      last = job;
      if (job.status === "COMPLETED") return job;
      if (job.status === "FAILED") {
        throw new JobFailedError({
          jobID,
          code: job.error?.code ?? "",
          message: job.error?.message ?? "",
          details: job.error?.details,
          job,
        });
      }
      if (job.status === "CANCELLED") throw new JobCancelledError(jobID, job);
    } catch (err) {
      // The job keeps rendering server-side, so a rate-limited poll is not
      // fatal to the wait.
      if (!(err instanceof RateLimitError)) throw err;
      if (err.retryAfter > 0) sleepMs = err.retryAfter * 1000;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new WaitTimeoutError(jobID, timeoutMs, last);
    // Or a poll answered with Retry-After decides the wait's real length.
    await sleep(Math.min(sleepMs, remaining));
  }
}
