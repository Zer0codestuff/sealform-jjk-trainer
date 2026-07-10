import type { PairRule, Technique } from "./techniques";

export type Landmark = { x: number; y: number; z: number };

export type TrackedHand = {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  handedness: "Left" | "Right" | "Unknown";
  confidence: number;
};

export type TrackingFrame = {
  timestamp: number;
  hands: TrackedHand[];
  inferenceMs?: number;
};

export type CalibrationClass = "positive" | "negative";

export type CalibrationProfile = {
  positive: number[][];
  negative: number[][];
  updatedAt: number;
};

export type CalibrationStore = Record<string, CalibrationProfile>;

export type PoseScore = {
  score: number;
  ruleScore: number;
  personalizedScore: number | null;
  correction: string;
  trackedHands: number;
};

export const FEATURE_VECTOR_LENGTH = 147;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const distance = (a: Landmark, b: Landmark) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.7);

const vector = (from: Landmark, to: Landmark) => ({
  x: to.x - from.x,
  y: to.y - from.y,
  z: to.z - from.z,
});

const angleAt = (a: Landmark, b: Landmark, c: Landmark) => {
  const ba = vector(b, a);
  const bc = vector(b, c);
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const aLength = Math.hypot(ba.x, ba.y, ba.z);
  const cLength = Math.hypot(bc.x, bc.y, bc.z);
  if (!aLength || !cLength) return 0;
  return Math.acos(clamp(dot / (aLength * cLength), -1, 1));
};

const fingerTriples = [
  [2, 3, 4],
  [5, 6, 8],
  [9, 10, 12],
  [13, 14, 16],
  [17, 18, 20],
] as const;

export function fingerOpenness(hand: TrackedHand) {
  return fingerTriples.map(([mcp, pip, tip], fingerIndex) => {
    const bendAngle = angleAt(hand.landmarks[mcp], hand.landmarks[pip], hand.landmarks[tip]);
    const angleScore = clamp((bendAngle - 0.65) / 2.15);
    const base = hand.landmarks[mcp];
    const reach = distance(base, hand.landmarks[tip]);
    const middleReach = Math.max(distance(base, hand.landmarks[pip]), 0.0001);
    const reachScore = clamp((reach / middleReach - 0.9) / 1.05);
    return fingerIndex === 0
      ? clamp(angleScore * 0.7 + reachScore * 0.3)
      : clamp(angleScore * 0.58 + reachScore * 0.42);
  });
}

