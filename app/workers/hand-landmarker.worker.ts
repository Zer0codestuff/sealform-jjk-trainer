/// <reference lib="webworker" />

import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let landmarker: HandLandmarker | null = null;
let delegate: "GPU" | "CPU" = "CPU";

async function createLandmarker(preferredDelegate: "GPU" | "CPU") {
  const origin = self.location.origin;
  // Module workers need MediaPipe's ES-module WASM loader so ModuleFactory is
  // attached to globalThis before the task runtime initializes.
  const vision = await FilesetResolver.forVisionTasks(`${origin}/mediapipe/wasm`, true);
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `${origin}/models/hand_landmarker.task`,
      delegate: preferredDelegate,
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

async function initialize() {
  if (landmarker) return;
  try {
    landmarker = await createLandmarker("GPU");
    delegate = "GPU";
  } catch {
    landmarker = await createLandmarker("CPU");
    delegate = "CPU";
  }
  self.postMessage({ type: "ready", delegate });
}

self.addEventListener("message", async (event: MessageEvent) => {
  const message = event.data as
    | { type: "init" }
    | { type: "detect"; bitmap: ImageBitmap; timestamp: number };

  if (message.type === "init") {
    try {
      await initialize();
    } catch (error) {
      self.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "The hand model could not be loaded.",
      });
    }
    return;
  }

  if (message.type === "detect") {
    const startedAt = performance.now();
    try {
      if (!landmarker) await initialize();
      const result = landmarker!.detectForVideo(message.bitmap, message.timestamp);
      self.postMessage({
        type: "result",
        timestamp: message.timestamp,
        inferenceMs: performance.now() - startedAt,
        hands: result.landmarks.map((landmarks, index) => ({
          landmarks,
          worldLandmarks: result.worldLandmarks[index] ?? [],
          handedness: result.handedness[index]?.[0]?.categoryName ?? "Unknown",
          confidence: result.handedness[index]?.[0]?.score ?? 0,
        })),
      });
    } catch (error) {
      self.postMessage({
        type: "frame-error",
        message: error instanceof Error ? error.message : "Frame analysis failed.",
      });
    } finally {
      message.bitmap.close();
    }
  }
});

export {};
