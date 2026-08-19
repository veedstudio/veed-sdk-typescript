// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

/** Output video resolution. */
export type FabricResolution = "720p" | "480p";

/** stable machine-readable failure codes for fabric-1.0 jobs (kept open for forward compatibility). */
export type FabricJobErrorCode =
  | "input_validation"
  | "content_moderation"
  | "invalid_file"
  | "audio_too_long"
  | "transload_failed"
  | "generation_failed"
  | "timeout"
  | (string & {});

/** Inputs for a fabric-1.0 job. */
export interface FabricInput {
  /** URL of the audio track to lip-sync to. */
  audio_url: string;
  /** URL of the source image to animate. */
  image_url: string;
  /** Output video resolution. */
  resolution: FabricResolution;
}

/** The resource produced by a completed fabric-1.0 job. */
export interface FabricVideo {
  /** Generated lip-synced video. */
  video: File;
}

/** Why a fabric-1.0 job FAILED. */
export interface FabricJobError {
  code: FabricJobErrorCode;
  message: string;
  details?: JobErrorDetail[] | null;
}

/** The job envelope for the fabric-1.0 model. */
export interface FabricJob {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: FabricVideo | null;
  /** Present once the job has FAILED. */
  error?: FabricJobError | null;
}

/** Access to the fabric-1.0 model. */
export class Fabric {
  constructor(private readonly transport: Transport) {}

  /** Submit a fabric-1.0 job; returns immediately with status PROCESSING. */
  submit(input: FabricInput, options?: RequestOptions): Promise<FabricJob> {
    return this.transport.request("POST", "/v1/fabric-1.0", input, options);
  }

  /** Return one snapshot of a fabric-1.0 job. */
  get(jobID: string, options?: RequestOptions): Promise<FabricJob> {
    return this.transport.request("GET", "/v1/fabric-1.0/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<FabricJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 10 * 1000, options);
  }

  /** Submit a fabric-1.0 job and wait for the finished result. */
  async generate(input: FabricInput, options?: WaitOptions): Promise<FabricJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
