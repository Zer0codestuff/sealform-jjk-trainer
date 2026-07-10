"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackingFrame } from "../lib/pose";

export type ModelStatus = "loading" | "ready" | "error";
export type CameraStatus =
  | "idle"
  | "requesting"
  | "active"
  | "denied"
  | "missing"
  | "insecure"
  | "error";

type WorkerMessage =
  | { type: "ready"; delegate: "GPU" | "CPU" }
  | ({ type: "result" } & TrackingFrame)
  | { type: "error" | "frame-error"; message: string };

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const inFlightRef = useRef(false);
  const lastSentRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("loading");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraError, setCameraError] = useState("");
  const [modelError, setModelError] = useState("");
  const [frame, setFrame] = useState<TrackingFrame>({ timestamp: 0, hands: [] });
  const [delegate, setDelegate] = useState<"GPU" | "CPU" | null>(null);
  const [mirror, setMirror] = useState(true);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    inFlightRef.current = false;
    setFrame({ timestamp: performance.now(), hands: [] });
    setCameraStatus("idle");
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/hand-landmarker.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onerror = (event) => {
      setModelError(event.message || "The hand-tracking worker could not be loaded.");
      setModelStatus("error");
      inFlightRef.current = false;
    };
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.type === "ready") {
        setDelegate(message.delegate);
        setModelStatus("ready");
        return;
      }
      if (message.type === "result") {
        inFlightRef.current = false;
        setFrame({
          timestamp: message.timestamp,
          hands: message.hands,
          inferenceMs: message.inferenceMs,
        });
        return;
      }
      if (message.type === "frame-error") {
        inFlightRef.current = false;
        return;
      }
      setModelError(message.message);
      setModelStatus("error");
      inFlightRef.current = false;
    };
    worker.postMessage({ type: "init" });

    return () => {
      worker.terminate();
      workerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraStatus !== "active" || modelStatus !== "ready") return;
    let animationFrame = 0;
    let cancelled = false;

    const tick = async (timestamp: number) => {
      if (cancelled) return;
      const video = videoRef.current;
      const worker = workerRef.current;
      const shouldAnalyze =
        !document.hidden &&
        video &&
        worker &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastVideoTimeRef.current &&
        !inFlightRef.current &&
        timestamp - lastSentRef.current > 66;

      if (shouldAnalyze) {
        inFlightRef.current = true;
        lastSentRef.current = timestamp;
        lastVideoTimeRef.current = video.currentTime;
        try {
          const bitmap = await createImageBitmap(video);
          worker.postMessage({ type: "detect", bitmap, timestamp }, [bitmap]);
        } catch {
          inFlightRef.current = false;
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
    };
  }, [cameraStatus, modelStatus]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) inFlightRef.current = false;
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraStatus("insecure");
      setCameraError("Camera access requires HTTPS or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("missing");
      setCameraError("This browser does not expose a compatible camera API.");
      return;
    }

    setCameraStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("The camera surface is not ready.");
      video.srcObject = stream;
      await video.play();
      setCameraStatus("active");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCameraStatus("denied");
        setCameraError("Camera permission was not granted. You can still use Learn mode.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setCameraStatus("missing");
        setCameraError("No available camera was found.");
      } else if (name === "NotReadableError") {
        setCameraStatus("error");
        setCameraError("The camera is already in use by another application.");
      } else {
        setCameraStatus("error");
        setCameraError(error instanceof Error ? error.message : "The camera could not be started.");
      }
    }
  }, []);

  return {
    videoRef,
    modelStatus,
    modelError,
    cameraStatus,
    cameraError,
    frame,
    delegate,
    mirror,
    setMirror,
    startCamera,
    stopCamera,
  };
}
