// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

/** stable machine-readable failure codes for dubbing jobs (kept open for forward compatibility). */
export type DubbingJobErrorCode =
  | "input_validation"
  | "content_moderation"
  | "invalid_file"
  | "audio_too_long"
  | "transload_failed"
  | "generation_failed"
  | "timeout"
  | "insufficient_credits"
  | (string & {});

/** Inputs for a dubbing job. */
export interface DubbingInput {
  /** Language spoken in the video, as a BCP 47 tag. Omit it, or send auto, to detect it. */
  source_language?: string;
  /** Language to dub into, as a BCP 47 tag. */
  target_language: string;
  /** URL of the video to dub, up to 10 minutes. */
  video_url: string;
}

/** The resource produced by a completed dubbing job. */
export interface Dubbing {
  /** The input video with its speech dubbed into the target language and the speakers' lips synced to it. */
  video: File;
}

/** Why a dubbing job FAILED. */
export interface DubbingJobError {
  code: DubbingJobErrorCode;
  message: string;
  details?: JobErrorDetail[] | null;
}

/** The job envelope for the dubbing model. */
export interface DubbingJob {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: Dubbing | null;
  /** Present once the job has FAILED. */
  error?: DubbingJobError | null;
}

/** Access to the dubbing model. */
export class Dubbing {
  constructor(private readonly transport: Transport) {}

  /** Submit a dubbing job; returns immediately with status PROCESSING. */
  submit(input: DubbingInput, options?: RequestOptions): Promise<DubbingJob> {
    return this.transport.request("POST", "/v1/dubbing", input, options);
  }

  /** Return one snapshot of a dubbing job. */
  get(jobID: string, options?: RequestOptions): Promise<DubbingJob> {
    return this.transport.request("GET", "/v1/dubbing/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<DubbingJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 15 * 1000, options);
  }

  /** Submit a dubbing job and wait for the finished result. */
  async generate(input: DubbingInput, options?: WaitOptions): Promise<DubbingJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
