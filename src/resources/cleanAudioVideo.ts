// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

import type { CleanAudioJobError } from "./cleanAudio.js";

/** Inputs for a clean-audio-video job. */
export interface CleanAudioVideoInput {
  /** Set to false to skip loudness normalization and keep the input level. */
  normalize_loudness?: boolean;
  /** How much of the original is allowed to remain under speech: the suppression floor is 1 - strength. Lower keeps more room tone behind the voice; silence between words is always fully cleaned. */
  strength?: string;
  /** Integrated loudness of the output in LUFS (ITU-R BS.1770); true peak is capped at -1.1 dBTP. Ignored when normalize_loudness is false. A null reads as omitted: set normalize_loudness to false to skip normalization. */
  target_lufs?: string;
  /** URL of the video to clean: MP4, MOV, MKV or WebM with an H.264, HEVC, AV1, MPEG-4, VP8 or VP9 video stream and an audio track, up to 30 minutes and 2 GB. Only the first audio track is kept. */
  video_url: string;
}

/** The resource produced by a completed clean-audio-video job. */
export interface CleanAudioVideo {
  /** The input video with its audio track replaced by the denoised one. The picture is copied unchanged; the audio is 48 kHz mono, AAC in an MP4 for H.264, HEVC, AV1 or MPEG-4 input, Opus in a WebM for VP8 or VP9. */
  video: File;
}

/** The job envelope for the clean-audio-video model. */
export interface CleanAudioVideoJob {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: CleanAudioVideo | null;
  /** Present once the job has FAILED. */
  error?: CleanAudioJobError | null;
}

/** Access to the clean-audio-video model. */
export class CleanAudioVideo {
  constructor(private readonly transport: Transport) {}

  /** Submit a clean-audio-video job; returns immediately with status PROCESSING. */
  submit(input: CleanAudioVideoInput, options?: RequestOptions): Promise<CleanAudioVideoJob> {
    return this.transport.request("POST", "/v1/clean-audio-video", input, options);
  }

  /** Return one snapshot of a clean-audio-video job. */
  get(jobID: string, options?: RequestOptions): Promise<CleanAudioVideoJob> {
    return this.transport.request("GET", "/v1/clean-audio-video/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<CleanAudioVideoJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 15 * 1000, options);
  }

  /** Submit a clean-audio-video job and wait for the finished result. */
  async generate(input: CleanAudioVideoInput, options?: WaitOptions): Promise<CleanAudioVideoJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
