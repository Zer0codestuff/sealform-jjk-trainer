import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished SEALFORM product shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SEALFORM — Domain Hand-Sign Trainer<\/title>/i);
  assert.match(html, /Master the gesture\. Hold the form\./i);
  assert.match(html, /Domain hand-sign lab/i);
  assert.match(html, /On-device/i);
  assert.match(html, /Unlimited Void/i);
  assert.match(html, /Reference from the web/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("ships local hand-tracking assets and sourced reference images", async () => {
  const expected = [
    "../public/models/hand_landmarker.task",
    "../public/mediapipe/wasm/vision_wasm_internal.wasm",
    "../public/references/unlimited-void.png",
    "../public/references/malevolent-shrine.png",
    "../public/references/yuji-unnamed-domain.png",
  ];

  for (const path of expected) {
    await assert.doesNotReject(access(new URL(path, import.meta.url)), `${path} should exist`);
  }
});
