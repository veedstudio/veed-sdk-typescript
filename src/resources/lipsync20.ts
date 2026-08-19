// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

/** stable machine-readable failure codes for lipsync-2.0 jobs (kept open for forward compatibility). */
export type Lipsync20JobErrorCode =
  | "input_validation"
  | "content_moderation"
  | "invalid_file"
  | "audio_too_long"
  | "transload_failed"
  | "generation_failed"
  | "timeout"
  | (string & {});

/** Inputs for a lipsync-2.0 job. */
export interface Lipsync20Input {
  /** URL of the new audio track to lip-sync the video to. */
  audio_url: string;
  /** URL of the source video to dub. */
  video_url: string;
}

/** The resource produced by a completed lipsync-2.0 job. */
export interface Lipsync20Video {
  /** Generated re-lip-synced video. */
  video: File;
}

/** Why a lipsync-2.0 job FAILED. */
export interface Lipsync20JobError {
  code: Lipsync20JobErrorCode;
  message: string;
  details?: JobErrorDetail[] | null;
}

/** The job envelope for the lipsync-2.0 model. */
export interface Lipsync20Job {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: Lipsync20Video | null;
  /** Present once the job has FAILED. */
  error?: Lipsync20JobError | null;
}

/** Access to the lipsync-2.0 model. */
export class Lipsync20 {
  constructor(private readonly transport: Transport) {}

  /** Submit a lipsync-2.0 job; returns immediately with status PROCESSING. */
  submit(input: Lipsync20Input, options?: RequestOptions): Promise<Lipsync20Job> {
    return this.transport.request("POST", "/v1/lipsync-2.0", input, options);
  }

  /** Return one snapshot of a lipsync-2.0 job. */
  get(jobID: string, options?: RequestOptions): Promise<Lipsync20Job> {
    return this.transport.request("GET", "/v1/lipsync-2.0/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<Lipsync20Job> {
    return waitForJob(() => this.get(jobID, options), jobID, 10 * 1000, options);
  }

  /** Submit a lipsync-2.0 job and wait for the finished result. */
  async generate(input: Lipsync20Input, options?: WaitOptions): Promise<Lipsync20Job> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
