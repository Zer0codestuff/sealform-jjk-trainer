"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser storage hydration and frame-driven smoothing intentionally synchronize external systems into React state. */
/* eslint-disable @next/next/no-img-element -- Canon reference artwork is intentionally rendered without transformation or third-party image optimization. */

import { useEffect, useMemo, useRef, useState } from "react";
import { CameraStage } from "./CameraStage";
import { useHandTracking } from "../hooks/useHandTracking";
import {
  addCalibrationSample,
  extractFeatureVector,
  isCalibrationStore,
  scorePose,
  type CalibrationClass,
  type CalibrationStore,
} from "../lib/pose";
import {
  cameraTechniques,
  researchNotes,
  techniques,
  type Technique,
  type TrainingMode,
} from "../lib/techniques";

type AppMode = "learn" | "practice" | "calibrate";
type LibraryFilter = "all" | "camera" | "anime" | "archive";

type CaptureSession = {
  kind: CalibrationClass;
  countdown: number;
  endsAt: number | null;
  added: number;
};

const CALIBRATION_KEY = "sealform-calibration-v1";
const MASTERED_KEY = "sealform-mastered-v1";

function trainingLabel(mode: TrainingMode) {
  if (mode === "strict") return "Strict tracking";
  if (mode === "relaxed") return "Relaxed tracking";
  if (mode === "sequence") return "Solo sequence";
  if (mode === "motion") return "Motion only";
  return "Reference only";
}

function difficultyLabel(level: Technique["difficulty"]) {
  return level === 1 ? "Foundational" : level === 2 ? "Intermediate" : "Advanced";
}

