# @veedstudio/sdk

Official TypeScript/Node SDK for the [VEED API](https://api.veed.io) — programmatic access to VEED's AI video models. Zero runtime dependencies.

> Generated from VEED's OpenAPI spec. Do not edit by hand — changes are overwritten on the next release.

## Install

```bash
npm install @veedstudio/sdk
```

## Usage

```ts
import Veed from "@veedstudio/sdk";

const client = new Veed(); // reads VEED_API_KEY

// One-shot: submit and wait for the finished video.
const job = await client.fabric.generate({
  image_url: "https://example.com/face.png",
  audio_url: "https://example.com/speech.mp3",
  resolution: "720p",
});
console.log(job.result?.video.url);
```

Or keep control of the lifecycle:

```ts
const { job_id } = await client.lipsync20.submit({
  video_url: "https://example.com/source.mp4",
  audio_url: "https://example.com/dub.mp3",
});
// ... persist job_id, come back later ...
const done = await client.lipsync20.wait(job_id, { pollIntervalMs: 5000, timeoutMs: 1_800_000 });
```

### Errors

HTTP-layer rejections throw subclasses of `APIError` (with `.status`, `.code`, `.requestID`).
Accepted jobs that fail during rendering throw `JobFailedError` from `wait`/`generate`:

```ts
import { JobFailedError } from "@veedstudio/sdk";

try {
  await client.fabric.generate({ ... });
} catch (err) {
  if (err instanceof JobFailedError && err.code === "content_moderation") {
    // handle moderation rejection
  }
}
```

Retries (429/5xx, honoring `Retry-After`) are built in; submits are safe to retry because a
rejected submit never creates a job.

## License

MIT — see [LICENSE](LICENSE).
