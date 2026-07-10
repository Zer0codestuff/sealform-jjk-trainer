"use client";

/* eslint-disable @next/next/no-img-element -- Reference artwork is served as immutable local source material with preserved native proportions. */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { Technique } from "../lib/techniques";
import type { CameraStatus, ModelStatus } from "../hooks/useHandTracking";
import type { TrackingFrame } from "../lib/pose";

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
] as const;

type CameraStageProps = {
  technique: Technique;
  mode: "learn" | "practice" | "calibrate";
  videoRef: RefObject<HTMLVideoElement | null>;
  frame: TrackingFrame;
  modelStatus: ModelStatus;
  modelError: string;
  cameraStatus: CameraStatus;
  cameraError: string;
  mirror: boolean;
  setMirror: (value: boolean) => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  score: number;
  holdProgress: number;
  success: boolean;
};

export function CameraStage({
  technique,
  mode,
  videoRef,
  frame,
  modelStatus,
  modelError,
  cameraStatus,
  cameraError,
  mirror,
  setMirror,
  onStartCamera,
  onStopCamera,
  score,
  holdProgress,
  success,
}: CameraStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraActive = cameraStatus === "active";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraActive) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(bounds.width * ratio));
    const height = Math.max(1, Math.round(bounds.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";

    frame.hands.forEach((hand, handIndex) => {
      const sourceWidth = videoRef.current?.videoWidth || bounds.width;
      const sourceHeight = videoRef.current?.videoHeight || bounds.height;
      const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
      const renderedWidth = sourceWidth * coverScale;
      const renderedHeight = sourceHeight * coverScale;
      const offsetX = (width - renderedWidth) / 2;
      const offsetY = (height - renderedHeight) / 2;
      const points = hand.landmarks.map((point) => ({
        x: point.x * renderedWidth + offsetX,
        y: point.y * renderedHeight + offsetY,
      }));
      context.strokeStyle = handIndex === 0 ? technique.accent : "rgba(242, 234, 220, .88)";
      context.lineWidth = Math.max(2.2 * ratio, 3);
      context.shadowColor = handIndex === 0 ? technique.accent : "rgba(242, 234, 220, .6)";
      context.shadowBlur = 8 * ratio;
      for (const [from, to] of HAND_CONNECTIONS) {
        context.beginPath();
        context.moveTo(points[from].x, points[from].y);
        context.lineTo(points[to].x, points[to].y);
        context.stroke();
      }
      context.shadowBlur = 0;
      points.forEach((point, index) => {
        const isTip = [4, 8, 12, 16, 20].includes(index);
        context.beginPath();
        context.arc(point.x, point.y, (isTip ? 4.2 : 2.7) * ratio, 0, Math.PI * 2);
        context.fillStyle = isTip ? "#f4eadb" : technique.accent;
        context.fill();
      });
    });
  }, [cameraActive, frame, technique.accent, videoRef]);

  const statusLabel = cameraActive
    ? `${frame.hands.length} ${frame.hands.length === 1 ? "hand" : "hands"} tracked`
    : modelStatus === "loading"
      ? "Preparing hand model"
      : "Camera is off";

  return (
    <section className={`camera-stage ${success ? "is-success" : ""}`} aria-label="Training camera">
      <div className="camera-stage__topline">
        <div className="stage-status">
          <span className={`status-dot ${cameraActive ? "is-live" : ""}`} aria-hidden="true" />
          <span>{statusLabel}</span>
        </div>
        <span className="stage-technique-label">{technique.name}</span>
      </div>

      <div className={`camera-media ${mirror ? "is-mirrored" : ""}`}>
        <video
          ref={videoRef}
          className={`camera-video ${cameraActive ? "is-visible" : ""}`}
          muted
          playsInline
          aria-label="Live camera preview"
        />
        <canvas ref={canvasRef} className="hand-overlay" aria-hidden="true" />
      </div>

      {!cameraActive && (
        <div className="stage-idle">
          <div className="stage-idle__reference" aria-hidden="true">
            <img src={technique.reference} alt="" />
          </div>
          <div className="stage-idle__content">
            <span className="eyebrow">{mode === "learn" ? "Reference mode" : "Private camera session"}</span>
            <h2>
              {mode === "learn"
                ? "Study every contact before you move."
                : "Your camera stays on this device."}
            </h2>
            <p>
              {mode === "learn"
                ? "Use the sourced canon panel and the written finger map together."
                : "Frames are converted to hand landmarks locally. No photo, video, or landmark data is uploaded."}
            </p>
            {mode !== "learn" && technique.hands > 0 && (
              <button
                type="button"
                className="primary-action"
                onClick={onStartCamera}
                disabled={cameraStatus === "requesting" || modelStatus === "error"}
              >
                <span className="action-dot" aria-hidden="true" />
                {cameraStatus === "requesting" ? "Waiting for permission…" : "Enable camera"}
              </button>
            )}
            {mode !== "learn" && technique.hands === 0 && (
              <p className="stage-note">This activation is documented, but it is not a reproducible hand pose.</p>
            )}
          </div>
        </div>
      )}

      {modelStatus === "loading" && !cameraActive && (
        <div className="model-progress" aria-live="polite">
          <span className="model-progress__bar" />
          Preparing the on-device hand model…
        </div>
      )}

      {(cameraError || modelError) && (
        <div className="stage-error" role="alert">
          <strong>{modelError ? "Hand model unavailable" : "Camera unavailable"}</strong>
          <span>{modelError || cameraError}</span>
        </div>
      )}

      {cameraActive && (
        <>
          <div className="frame-guide" aria-hidden="true">
            <span className="frame-corner frame-corner--tl" />
            <span className="frame-corner frame-corner--tr" />
            <span className="frame-corner frame-corner--bl" />
            <span className="frame-corner frame-corner--br" />
          </div>
          <div className="stage-score" aria-label={`Pose match ${Math.round(score * 100)} percent`}>
            <div
              className="score-orbit"
              style={{
                background: `conic-gradient(${success ? "#b7d39f" : technique.accent} ${Math.max(score, holdProgress) * 360}deg, rgba(255,255,255,.12) 0deg)`,
              }}
            >
              <div>
                <strong>{Math.round(score * 100)}</strong>
                <span>match</span>
              </div>
            </div>
          </div>
          <div className="camera-controls" aria-label="Camera controls">
            <button type="button" className="stage-control" onClick={() => setMirror(!mirror)}>
              Preview {mirror ? "mirrored" : "natural"}
            </button>
            <button type="button" className="stage-control stage-control--danger" onClick={onStopCamera}>
              Stop camera
            </button>
          </div>
        </>
      )}

      {success && (
        <div className="success-flash" role="status">
          <span>Form held</span>
          <strong>{technique.name}</strong>
        </div>
      )}
    </section>
  );
}