export function TrainerApp() {
  const [mode, setMode] = useState<AppMode>("learn");
  const [selectedId, setSelectedId] = useState(techniques[0].id);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [showManga, setShowManga] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [calibrations, setCalibrations] = useState<CalibrationStore>({});
  const [mastered, setMastered] = useState<string[]>([]);
  const [displayScore, setDisplayScore] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [sequencePhase, setSequencePhase] = useState<1 | 2>(1);
  const [capture, setCapture] = useState<CaptureSession | null>(null);
  const holdStartedRef = useRef<number | null>(null);
  const lastCaptureFrameRef = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const selected = techniques.find((technique) => technique.id === selectedId) ?? techniques[0];

  const tracking = useHandTracking();
  const { cameraStatus, stopCamera } = tracking;
  const profile = calibrations[selected.id];
  const scoringTechnique = useMemo<Technique>(() => {
    if (selected.trainingMode !== "sequence" || sequencePhase === 2) return selected;
    return {
      ...selected,
      patterns: [
        [-1, 0, 0, 0, -1],
        [-1, 0, 0, 0, -1],
      ],
      pairRule: "crossed" as const,
      threshold: 0.58,
    };
  }, [selected, sequencePhase]);
  const rawPose = useMemo(
    () => scorePose(scoringTechnique, tracking.frame.hands, profile),
    [profile, scoringTechnique, tracking.frame.hands],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CALIBRATION_KEY);
      const savedMastered = window.localStorage.getItem(MASTERED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (isCalibrationStore(parsed)) setCalibrations(parsed);
      }
      if (savedMastered) {
        const parsed = JSON.parse(savedMastered) as unknown;
        if (Array.isArray(parsed) && parsed.every((entry) => typeof entry === "string")) {
          setMastered(parsed.filter((entry) => techniques.some((technique) => technique.id === entry)));
        }
      }
    } catch {
      // Local storage may be unavailable in hardened browser modes.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibrations));
    } catch {
      // Training still works for the current session when local storage is unavailable.
    }
  }, [calibrations]);

  useEffect(() => {
    if (mode === "learn" && cameraStatus === "active") stopCamera();
  }, [cameraStatus, mode, stopCamera]);

  useEffect(() => {
    if (tracking.cameraStatus !== "active") {
      setDisplayScore(0);
      return;
    }
    setDisplayScore((current) => current * 0.7 + rawPose.score * 0.3);
  }, [rawPose.score, tracking.cameraStatus, tracking.frame.timestamp]);

  useEffect(() => {
    holdStartedRef.current = null;
    setHoldProgress(0);
    setSuccess(false);
    setCapture(null);
    setSequencePhase(1);
  }, [selected.id, mode]);

  useEffect(() => {
    if (tracking.cameraStatus !== "active" || selected.hands === 0) {
      holdStartedRef.current = null;
      setHoldProgress(0);
      return;
    }

    if (displayScore >= selected.threshold) {
      if (holdStartedRef.current === null) holdStartedRef.current = tracking.frame.timestamp;
      const elapsed = tracking.frame.timestamp - holdStartedRef.current;
      const progress = Math.min(1, elapsed / selected.holdMs);
      setHoldProgress(progress);
      if (progress >= 1 && !success) {
        if (selected.trainingMode === "sequence" && sequencePhase === 1) {
          setSequencePhase(2);
          holdStartedRef.current = null;
          setHoldProgress(0);
          setDisplayScore(0);
          return;
        }
        setSuccess(true);
        setMastered((current) => {
          if (current.includes(selected.id)) return current;
          const next = [...current, selected.id];
          try {
            window.localStorage.setItem(MASTERED_KEY, JSON.stringify(next));
          } catch {
            // Mastery is a convenience; recognition does not depend on persistence.
          }
          return next;
        });
        if (navigator.vibrate) navigator.vibrate(35);
      }
    } else if (displayScore < selected.threshold - 0.11) {
      holdStartedRef.current = null;
      setHoldProgress(0);
      if (displayScore < 0.55) setSuccess(false);
    }
  }, [displayScore, selected, sequencePhase, success, tracking.cameraStatus, tracking.frame.timestamp]);

  useEffect(() => {
    if (!capture || capture.countdown <= 0) return;
    const timer = window.setTimeout(() => {
      setCapture((current) => {
        if (!current) return null;
        const nextCountdown = current.countdown - 1;
        return {
          ...current,
          countdown: nextCountdown,
          endsAt: nextCountdown === 0 ? Date.now() + 3000 : null,
        };
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [capture]);

  useEffect(() => {
    if (!capture || capture.countdown > 0 || !capture.endsAt) return;
    if (Date.now() >= capture.endsAt) {
      setCapture(null);
      return;
    }
    if (
      tracking.frame.timestamp === lastCaptureFrameRef.current ||
      tracking.frame.hands.length !== selected.hands
    ) {
      return;
    }
    lastCaptureFrameRef.current = tracking.frame.timestamp;
    const sample = extractFeatureVector(tracking.frame.hands);
    const currentProfile = calibrations[selected.id];
    const before = currentProfile?.[capture.kind].length ?? 0;
    const nextProfile = addCalibrationSample(currentProfile, capture.kind, sample);
    const after = nextProfile[capture.kind].length;
    setCalibrations((current) => ({ ...current, [selected.id]: nextProfile }));
    if (after > before) {
      setCapture((current) => (current ? { ...current, added: current.added + 1 } : null));
    }
  }, [calibrations, capture, selected.hands, selected.id, tracking.frame]);

  useEffect(() => {
    if (!capture?.endsAt) return;
    const timer = window.setTimeout(
      () => setCapture(null),
      Math.max(0, capture.endsAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [capture?.endsAt]);

  const visibleTechniques = useMemo(() => {
    return techniques.filter((technique) => {
      if (!showManga && technique.spoiler === "manga") return false;
      if (libraryFilter === "camera") return technique.hands > 0;
      if (libraryFilter === "anime") return technique.spoiler === "anime";
      if (libraryFilter === "archive") return technique.hands === 0;
      return true;
    });
  }, [libraryFilter, showManga]);

  useEffect(() => {
    if (!visibleTechniques.some((technique) => technique.id === selected.id)) {
      setSelectedId(visibleTechniques[0]?.id ?? techniques[0].id);
    }
  }, [selected.id, visibleTechniques]);

  useEffect(() => {
    if (!settingsOpen && !researchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setResearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [researchOpen, settingsOpen]);

  const changeMode = (nextMode: AppMode) => {
    if (nextMode !== "learn" && selected.hands === 0) {
      const firstTrainable = cameraTechniques.find(
        (technique) => showManga || technique.spoiler === "anime",
      );
      if (firstTrainable) setSelectedId(firstTrainable.id);
    }
    setMode(nextMode);
  };

  const selectTechnique = (technique: Technique) => {
    setSelectedId(technique.id);
    if (mode !== "learn" && technique.hands === 0) setMode("learn");
  };

  const beginCapture = async (kind: CalibrationClass) => {
    if (tracking.cameraStatus !== "active") {
      await tracking.startCamera();
      return;
    }
    setCapture({ kind, countdown: 3, endsAt: null, added: 0 });
  };

  const exportCalibration = () => {
    const payload = {
      app: "SEALFORM",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profiles: calibrations,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sealform-calibration.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importCalibration = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as {
        app?: string;
        schemaVersion?: number;
        profiles?: CalibrationStore;
      };
      if (
        parsed.app !== "SEALFORM" ||
        parsed.schemaVersion !== 1 ||
        !isCalibrationStore(parsed.profiles)
      ) {
        throw new Error("Unsupported calibration file");
      }
      setCalibrations(parsed.profiles);
    } catch {
      window.alert("This is not a valid SEALFORM calibration file.");
    }
  };

  const resetSelectedCalibration = () => {
    if (!profile || !window.confirm(`Delete the saved recognition samples for ${selected.name}?`)) return;
    setCalibrations((current) => {
      const next = { ...current };
      delete next[selected.id];
      return next;
    });
  };

  const personalized = (profile?.positive.length ?? 0) >= 5;
  const primaryCorrection = success
    ? "Form locked. Release when you are ready for another attempt."
    : selected.trainingMode === "sequence"
      ? `Stage ${sequencePhase} of 2 — ${rawPose.correction}`
      : rawPose.correction;

  return (
    <div className="app-shell" style={{ "--tech-accent": selected.accent } as React.CSSProperties}>
      <header className="app-header">
        <button type="button" className="brand" onClick={() => changeMode("learn")} aria-label="SEALFORM home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
          </span>
          <span>
            <strong>SEALFORM</strong>
            <small>Domain hand-sign lab</small>
          </span>
        </button>

        <nav className="mode-switch" aria-label="Training mode">
          {(["learn", "practice", "calibrate"] as AppMode[]).map((item) => (
            <button
              type="button"
              key={item}
              className={mode === item ? "is-active" : ""}
              onClick={() => changeMode(item)}
              aria-pressed={mode === item}
            >
              {item === "calibrate" ? "Personalize" : item}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <div className="privacy-badge" title="Frames never leave this browser">
            <span aria-hidden="true" />
            On-device
          </div>
          <button type="button" className="text-button" onClick={() => setResearchOpen(true)}>
            Research
          </button>
          <button type="button" className="settings-button" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="intro-strip" aria-labelledby="page-title">
          <div>
            <span className="eyebrow">Form {String(techniques.indexOf(selected) + 1).padStart(2, "0")} / {techniques.length}</span>
            <h1 id="page-title">Master the gesture. Hold the form.</h1>
          </div>
          <p>
            Canon references, real-time hand landmarks, and recognition that learns your hands — all in one private browser session.
          </p>
        </section>

        <div className="workspace-grid">
          <CameraStage
            technique={selected}
            mode={mode}
            videoRef={tracking.videoRef}
            frame={tracking.frame}
            modelStatus={tracking.modelStatus}
            modelError={tracking.modelError}
            cameraStatus={tracking.cameraStatus}
            cameraError={tracking.cameraError}
            mirror={tracking.mirror}
            setMirror={tracking.setMirror}
            onStartCamera={tracking.startCamera}
            onStopCamera={tracking.stopCamera}
            score={displayScore}
            holdProgress={holdProgress}
            success={success}
          />

          <aside className="coach-panel" aria-label={`${mode} panel`}>
            <div className="coach-panel__header">
              <div>
                <span className="eyebrow">{selected.spoiler === "manga" ? "Manga reference" : "Anime-safe"}</span>
                <h2>{selected.name}</h2>
                <p>{selected.user}{selected.japanese ? ` · ${selected.japanese}` : ""}</p>
              </div>
              <div className="difficulty-stack" aria-label={`${difficultyLabel(selected.difficulty)} difficulty`}>
                {[1, 2, 3].map((level) => (
                  <i key={level} className={level <= selected.difficulty ? "is-filled" : ""} />
                ))}
              </div>
            </div>

            {mode === "learn" && (
              <LearnPanel technique={selected} onPractice={() => changeMode("practice")} />
            )}

            {mode === "practice" && (
              <PracticePanel
                technique={selected}
                score={displayScore}
                correction={primaryCorrection}
                handsDetected={tracking.frame.hands.length}
                modelStatus={tracking.modelStatus}
                delegate={tracking.delegate}
                personalized={personalized}
                profileCount={profile?.positive.length ?? 0}
                onPersonalize={() => changeMode("calibrate")}
              />
            )}

            {mode === "calibrate" && (
              <CalibrationPanel
                technique={selected}
                cameraActive={tracking.cameraStatus === "active"}
                positiveCount={profile?.positive.length ?? 0}
                negativeCount={profile?.negative.length ?? 0}
                capture={capture}
                onCapture={beginCapture}
                onExport={exportCalibration}
                onImport={() => importRef.current?.click()}
                onReset={resetSelectedCalibration}
                hasAnyProfiles={Object.keys(calibrations).length > 0}
              />
            )}
          </aside>
        </div>

        <section className="library-section" aria-labelledby="library-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Sourced library</span>
              <h2 id="library-heading">Choose a hand sign</h2>
            </div>
            <div className="library-filters" aria-label="Filter hand signs">
              {(
                [
                  ["all", "All forms"],
                  ["camera", "Camera-ready"],
                  ["anime", "Anime-safe"],
                  ["archive", "Archive"],
                ] as [LibraryFilter, string][]
              ).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={libraryFilter === value ? "is-active" : ""}
                  onClick={() => setLibraryFilter(value)}
                  aria-pressed={libraryFilter === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="technique-rail">
            {visibleTechniques.map((technique, index) => (
              <button
                type="button"
                key={technique.id}
                className={`technique-card ${selected.id === technique.id ? "is-selected" : ""}`}
                onClick={() => selectTechnique(technique)}
                aria-pressed={selected.id === technique.id}
                data-testid={`technique-${technique.id}`}
              >
                <span className="technique-card__image">
                  <img src={technique.reference} alt="" loading="lazy" />
                  <span className="technique-card__number">{String(index + 1).padStart(2, "0")}</span>
                  {mastered.includes(technique.id) && <span className="mastery-mark">Held</span>}
                </span>
                <span className="technique-card__body">
                  <span className="technique-card__meta">
                    {technique.spoiler === "manga" ? "Manga" : "Anime"} · {technique.hands || "No"} {technique.hands === 1 ? "hand" : "hands"}
                  </span>
                  <strong>{technique.name}</strong>
                  <small>{technique.user}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="method-section" aria-labelledby="method-heading">
          <div>
            <span className="eyebrow">How recognition works</span>
            <h2 id="method-heading">Geometry first. Your calibration second.</h2>
          </div>
          <div className="method-grid">
            <article>
              <span>01</span>
              <h3>21 landmarks per hand</h3>
              <p>MediaPipe maps each visible joint. The raw camera frame is discarded after local inference.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Explainable form score</h3>
              <p>Finger bends, contacts, hand spacing, and stability produce one useful correction at a time.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Personal k-nearest neighbors</h3>
              <p>Your saved landmark vectors augment the authored pose rules without redefining the canon form.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Unofficial fan-made training experience. Not affiliated with Gege Akutami, Shueisha, MAPPA, or any rights holder.</p>
        <div>
          <button type="button" onClick={() => setResearchOpen(true)}>Sources & methodology</button>
          <span>Camera frames are never stored.</span>
        </div>
      </footer>

      <input
        ref={importRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          void importCalibration(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {settingsOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <section
            className="settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Preferences</span>
                <h2 id="settings-title">Settings</h2>
              </div>
              <button type="button" onClick={() => setSettingsOpen(false)} aria-label="Close settings" autoFocus>Close</button>
            </div>
            <label className="setting-row">
              <span>
                <strong>Show manga spoilers</strong>
                <small>Includes Hakari, Naoya, Kenjaku, Yorozu, and Yuji.</small>
              </span>
              <input type="checkbox" checked={showManga} onChange={(event) => setShowManga(event.target.checked)} />
            </label>
            <div className="setting-row setting-row--static">
              <span>
                <strong>Mirrored preview</strong>
                <small>The display is mirrored; inference coordinates stay canonical.</small>
              </span>
              <button type="button" onClick={() => tracking.setMirror(!tracking.mirror)}>
                {tracking.mirror ? "On" : "Off"}
              </button>
            </div>
            <div className="sheet-note">
              <strong>Browser support</strong>
              <p>Best on current Chrome, Edge, and Safari over HTTPS. Camera access always requires your permission.</p>
            </div>
          </section>
        </div>
      )}

      {researchOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setResearchOpen(false)}>
          <section
            className="research-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <span className="eyebrow">Source ledger</span>
                <h2 id="research-title">Canon, interpretation, and limits</h2>
              </div>
              <button type="button" onClick={() => setResearchOpen(false)} aria-label="Close research panel" autoFocus>Close</button>
            </div>
            <p className="research-intro">
              Every shipped reference is a sourced canon panel or anime frame paired, where available, with an online mudra study. Religious attributions are labeled as common interpretations, not official canon.
            </p>
            <div className="source-list">
              {techniques.map((technique) => (
                <article key={technique.id}>
                  <div>
                    <strong>{technique.name}</strong>
                    <span>{technique.user} · confidence {technique.confidence.toLowerCase()}</span>
                  </div>
                  <div>
                    <a href={technique.sourceUrl} target="_blank" rel="noreferrer">Visual source</a>
                    <a href={technique.canonUrl} target="_blank" rel="noreferrer">Canon record</a>
                  </div>
                </article>
              ))}
            </div>
            <div className="research-notes">
              <h3>Excluded from pose training</h3>
              {researchNotes.map((note) => <p key={note}>{note}</p>)}
            </div>
            <div className="technical-sources">
              <a href="https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js" target="_blank" rel="noreferrer">Google Hand Landmarker Web guide</a>
              <a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia" target="_blank" rel="noreferrer">MDN camera privacy and security</a>
              <a href="https://jujutsu-kaisen.fandom.com/wiki/Domain_Expansion" target="_blank" rel="noreferrer">Domain Expansion canon roster</a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ReferenceFigure({ technique, compact = false }: { technique: Technique; compact?: boolean }) {
  return (
    <figure className={`reference-figure ${compact ? "is-compact" : ""}`}>
      <div className="reference-figure__image">
        <img src={technique.reference} alt={technique.referenceAlt} />
        <span>Reference from the web</span>
      </div>
      <figcaption>
        <span>{technique.sourceLabel}</span>
        <a href={technique.sourceUrl} target="_blank" rel="noreferrer">View source</a>
      </figcaption>
    </figure>
  );
}

function LearnPanel({ technique, onPractice }: { technique: Technique; onPractice: () => void }) {
  return (
    <div className="panel-content learn-panel">
      <ReferenceFigure technique={technique} />
      <div className="tag-row">
        <span>{trainingLabel(technique.trainingMode)}</span>
        <span>{difficultyLabel(technique.difficulty)}</span>
        <span>Confidence {technique.confidence}</span>
      </div>
      <p className="panel-summary">{technique.summary}</p>
      {technique.mudra && <p className="mudra-note">{technique.mudra}</p>}
      <ol className="instruction-list">
        {technique.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {technique.caveat && <div className="caveat-note"><strong>Recognition note</strong>{technique.caveat}</div>}
      {technique.hands > 0 ? (
        <button type="button" className="primary-action primary-action--wide" onClick={onPractice}>
          Practice this form
        </button>
      ) : (
        <div className="archive-notice">This canon activation is preserved as research and intentionally excluded from hand-shape scoring.</div>
      )}
    </div>
  );
}

function PracticePanel({
  technique,
  score,
  correction,
  handsDetected,
  modelStatus,
  delegate,
  personalized,
  profileCount,
  onPersonalize,
}: {
  technique: Technique;
  score: number;
  correction: string;
  handsDetected: number;
  modelStatus: string;
  delegate: "GPU" | "CPU" | null;
  personalized: boolean;
  profileCount: number;
  onPersonalize: () => void;
}) {
  return (
    <div className="panel-content practice-panel">
      <ReferenceFigure technique={technique} compact />
      <div className="coach-callout" aria-live="polite">
        <span>Current correction</span>
        <strong>{correction}</strong>
      </div>
      <div className="metric-grid">
        <div><span>Pose match</span><strong>{Math.round(score * 100)}%</strong></div>
        <div><span>Hands found</span><strong>{handsDetected} / {technique.hands}</strong></div>
        <div><span>Model</span><strong>{modelStatus === "ready" ? delegate ?? "Ready" : "Loading"}</strong></div>
        <div><span>Personalized</span><strong>{personalized ? `${profileCount} samples` : "Not yet"}</strong></div>
      </div>
      <div className="practice-tips">
        <h3>Form checklist</h3>
        {technique.steps.map((step, index) => (
          <p key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</p>
        ))}
      </div>
      <button type="button" className="secondary-action" onClick={onPersonalize}>
        {personalized ? "Improve my calibration" : "Personalize recognition"}
      </button>
    </div>
  );
}

function CalibrationPanel({
  technique,
  cameraActive,
  positiveCount,
  negativeCount,
  capture,
  onCapture,
  onExport,
  onImport,
  onReset,
  hasAnyProfiles,
}: {
  technique: Technique;
  cameraActive: boolean;
  positiveCount: number;
  negativeCount: number;
  capture: CaptureSession | null;
  onCapture: (kind: CalibrationClass) => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  hasAnyProfiles: boolean;
}) {
  const captureMessage = capture
    ? capture.countdown > 0
      ? `Get ready — ${capture.countdown}`
      : `Capturing ${capture.kind === "positive" ? "correct form" : "near miss"} · ${capture.added} frames`
    : null;

  return (
    <div className="panel-content calibration-panel">
      <ReferenceFigure technique={technique} compact />
      <div className="calibration-intro">
        <span className="eyebrow">Local KNN calibration</span>
        <h3>Teach recognition how your hands look.</h3>
        <p>Only normalized landmark vectors are saved. Canon pose rules remain in place, so a bad sample cannot redefine the reference.</p>
      </div>
      <div className="sample-meter">
        <div>
          <span>Correct form</span>
          <strong>{positiveCount}</strong>
          <i><b style={{ width: `${Math.min(100, (positiveCount / 45) * 100)}%` }} /></i>
        </div>
        <div>
          <span>Near misses</span>
          <strong>{negativeCount}</strong>
          <i><b style={{ width: `${Math.min(100, (negativeCount / 20) * 100)}%` }} /></i>
        </div>
      </div>
      {captureMessage && <div className="capture-status" role="status">{captureMessage}</div>}
      <div className="capture-actions">
        <button type="button" className="primary-action" onClick={() => onCapture("positive")} disabled={Boolean(capture)}>
          {cameraActive ? "Capture correct hold" : "Enable camera first"}
        </button>
        <button type="button" className="secondary-action" onClick={() => onCapture("negative")} disabled={Boolean(capture)}>
          Capture near miss
        </button>
      </div>
      <ol className="calibration-steps">
        <li><span>01</span>Capture the correct pose from the front.</li>
        <li><span>02</span>Repeat with a slight left or right wrist angle.</li>
        <li><span>03</span>Add a relaxed near-miss so the classifier learns when to reject.</li>
      </ol>
      <div className="data-actions">
        <button type="button" onClick={onExport} disabled={!hasAnyProfiles}>Export profile</button>
        <button type="button" onClick={onImport}>Import profile</button>
        <button type="button" onClick={onReset} disabled={!positiveCount && !negativeCount}>Reset this form</button>
      </div>
    </div>
  );
}
