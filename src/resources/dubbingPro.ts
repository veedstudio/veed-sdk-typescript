// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

import type { DubbingJob } from "./dubbing.js";

/** Inputs for a dubbing-pro job. */
export interface DubbingProInput {
  /** Language spoken in the video, as a BCP 47 tag. Omit it, or send auto, to detect it. */
  source_language?: string;
  /** Language to dub into, as a BCP 47 tag. */
  target_language: string;
  /** URL of the video to dub, up to 10 minutes. */
  video_url: string;
  /** How closely the dubbed voices match the speakers. Higher keeps more of each speaker's voice and accent; lower sounds more natural in the target language. */
  voice_cloning_strength?: number;
}

/** Access to the dubbing-pro model. */
export class DubbingPro {
  constructor(private readonly transport: Transport) {}

  /** Submit a dubbing-pro job; returns immediately with status PROCESSING. */
  submit(input: DubbingProInput, options?: RequestOptions): Promise<DubbingJob> {
    return this.transport.request("POST", "/v1/dubbing-pro", input, options);
  }

  /** Return one snapshot of a dubbing-pro job. */
  get(jobID: string, options?: RequestOptions): Promise<DubbingJob> {
    return this.transport.request("GET", "/v1/dubbing-pro/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<DubbingJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 15 * 1000, options);
  }

  /** Submit a dubbing-pro job and wait for the finished result. */
  async generate(input: DubbingProInput, options?: WaitOptions): Promise<DubbingJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
