// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

/** Output encoding. vp9 (the default) yields a single webm video with an alpha channel; h264 yields two files (the RGB video and an alpha matte) and is recommended for better RGB quality. */
export type VideoBackgroundRemovalOutputCodec = "vp9" | "h264";

/** stable machine-readable failure codes for video-background-removal jobs (kept open for forward compatibility). */
export type VideoBackgroundRemovalJobErrorCode =
  | "input_validation"
  | "content_moderation"
  | "invalid_file"
  | "audio_too_long"
  | "transload_failed"
  | "generation_failed"
  | "timeout"
  | (string & {});

/** Inputs for a video-background-removal job. */
export interface VideoBackgroundRemovalInput {
  /** Output encoding. vp9 (the default) yields a single webm video with an alpha channel; h264 yields two files (the RGB video and an alpha matte) and is recommended for better RGB quality. */
  output_codec?: VideoBackgroundRemovalOutputCodec;
  /** Improves the quality of the extracted subject's edges. */
  refine_foreground_edges?: boolean;
  /** Set to false when the subject is not a person. */
  subject_is_person?: boolean;
  /** URL of the source video to remove the background from. */
  video_url: string;
}

/** The resource produced by a completed video-background-removal job. */
export interface VideoBackgroundRemovalFiles {
  /** Rendered background-removed file(s): one webm with alpha for vp9; the RGB video and the alpha matte (two files) for h264. */
  files: File[] | null;
}

/** Why a video-background-removal job FAILED. */
export interface VideoBackgroundRemovalJobError {
  code: VideoBackgroundRemovalJobErrorCode;
  message: string;
  details?: JobErrorDetail[] | null;
}

/** The job envelope for the video-background-removal model. */
export interface VideoBackgroundRemovalJob {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: VideoBackgroundRemovalFiles | null;
  /** Present once the job has FAILED. */
  error?: VideoBackgroundRemovalJobError | null;
}

/** Access to the video-background-removal model. */
export class VideoBackgroundRemoval {
  constructor(private readonly transport: Transport) {}

  /** Submit a video-background-removal job; returns immediately with status PROCESSING. */
  submit(input: VideoBackgroundRemovalInput, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("POST", "/v1/video-background-removal", input, options);
  }

  /** Return one snapshot of a video-background-removal job. */
  get(jobID: string, options?: RequestOptions): Promise<VideoBackgroundRemovalJob> {
    return this.transport.request("GET", "/v1/video-background-removal/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 10 * 1000, options);
  }

  /** Submit a video-background-removal job and wait for the finished result. */
  async generate(input: VideoBackgroundRemovalInput, options?: WaitOptions): Promise<VideoBackgroundRemovalJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
