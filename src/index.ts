// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import type { ClientOptions } from "./core.js";
import { Transport } from "./core.js";
import { Fabric } from "./resources/fabric.js";
import { Lipsync20 } from "./resources/lipsync20.js";
import { VideoBackgroundRemoval } from "./resources/videoBackgroundRemoval.js";
import { VideoBackgroundRemovalFast } from "./resources/videoBackgroundRemovalFast.js";
import { VideoBackgroundRemovalGreenScreen } from "./resources/videoBackgroundRemovalGreenScreen.js";

export type {
  ClientOptions,
  File,
  JobErrorDetail,
  JobStatus,
  RequestOptions,
  WaitOptions,
} from "./core.js";
export { DEFAULT_BASE_URL, VERSION } from "./core.js";
export * from "./error.js";
export * from "./resources/fabric.js";
export * from "./resources/lipsync20.js";
export * from "./resources/videoBackgroundRemoval.js";
export * from "./resources/videoBackgroundRemovalFast.js";
export * from "./resources/videoBackgroundRemovalGreenScreen.js";

/**
 * VEED API client. Construct once with your API key and reuse.
 *
 *     const client = new Veed(); // reads VEED_API_KEY
 */
export class Veed {
  readonly fabric: Fabric;
  readonly lipsync20: Lipsync20;
  readonly videoBackgroundRemoval: VideoBackgroundRemoval;
  readonly videoBackgroundRemovalFast: VideoBackgroundRemovalFast;
  readonly videoBackgroundRemovalGreenScreen: VideoBackgroundRemovalGreenScreen;

  constructor(options: ClientOptions = {}) {
    const transport = new Transport(options);
    this.fabric = new Fabric(transport);
    this.lipsync20 = new Lipsync20(transport);
    this.videoBackgroundRemoval = new VideoBackgroundRemoval(transport);
    this.videoBackgroundRemovalFast = new VideoBackgroundRemovalFast(transport);
    this.videoBackgroundRemovalGreenScreen = new VideoBackgroundRemovalGreenScreen(transport);
  }
}

export default Veed;
