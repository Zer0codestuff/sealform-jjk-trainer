import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

async function render() {
  const { startProdServer } = await import(
    "../node_modules/vinext/dist/server/prod-server.js"
  );
  const { server, port } = await startProdServer({
    host: "127.0.0.1",
    port: 0,
    outDir: fileURLToPath(new URL("../dist", import.meta.url)),
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { accept: "text/html" },
    });
    return { response, html: await response.text() };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("server-renders the finished SEALFORM product shell", async () => {
  const { response, html } = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

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

test("does not ship ChatGPT Sites starter files", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.name, "sealform-jjk-trainer");

  const gone = [
    "../app/chatgpt-auth.ts",
    "../examples/d1",
    "../.openai/hosting.json",
    "../db/schema.ts",
    "../drizzle.config.ts",
    "../build/sites-vite-plugin.ts",
    "../worker/index.ts",
  ];

  for (const path of gone) {
    await assert.rejects(access(new URL(path, import.meta.url)), `${path} should be gone`);
  }
});
