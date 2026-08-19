// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

import type { VideoBackgroundRemovalJob } from "./videoBackgroundRemoval.js";
/** Output encoding. vp9 (the default) yields a single webm video with an alpha channel; h264 yields two files (the RGB video and an alpha matte) and is recommended for better RGB quality. */
export type VideoBackgroundRemovalGreenScreenOutputCodec = "vp9" | "h264";


/** Inputs for a video-background-removal-green-screen job. */
export interface VideoBackgroundRemovalGreenScreenInput {
  /** Output encoding. vp9 (the default) yields a single webm video with an alpha channel; h264 yields two files (the RGB video and an alpha matte) and is recommended for better RGB quality. */
  output_codec?: VideoBackgroundRemovalGreenScreenOutputCodec;
  /** How strongly green cast is removed from the kept subject. Raise it when green spots remain, lower it when colours shift on the subject. */
  spill_suppression_strength?: string;
  /** URL of the source video, shot against a green screen. */
  video_url: string;
}

/** Access to the video-background-removal-green-screen model. */
export class VideoBackgroundRemovalGreenScreen {
  constructor(private readonly transport: Transport) {}

  /** Submit a video-background-removal-green-screen job; returns immediately with status PROCESSING. */
  submit(input: VideoBackgroundRemovalGreenScreenInput, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("POST", "/v1/video-background-removal-green-screen", input, options);
  }

  /** Return one snapshot of a video-background-removal-green-screen job. */
  get(jobID: string, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("GET", "/v1/video-background-removal-green-screen/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 10 * 1000, options);
  }

  /** Submit a video-background-removal-green-screen job and wait for the finished result. */
  async generate(input: VideoBackgroundRemovalGreenScreenInput, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
