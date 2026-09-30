// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { File, JobErrorDetail, JobStatus, RequestOptions, WaitOptions } from "../core.js";
import { Transport, waitForJob } from "../core.js";

/** Container for the 48 kHz mono 16-bit output. FLAC is lossless at about half the size of WAV. */
export type CleanAudioOutputFormat = "flac" | "wav";

/** stable machine-readable failure codes for clean-audio jobs (kept open for forward compatibility). */
export type CleanAudioJobErrorCode =
  | "input_validation"
  | "content_moderation"
  | "invalid_file"
  | "audio_too_long"
  | "transload_failed"
  | "generation_failed"
  | "timeout"
  | (string & {});

/** Inputs for a clean-audio job. */
export interface CleanAudioInput {
  /** URL of the recording to clean: any audio or video file, up to 30 minutes and 512 MB. A video's audio track is used; multi-channel audio is mixed down to mono. */
  audio_url: string;
  /** Set to false to skip loudness normalization and keep the input level. */
  normalize_loudness?: boolean;
  /** Container for the 48 kHz mono 16-bit output. FLAC is lossless at about half the size of WAV. */
  output_format?: CleanAudioOutputFormat;
  /** How much of the original is allowed to remain under speech: the suppression floor is 1 - strength. Lower keeps more room tone behind the voice; silence between words is always fully cleaned. */
  strength?: string;
  /** Integrated loudness of the output in LUFS (ITU-R BS.1770); true peak is capped at -1.1 dBTP. Ignored when normalize_loudness is false. A null reads as omitted: set normalize_loudness to false to skip normalization. */
  target_lufs?: string;
}

/** The resource produced by a completed clean-audio job. */
export interface CleanAudio {
  /** The denoised recording: 48 kHz mono, the same duration as the input. */
  audio: File;
}

/** Why a clean-audio job FAILED. */
export interface CleanAudioJobError {
  code: CleanAudioJobErrorCode;
  message: string;
  details?: JobErrorDetail[] | null;
}

/** The job envelope for the clean-audio model. */
export interface CleanAudioJob {
  job_id: string;
  status: JobStatus;
  /** Present once the job is COMPLETED. */
  result?: CleanAudio | null;
  /** Present once the job has FAILED. */
  error?: CleanAudioJobError | null;
}

/** Access to the clean-audio model. */
export class CleanAudio {
  constructor(private readonly transport: Transport) {}

  /** Submit a clean-audio job; returns immediately with status PROCESSING. */
  submit(input: CleanAudioInput, options?: RequestOptions): Promise<CleanAudioJob> {
    return this.transport.request("POST", "/v1/clean-audio", input, options);
  }

  /** Return one snapshot of a clean-audio job. */
  get(jobID: string, options?: RequestOptions): Promise<CleanAudioJob> {
    return this.transport.request("GET", "/v1/clean-audio/" + encodeURIComponent(jobID), undefined, options);
  }

  /**
   * Poll until the job reaches a terminal state. Resolves with the COMPLETED
   * job; rejects with JobFailedError, JobCancelledError or WaitTimeoutError
   * (each carries the last-seen job).
   */
  wait(jobID: string, options?: WaitOptions): Promise<CleanAudioJob> {
    return waitForJob(() => this.get(jobID, options), jobID, 15 * 1000, options);
  }

  /** Submit a clean-audio job and wait for the finished result. */
  async generate(input: CleanAudioInput, options?: WaitOptions): Promise<CleanAudioJob> {
    const job = await this.submit(input, options);
    return this.wait(job.job_id, options);
  }
}
