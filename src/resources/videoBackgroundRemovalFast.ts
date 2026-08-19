// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

import type { VideoBackgroundRemovalInput } from "./videoBackgroundRemoval.js";
import type { VideoBackgroundRemovalJob } from "./videoBackgroundRemoval.js";

/** Access to the video-background-removal-fast model. */
export class VideoBackgroundRemovalFast {
  constructor(private readonly transport: Transport) {}

  /** Submit a video-background-removal-fast job; returns immediately with status PROCESSING. */
  submit(input: VideoBackgroundRemovalInput, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("POST", "/v1/video-background-removal-fast", input, options);
  }

  /** Return one snapshot of a video-background-removal-fast job. */
  get(jobID: string, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("GET", "/v1/video-background-removal-fast/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 10 * 1000, options);
  }

  /** Submit a video-background-removal-fast job and wait for the finished result. */
  async generate(input: VideoBackgroundRemovalInput, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