const palmCenter = (hand: TrackedHand) => {
  const indices = [0, 5, 9, 13, 17];
  const total = indices.reduce(
    (sum, index) => ({
      x: sum.x + hand.landmarks[index].x,
      y: sum.y + hand.landmarks[index].y,
      z: sum.z + hand.landmarks[index].z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return { x: total.x / indices.length, y: total.y / indices.length, z: total.z / indices.length };
};

const palmScale = (hand: TrackedHand) =>
  Math.max(
    distance(hand.landmarks[5], hand.landmarks[17]),
    distance(hand.landmarks[0], hand.landmarks[9]),
    0.025,
  );

function sortedHands(hands: TrackedHand[]) {
  return [...hands].sort((left, right) => {
    const handednessRank = (label: TrackedHand["handedness"]) =>
      label === "Left" ? 0 : label === "Right" ? 1 : 2;
    const rankDelta = handednessRank(left.handedness) - handednessRank(right.handedness);
    if (rankDelta !== 0) return rankDelta;
    return palmCenter(left).x - palmCenter(right).x;
  });
}

export function extractFeatureVector(hands: TrackedHand[]) {
  const ordered = sortedHands(hands).slice(0, 2);
  const result: number[] = [];

  for (let slot = 0; slot < 2; slot += 1) {
    const hand = ordered[slot];
    if (!hand) {
      result.push(0);
      for (let index = 0; index < 21 * 3 + 5; index += 1) result.push(0);
      continue;
    }

    const source = hand.worldLandmarks.length === 21 ? hand.worldLandmarks : hand.landmarks;
    const originIndices = [0, 5, 9, 13, 17];
    const origin = originIndices.reduce(
      (sum, index) => ({
        x: sum.x + source[index].x,
        y: sum.y + source[index].y,
        z: sum.z + source[index].z,
      }),
      { x: 0, y: 0, z: 0 },
    );
    origin.x /= originIndices.length;
    origin.y /= originIndices.length;
    origin.z /= originIndices.length;

    const scale = Math.max(
      distance(source[5], source[17]),
      distance(source[0], source[9]),
      0.015,
    );
    result.push(1);
    for (const point of source) {
      result.push((point.x - origin.x) / scale, (point.y - origin.y) / scale, (point.z - origin.z) / scale);
    }
    result.push(...fingerOpenness(hand));
  }

  if (ordered.length === 2) {
    const leftCenter = palmCenter(ordered[0]);
    const rightCenter = palmCenter(ordered[1]);
    const scale = (palmScale(ordered[0]) + palmScale(ordered[1])) / 2;
    result.push(
      (rightCenter.x - leftCenter.x) / scale,
      (rightCenter.y - leftCenter.y) / scale,
      (rightCenter.z - leftCenter.z) / scale,
    );
    for (const tip of [4, 8, 12, 16, 20]) {
      result.push(distance(ordered[0].landmarks[tip], ordered[1].landmarks[tip]) / scale);
    }
  } else {
    result.push(0, 0, 0, 0, 0, 0, 0, 0);
  }

  result.push(ordered.length / 2);
  return result.map((value) => (Number.isFinite(value) ? Math.max(-8, Math.min(8, value)) : 0));
}

export function vectorDistance(a: number[], b: number[]) {
  if (a.length !== b.length || a.length !== FEATURE_VECTOR_LENGTH) {
    return Number.POSITIVE_INFINITY;
  }
  const length = a.length;
  let sum = 0;
  for (let index = 0; index < length; index += 1) {
    const delta = a[index] - b[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum / length);
}

export function isCalibrationStore(value: unknown): value is CalibrationStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((profile) => {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) return false;
    const candidate = profile as Partial<CalibrationProfile>;
    const validCollection = (collection: unknown) =>
      Array.isArray(collection) &&
      collection.length <= 120 &&
      collection.every(
        (sample) =>
          Array.isArray(sample) &&
          sample.length === FEATURE_VECTOR_LENGTH &&
          sample.every((entry) => typeof entry === "number" && Number.isFinite(entry) && Math.abs(entry) <= 8),
      );
    return (
      validCollection(candidate.positive) &&
      validCollection(candidate.negative) &&
      typeof candidate.updatedAt === "number" &&
      Number.isFinite(candidate.updatedAt)
    );
  });
}

function weightedKnn(vectorValue: number[], profile?: CalibrationProfile) {
  if (!profile || profile.positive.length < 5) return null;
  const candidates = [
    ...profile.positive.map((sample) => ({ label: 1, distance: vectorDistance(vectorValue, sample) })),
    ...profile.negative.map((sample) => ({ label: 0, distance: vectorDistance(vectorValue, sample) })),
  ]
    .filter((candidate) => Number.isFinite(candidate.distance))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, 7);

  if (!candidates.length) return null;
  let positiveWeight = 0;
  let totalWeight = 0;
  for (const candidate of candidates) {
    const weight = 1 / (candidate.distance * candidate.distance + 0.0025);
    positiveWeight += weight * candidate.label;
    totalWeight += weight;
  }

  const nearestPositive = candidates.find((candidate) => candidate.label === 1)?.distance ?? 1;
  const absoluteMatch = clamp(1 - nearestPositive / 0.62);
  const voteShare = positiveWeight / Math.max(totalWeight, 0.0001);
  return profile.negative.length >= 5
    ? clamp(voteShare * 0.72 + absoluteMatch * 0.28)
    : absoluteMatch;
}

function patternScore(technique: Technique, hands: TrackedHand[]) {
  if (!technique.patterns.length) return 0;
  const ordered = sortedHands(hands);
  const permutations = ordered.length === 2 ? [ordered, [ordered[1], ordered[0]]] : [ordered];

  return Math.max(
    ...permutations.map((arrangement) => {
      let total = 0;
      let count = 0;
      technique.patterns.forEach((pattern, handIndex) => {
        const hand = arrangement[handIndex];
        if (!hand) return;
        const openness = fingerOpenness(hand);
        pattern.forEach((expected, fingerIndex) => {
          if (expected === -1) return;
          total += 1 - Math.abs(expected - openness[fingerIndex]);
          count += 1;
        });
      });
      return count ? total / count : 0;
    }),
  );
}

function spatialScore(rule: PairRule, hands: TrackedHand[]) {
  if (!hands.length) return 0;
  if (rule === "none") return 1;
  const ordered = sortedHands(hands);
  const first = ordered[0];
  const scale = palmScale(first);

  if (rule === "single-cross") {
    const tipGap = distance(first.landmarks[8], first.landmarks[12]) / scale;
    const indexVertical = clamp(
      1 - Math.abs(first.landmarks[8].x - first.landmarks[5].x) / Math.max(scale * 0.65, 0.001),
    );
    const crossedHeight = clamp(
      1 - Math.abs(first.landmarks[12].y - first.landmarks[7].y) / Math.max(scale * 0.8, 0.001),
    );
    return clamp(
      (1 - Math.abs(tipGap - 0.34) / 0.7) * 0.45 + indexVertical * 0.3 + crossedHeight * 0.25,
    );
  }
  if (ordered.length < 2) return 0;

  const second = ordered[1];
  const averageScale = (scale + palmScale(second)) / 2;
  const centers = distance(palmCenter(first), palmCenter(second)) / averageScale;
  const matchingTipGap = [4, 8, 12, 16, 20].reduce(
    (sum, tip) => sum + distance(first.landmarks[tip], second.landmarks[tip]) / averageScale,
    0,
  ) / 5;
  const middleGap = distance(first.landmarks[12], second.landmarks[12]) / averageScale;

  switch (rule) {
    case "roof":
      return clamp(1 - Math.abs(matchingTipGap - 0.8) / 1.5);
    case "mountain":
      return clamp(1 - Math.abs(centers - 1.15) / 1.25);
    case "interlocked":
      return clamp(1 - Math.abs(centers - 0.95) / 1.05);
    case "reverse-prayer":
      return clamp(
        (1 - Math.abs(centers - 1.0) / 0.95) * 0.45 +
          (1 - Math.abs(matchingTipGap - 0.72) / 1.1) * 0.35 +
          (1 - Math.abs(middleGap - 0.42) / 0.75) * 0.2,
      );
    case "middle-spires":
      return clamp(1 - Math.abs(middleGap - 0.35) / 0.8);
    case "stacked": {
      const firstCenter = palmCenter(first);
      const secondCenter = palmCenter(second);
      const verticalGap = Math.abs(firstCenter.y - secondCenter.y) / averageScale;
      return clamp(1 - Math.abs(verticalGap - 1.2) / 1.4);
    }
    case "crossed": {
      const firstCenter = palmCenter(first);
      const secondCenter = palmCenter(second);
      const verticalGap = Math.abs(firstCenter.y - secondCenter.y) / averageScale;
      return clamp(centers / 2.6) * clamp(1 - verticalGap / 2.5);
    }
    default:
      return 0.5;
  }
}

function chooseCorrection(technique: Technique, hands: TrackedHand[], ruleScore: number) {
  if (hands.length < technique.hands) {
    const missing = technique.hands - hands.length;
    if (technique.hands === 1) return "Bring one hand fully into frame.";
    return missing === 1 ? "Bring the second hand fully into frame." : "Bring both hands fully into frame.";
  }
  if (hands.length > technique.hands && technique.hands > 0) return "Keep only the required hands inside the guide.";
  if (ruleScore > technique.threshold) return `Hold the form for ${Math.round(technique.holdMs / 100) / 10} seconds.`;
  const progress = clamp(ruleScore / Math.max(technique.threshold, 0.01));
  const index = Math.min(technique.coach.length - 1, Math.floor((1 - progress) * technique.coach.length));
  return technique.coach[Math.max(0, index)] ?? "Match the reference silhouette.";
}

export function scorePose(
  technique: Technique,
  hands: TrackedHand[],
  profile?: CalibrationProfile,
): PoseScore {
  if (technique.hands === 0) {
    return {
      score: 0,
      ruleScore: 0,
      personalizedScore: null,
      correction: technique.coach[0] ?? "Reference-only entry.",
      trackedHands: hands.length,
    };
  }

  const handCountScore = hands.length === technique.hands ? 1 : clamp(hands.length / technique.hands) * 0.35;
  const fingers = hands.length ? patternScore(technique, hands) : 0;
  const spatial = hands.length ? spatialScore(technique.pairRule, hands) : 0;
  // MediaPipe exposes handedness classification confidence here, not landmark
  // quality. Do not penalize an otherwise valid pose when crossed hands make
  // left/right classification ambiguous.
  const trackingQuality = hands.length ? 1 : 0;
  const ruleScore = clamp(
    handCountScore * 0.24 + fingers * 0.46 + spatial * 0.22 + trackingQuality * 0.08,
  );
  const personalized = hands.length === technique.hands
    ? weightedKnn(extractFeatureVector(hands), profile)
    : null;
  const score = personalized === null
    ? ruleScore
    : clamp(ruleScore * 0.58 + personalized * 0.42);

  return {
    score,
    ruleScore,
    personalizedScore: personalized,
    correction: chooseCorrection(technique, hands, score),
    trackedHands: hands.length,
  };
}

export function addCalibrationSample(
  profile: CalibrationProfile | undefined,
  kind: CalibrationClass,
  sample: number[],
) {
  const current: CalibrationProfile = profile
    ? {
        positive: [...profile.positive],
        negative: [...profile.negative],
        updatedAt: Date.now(),
      }
    : { positive: [], negative: [], updatedAt: Date.now() };
  const collection = current[kind];
  const closest = collection.reduce(
    (minimum, candidate) => Math.min(minimum, vectorDistance(candidate, sample)),
    Number.POSITIVE_INFINITY,
  );
  if (closest > 0.012 || collection.length < 3) collection.push(sample);
  if (collection.length > 120) collection.splice(0, collection.length - 120);
  return current;
}
