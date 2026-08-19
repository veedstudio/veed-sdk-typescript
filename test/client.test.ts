// Code generated from the VEED OpenAPI spec. DO NOT EDIT.

import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";

import {
  JobFailedError,
  MAX_RETRY_AFTER_SECONDS,
  NotFoundError,
  RateLimitError,
  Veed,
  WaitTimeoutError,
} from "../src/index.js";

type Route = (
  method: string,
  path: string,
  body: string,
  headers: http.IncomingHttpHeaders,
) => [number, unknown, Record<string, string>?];

const servers: http.Server[] = [];
after(() => servers.forEach((s) => s.close()));

function makeServer(route: Route): Promise<string> {
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const [status, payload, headers] = route(req.method ?? "", req.url ?? "", body, req.headers);
      res.writeHead(status, { "Content-Type": "application/json", ...(headers ?? {}) });
      res.end(JSON.stringify(payload));
    });
  });
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr === null || typeof addr === "string") throw new Error("no address");
      resolve(`http://127.0.0.1:${addr.port}`);
    });
  });
}

const PROCESSING = { data: { job_id: "j1", status: "PROCESSING" } };
const COMPLETED = {
  data: { job_id: "j1", status: "COMPLETED", result: { video: { url: "https://cdn/out.mp4" } } },
};

test("generate end to end", async () => {
  let gets = 0;
  let auth = "";
  const url = await makeServer((method, path, body, headers) => {
    if (method === "POST" && path === "/v1/fabric-1.0") {
      auth = String(headers.authorization);
      assert.equal(JSON.parse(body).resolution, "720p");
      return [202, PROCESSING];
    }
    assert.equal(path, "/v1/fabric-1.0/j1");
    gets++;
    return [200, gets < 2 ? PROCESSING : COMPLETED];
  });

  const client = new Veed({ apiKey: "vp_test", baseURL: url });
  const job = await client.fabric.generate(
    { image_url: "https://in/i.png", audio_url: "https://in/a.mp3", resolution: "720p" },
    { pollIntervalMs: 1 },
  );
  assert.equal(job.result?.video.url, "https://cdn/out.mp4");
  assert.equal(auth, "Bearer vp_test");
});

test("error mapping", async () => {
  const url = await makeServer(() => [
    404,
    { error: { code: "not_found", message: "no such job", request_id: "req-1" } },
  ]);
  const client = new Veed({ apiKey: "vp_test", baseURL: url });
  await assert.rejects(client.fabric.get("missing"), (err: unknown) => {
    assert.ok(err instanceof NotFoundError);
    assert.equal(err.code, "not_found");
    assert.equal(err.requestID, "req-1");
    return true;
  });
});

test("job failed", async () => {
  const url = await makeServer(() => [
    200,
    { data: { job_id: "j1", status: "FAILED", error: { code: "content_moderation", message: "rejected" } } },
  ]);
  const client = new Veed({ apiKey: "vp_test", baseURL: url });
  await assert.rejects(client.fabric.wait("j1", { pollIntervalMs: 1 }), (err: unknown) => {
    assert.ok(err instanceof JobFailedError);
    assert.equal(err.code, "content_moderation");
    return true;
  });
});

test("wait timeout", async () => {
  const url = await makeServer(() => [200, PROCESSING]);
  const client = new Veed({ apiKey: "vp_test", baseURL: url });
  await assert.rejects(
    client.lipsync20.wait("j1", { pollIntervalMs: 1, timeoutMs: 20 }),
    WaitTimeoutError,
  );
});

test("client default headers with per-call override", async () => {
  let store = "";
  let media = "";
  const url = await makeServer((_method, _path, _body, headers) => {
    store = String(headers["x-veed-store-io"]);
    media = String(headers["x-veed-media-expiration-seconds"]);
    return [200, PROCESSING];
  });
  const client = new Veed({ apiKey: "vp_test", baseURL: url, storeIO: false, mediaExpirationSeconds: 600 });

  await client.fabric.get("j1");
  assert.equal(store, "0");
  assert.equal(media, "600");

  await client.fabric.get("j1", { storeIO: true, mediaExpirationSeconds: 60 });
  assert.equal(store, "1");
  assert.equal(media, "60");
});

test("retries on 429 with Retry-After", async () => {
  let calls = 0;
  const url = await makeServer(() => {
    calls++;
    if (calls === 1) {
      return [429, { error: { code: "rate_limited", message: "slow down", request_id: "r" } }, { "Retry-After": "0" }];
    }
    return [202, { data: { job_id: "j9", status: "PROCESSING" } }];
  });
  const client = new Veed({ apiKey: "vp_test", baseURL: url });
  const job = await client.lipsync20.submit({ video_url: "https://in/v.mp4", audio_url: "https://in/a.mp3" });
  assert.equal(job.job_id, "j9");
  assert.equal(calls, 2);
});

// Retry-After: 0 fails the `> 0` guard every caller applies, so the suite left
// the parser unexercised.
test("clamps a hostile Retry-After", async () => {
  const url = await makeServer(() => [
    429,
    { error: { code: "rate_limited", message: "slow down", request_id: "r" } },
    { "Retry-After": "999999999" },
  ]);
  const client = new Veed({ apiKey: "vp_test", baseURL: url, maxRetries: 0 });
  await assert.rejects(
    () => client.fabric.get("j1"),
    (err: unknown) => {
      assert.ok(err instanceof RateLimitError);
      assert.equal(err.retryAfter, MAX_RETRY_AFTER_SECONDS);
      return true;
    },
  );
});

test("wait timeout survives a Retry-After", async () => {
  const url = await makeServer(() => [
    429,
    { error: { code: "rate_limited", message: "slow down", request_id: "r" } },
    { "Retry-After": "600" },
  ]);
  const client = new Veed({ apiKey: "vp_test", baseURL: url, maxRetries: 0 });
  await assert.rejects(
    () => client.fabric.wait("j1", { pollIntervalMs: 1, timeoutMs: 10 }),
    WaitTimeoutError,
  );
});
