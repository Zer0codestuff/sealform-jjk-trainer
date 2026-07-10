export type TrainingMode = "strict" | "relaxed" | "sequence" | "motion" | "archive";
export type SpoilerTier = "anime" | "manga";
export type PairRule =
  | "single-cross"
  | "roof"
  | "mountain"
  | "interlocked"
  | "stacked"
  | "crossed"
  | "reverse-prayer"
  | "middle-spires"
  | "none";

export type FingerPattern = [
  thumb: 0 | 1 | -1,
  index: 0 | 1 | -1,
  middle: 0 | 1 | -1,
  ring: 0 | 1 | -1,
  little: 0 | 1 | -1,
];

export type Technique = {
  id: string;
  name: string;
  user: string;
  japanese?: string;
  spoiler: SpoilerTier;
  trainingMode: TrainingMode;
  hands: 0 | 1 | 2;
  difficulty: 1 | 2 | 3;
  confidence: "High" | "Medium" | "Limited";
  reference: string;
  referenceAlt: string;
  sourceUrl: string;
  sourceLabel: string;
  canonUrl: string;
  mudra?: string;
  summary: string;
  steps: string[];
  coach: string[];
  caveat?: string;
  mirrorAllowed: boolean;
  holdMs: number;
  threshold: number;
  patterns: FingerPattern[];
  pairRule: PairRule;
  accent: string;
};

const HAND_STUDY_SOURCE =
  "https://tempenensis.tumblr.com/post/683098294145171456/a-brief-look-into-the-hand-seals-%E5%8D%B0-of-domain";
const LATER_STUDY_SOURCE =
  "https://tempenensis.tumblr.com/post/702155396636459008/14-kenjaku-domain-womb-profusion-%E8%83%8E%E8%94%B5%E5%81%8F%E9%87%8E-taizou";

export const techniques: Technique[] = [
  {
    id: "unlimited-void",
    name: "Unlimited Void",
    user: "Satoru Gojo",
    japanese: "Muryōkūsho",
    spoiler: "anime",
    trainingMode: "strict",
    hands: 1,
    difficulty: 1,
    confidence: "High",
    reference: "/references/unlimited-void.png",
    referenceAlt:
      "Canon panel and mudra study: one upright hand with the middle finger crossing behind the index, while the ring and little fingers curl under the thumb.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon panel + Taishakuten seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Unlimited_Void",
    mudra: "Commonly linked to Taishakuten / Śakra",
    summary:
      "A compact one-hand seal. The silhouette is easy; the crossed upper fingers are the detail that makes it recognizable.",
    steps: [
      "Raise one hand beside your face with the palm turned slightly inward.",
      "Point the index finger straight up and hook the middle finger across and behind it.",
      "Curl the ring and little fingers into the palm, then pin them gently with the thumb.",
    ],
    coach: [
      "Keep the index finger vertical.",
      "Cross the middle finger closer behind the index.",
      "Curl the two lower fingers fully into the palm.",
    ],
    mirrorAllowed: true,
    holdMs: 900,
    threshold: 0.78,
    patterns: [[0, 1, 1, 0, 0]],
    pairRule: "single-cross",
    accent: "#8da8ff",
  },
  {
    id: "malevolent-shrine",
    name: "Malevolent Shrine",
    user: "Ryomen Sukuna",
    japanese: "Fukuma Mizushi",
    spoiler: "anime",
    trainingMode: "strict",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/malevolent-shrine.png",
    referenceAlt:
      "Canon panel and Enma palm-sign study: two hands face each other, index and little fingers folded, middle and ring fingers extended into a peaked roof.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon panel + Enma palm-sign study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Malevolent_Shrine",
    mudra: "Enmaten no Shōin — the Enma palm sign",
    summary:
      "A two-hand roof built from the middle and ring fingers, with the index and little fingers folded inward.",
    steps: [
      "Hold both hands at chest height with the palms facing one another.",
      "Fold each index and little finger inward; keep both middle and ring fingers extended.",
      "Meet the matching extended fingertips to form a narrow triangular roof and keep the thumbs low.",
    ],
    coach: [
      "Fold both index and little fingers inward.",
      "Lift the middle and ring fingers into a clean roof.",
      "Bring the two hands closer without flattening the peak.",
    ],
    mirrorAllowed: true,
    holdMs: 1050,
    threshold: 0.75,
    patterns: [
      [0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0],
    ],
    pairRule: "roof",
    accent: "#f06e55",
  },
  {
    id: "coffin-iron-mountain",
    name: "Coffin of the Iron Mountain",
    user: "Jogo",
    japanese: "Gaikan Tecchisen",
    spoiler: "anime",
    trainingMode: "strict",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/coffin-iron-mountain.png",
    referenceAlt:
      "Canon panel and Daikokuten seal study: both hands build a central mountain with bent inner fingers while the ring and little fingers rise at the outer edges.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon panel + Daikokuten seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Coffin_of_the_Iron_Mountain",
    mudra: "Commonly linked to Daikokuten",
    summary:
      "The inner fingers weave into a small peak while the outer ring and little fingers create the four-pronged silhouette.",
    steps: [
      "Center both hands with the palms facing inward and wrists nearly touching.",
      "Bend the thumbs, index fingers, and middle fingers into the central mountain shape.",
      "Extend the ring and little fingers upward and slightly outward on both sides.",
    ],
    coach: [
      "Build the small central peak first.",
      "Straighten the four outer fingers.",
      "Keep the wrists centered and close together.",
    ],
    mirrorAllowed: true,
    holdMs: 1100,
    threshold: 0.72,
    patterns: [
      [0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1],
    ],
    pairRule: "mountain",
    accent: "#ed8a42",
  },
  {
    id: "chimera-shadow-garden",
    name: "Chimera Shadow Garden",
    user: "Megumi Fushiguro",
    japanese: "Kangō An'eitei",
    spoiler: "anime",
    trainingMode: "relaxed",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/chimera-shadow-garden.png",
    referenceAlt:
      "Canon panel and hand-seal study: the eight non-thumb fingers interlace into a rounded high cage while the thumbs rise inside the opening.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon panel + Yakushi Nyorai seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Chimera_Shadow_Garden",
    mudra: "Commonly linked to Yakushi Nyorai",
    summary:
      "An interlocked cage. Camera scoring is intentionally forgiving because several finger joints are hidden from view.",
    steps: [
      "Face both palms inward and alternately interlace the four non-thumb fingers.",
      "Bend the interlaced fingers at their middle joints to make a rounded high cage.",
      "Let both thumbs project upward and inward inside the opening.",
    ],
    coach: [
      "Interlace the fingers more evenly.",
      "Round the top of the cage instead of flattening it.",
      "Lift both thumbs into the center.",
    ],
    mirrorAllowed: true,
    holdMs: 1200,
    threshold: 0.67,
    patterns: [
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ],
    pairRule: "interlocked",
    accent: "#7d87a5",
  },
  {
    id: "self-embodiment",
    name: "Self-Embodiment of Perfection",
    user: "Mahito",
    japanese: "Jihei Endonka",
    spoiler: "anime",
    trainingMode: "sequence",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/self-embodiment.png",
    referenceAlt:
      "Canon and ritual study showing two separate pairs of miniature hands inside Mahito's mouth forming simultaneous interwoven seals.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon four-hand seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Self-Embodiment_of_Perfection",
    mudra: "A canon four-hand combination",
    summary:
      "Canonically formed by four miniature hands. SEALFORM teaches a clearly labeled two-stage solo adaptation, not a literal recreation.",
    steps: [
      "Stage one: cross and weave the index, middle, and ring fingers into the upper X-like seal.",
      "Stage two: interlock the middle fingers while extending both thumbs and little fingers outward.",
      "Practice the two stages separately; the canon version performs them at the same time with four hands.",
    ],
    coach: [
      "Treat this as a two-stage sequence.",
      "Keep the interlocked center compact.",
      "Extend the outer thumb and little-finger points.",
    ],
    caveat: "Solo adaptation — canon requires four miniature hands.",
    mirrorAllowed: true,
    holdMs: 1300,
    threshold: 0.64,
    patterns: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    pairRule: "interlocked",
    accent: "#99b9c8",
  },
  {
    id: "yuta-domain",
    name: "Unrevealed Domain",
    user: "Yuta Okkotsu",
    spoiler: "anime",
    trainingMode: "strict",
    hands: 2,
    difficulty: 2,
    confidence: "High",
    reference: "/references/authentic-mutual-love.png",
    referenceAlt:
      "Sendai canon panel and Dakini seal study: one hand is a fist near the chest while the other presents four upright fingers with the thumb curled.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Sendai canon panel + Dakini seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Authentic_Mutual_Love",
    mudra: "Commonly linked to Dakini",
    summary:
      "The anime-safe lesson uses Yuta's Sendai activation pose and keeps the later domain name hidden.",
    steps: [
      "Close one hand into a compact fist and hold it close to the sternum.",
      "Present the opposite hand forward with index, middle, ring, and little fingers raised together.",
      "Curl the presented thumb and keep the open hand slightly above the fist.",
    ],
    coach: [
      "Close the lower hand into a firmer fist.",
      "Keep four fingers together on the presented hand.",
      "Stack the open hand just above the fist.",
    ],
    mirrorAllowed: true,
    holdMs: 900,
    threshold: 0.76,
    patterns: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
    ],
    pairRule: "stacked",
    accent: "#d6c7b6",
  },
  {
    id: "uro-domain",
    name: "Unnamed Domain",
    user: "Takako Uro",
    spoiler: "anime",
    trainingMode: "relaxed",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/uro-unnamed-domain.png",
    referenceAlt:
      "Sendai canon panel and seal study: forearms cross in an X while each hand keeps three middle fingers extended and hooks the thumb toward the little finger.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Sendai canon panel + hand-seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Takako_Uro",
    mudra: "The domain's name and effect remain unrevealed",
    summary:
      "This is a hand-and-arm pose. SEALFORM scores the fingers, but the strong X made by the forearms is part of the reference.",
    steps: [
      "Cross both forearms into a clean X in front of the chest.",
      "Keep index, middle, and ring fingers extended on each hand.",
      "Hook each thumb toward its little finger to close the outer base of the hand shape.",
    ],
    coach: [
      "Cross the forearms into a stronger X.",
      "Straighten the three middle fingers on each hand.",
      "Hook each thumb toward the little finger.",
    ],
    caveat: "Full grading benefits from upper-body pose tracking; hand score is marked relaxed.",
    mirrorAllowed: true,
    holdMs: 1000,
    threshold: 0.66,
    patterns: [
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
    ],
    pairRule: "crossed",
    accent: "#93bac8",
  },
  {
    id: "ryu-domain",
    name: "Unnamed Domain",
    user: "Ryu Ishigori",
    spoiler: "anime",
    trainingMode: "relaxed",
    hands: 2,
    difficulty: 3,
    confidence: "Medium",
    reference: "/references/ryu-unnamed-domain.png",
    referenceAlt:
      "Sendai canon panel and hand-seal study: a compact clasp near the chin with opposing thumbs and little fingers touching and the central fingers interwoven.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Sendai canon panel + hand-seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Ryu_Ishigori",
    mudra: "The domain's name and effect remain unrevealed",
    summary:
      "A dense clasp with several hidden joints. Recognition prioritizes the endpoint contacts and overall silhouette.",
    steps: [
      "Bring both hands into a compact clasp just below the mouth.",
      "Touch the opposing thumb pads and opposing little-finger pads.",
      "Bend and interweave the index, middle, and ring fingers inside the clasp.",
    ],
    coach: [
      "Move the clasp closer to the chin.",
      "Connect the matching thumb and little-finger pads.",
      "Keep the three central fingers bent and interwoven.",
    ],
    caveat: "Several contacts are self-occluded; use Personalize recognition for your camera angle.",
    mirrorAllowed: true,
    holdMs: 1100,
    threshold: 0.64,
    patterns: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    pairRule: "interlocked",
    accent: "#c6a37f",
  },
  {
    id: "idle-death-gamble",
    name: "Idle Death Gamble",
    user: "Kinji Hakari",
    japanese: "Zasatsu Bakuto",
    spoiler: "manga",
    trainingMode: "strict",
    hands: 2,
    difficulty: 2,
    confidence: "High",
    reference: "/references/idle-death-gamble.png",
    referenceAlt:
      "Canon panel and Benzaiten seal study: the upper hand makes an OK ring while the lower hand lies open and palm-up beneath it.",
    sourceUrl: HAND_STUDY_SOURCE,
    sourceLabel: "Canon panel + Benzaiten seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Idle_Death_Gamble",
    mudra: "Commonly linked to Benzaiten",
    summary:
      "An offset two-hand seal: a small thumb-index ring floats above an open palm.",
    steps: [
      "Hold one hand above and touch its thumb to index finger to form an OK ring.",
      "Keep the upper middle, ring, and little fingers relaxed and extended.",
      "Place the other hand below, open and palm-up, with its fingers together.",
    ],
    coach: [
      "Close the thumb-index ring on the upper hand.",
      "Flatten the lower palm and keep its fingers together.",
      "Create a little more vertical space between the hands.",
    ],
    mirrorAllowed: true,
    holdMs: 900,
    threshold: 0.75,
    patterns: [
      [1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1],
    ],
    pairRule: "stacked",
    accent: "#d7d363",
  },
  {
    id: "time-cell-moon-palace",
    name: "Time Cell Moon Palace",
    user: "Naoya Zenin",
    japanese: "Jihō Gekkyūden",
    spoiler: "manga",
    trainingMode: "relaxed",
    hands: 2,
    difficulty: 3,
    confidence: "Medium",
    reference: "/references/time-cell-moon-palace.png",
    referenceAlt:
      "Canon panel and Ucchusma seal study: two hands angle downward into a symmetrical insect-like diamond with the middle and ring fingers interlaced.",
    sourceUrl: LATER_STUDY_SOURCE,
    sourceLabel: "Canon panel + Ucchusma seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Time_Cell_Moon_Palace",
    mudra: "Commonly linked to the Ucchusma seal",
    summary:
      "A low, downward-facing and highly occluded seal. Symmetry and orientation matter more than any single hidden joint.",
    steps: [
      "Hold both hands low at the abdomen and angle the joined shape downward.",
      "Alternately interlace the middle and ring fingers at the center.",
      "Use the remaining digits to make a symmetrical diamond with the lowest pair pointing down.",
    ],
    coach: [
      "Rotate the joined hands downward.",
      "Center the interlaced middle and ring fingers.",
      "Make the outer diamond more symmetrical.",
    ],
    caveat: "Hidden joints are graded with relaxed tolerance.",
    mirrorAllowed: true,
    holdMs: 1200,
    threshold: 0.63,
    patterns: [
      [-1, -1, 0, 0, -1],
      [-1, -1, 0, 0, -1],
    ],
    pairRule: "interlocked",
    accent: "#b5a4cf",
  },
  {
    id: "womb-profusion",
    name: "Womb Profusion",
    user: "Kenjaku",
    japanese: "Taizō Hen'ya",
    spoiler: "manga",
    trainingMode: "strict",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/womb-profusion.png",
    referenceAlt:
      "Canon panel and reverse-prayer study: the backs of the hands meet, fingers weave across the opposite hand, and the thumbs point downward into a lower diamond.",
    sourceUrl: LATER_STUDY_SOURCE,
    sourceLabel: "Canon panel + honshō gasshō study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Womb_Profusion",
    mudra: "Honshō gasshō — a reverse interlaced prayer",
    summary:
      "The easy mistake is a normal prayer. Here the backs of the hands face each other and the fingers weave across the opposite hand.",
    steps: [
      "Bring both hands vertically to the chest with the backs of the hands facing and touching each other.",
      "Weave each set of fingers across the opposite hand rather than pressing the palms together.",
      "Point and meet the thumbs low to create the small lower teardrop or diamond.",
    ],
    coach: [
      "Turn the backs of the hands toward each other.",
      "Weave the fingers across the opposite hand.",
      "Bring the thumbs down into the lower diamond.",
    ],
    mirrorAllowed: true,
    holdMs: 1200,
    threshold: 0.7,
    patterns: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
    pairRule: "reverse-prayer",
    accent: "#c28d79",
  },
  {
    id: "threefold-affliction",
    name: "Threefold Affliction",
    user: "Yorozu",
    japanese: "Shikkushikku Shikku",
    spoiler: "manga",
    trainingMode: "relaxed",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/threefold-affliction.png",
    referenceAlt:
      "Canon panel and Jizō seal study: the hands interlock above while both middle fingers extend downward and meet at their pads.",
    sourceUrl:
      "https://tempenensis.tumblr.com/post/714189552665985024/15-yorozu-domain-threefold-affection-%E4%B8%89%E9%87%8D%E7%96%BE%E8%8B%A6",
    sourceLabel: "Canon panel + Jizō-bosatsu seal study",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Threefold_Affliction",
    mudra: "Commonly linked to Jizō-bosatsu",
    summary:
      "Most fingers form a woven crown while the two middle fingers create a single downward point.",
    steps: [
      "Interlock both hands centrally with the palms facing inward.",
      "Alternately fold and weave the index, ring, and little fingers above the center.",
      "Straighten both middle fingers downward and meet their pads or tips.",
    ],
    coach: [
      "Turn the joined shape downward.",
      "Keep the woven fingers above the center.",
      "Straighten and meet the two middle fingers below.",
    ],
    mirrorAllowed: true,
    holdMs: 1200,
    threshold: 0.64,
    patterns: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    pairRule: "middle-spires",
    accent: "#c9a8b6",
  },
  {
    id: "yuji-domain",
    name: "Unnamed Domain",
    user: "Yuji Itadori",
    spoiler: "manga",
    trainingMode: "strict",
    hands: 2,
    difficulty: 3,
    confidence: "High",
    reference: "/references/yuji-unnamed-domain.png",
    referenceAlt:
      "Canon chapter panel and Buddhist seal comparison: index, ring, and little fingers interlace while both middle fingers stand straight with a visible gap between their tips.",
    sourceUrl:
      "https://tempenensis.tumblr.com/post/757385612835815424/the-seal-of-yuujis-domain-expansion-seemed-to-be",
    sourceLabel: "Canon chapter panel + Acala seal comparison",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Domain_Expansion",
    mudra: "Often interpreted as an Acala or Kṣitigarbha-related seal",
    summary:
      "Both middle fingers rise in parallel but do not touch. The manga never gives this domain an official name.",
    steps: [
      "Turn the palms inward and interlace the index, ring, and little fingers.",
      "Tuck or overlap the thumbs at the base of the joined hands.",
      "Straighten both middle fingers vertically and leave a narrow visible gap between their tips.",
    ],
    coach: [
      "Interlace the lower fingers more tightly.",
      "Straighten both middle fingers.",
      "Keep a narrow gap between the middle fingertips.",
    ],
    caveat: "No fan-created domain name is used.",
    mirrorAllowed: true,
    holdMs: 1100,
    threshold: 0.7,
    patterns: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    pairRule: "middle-spires",
    accent: "#e07a5f",
  },
  {
    id: "dagon-domain",
    name: "Horizon of the Captivating Skandha",
    user: "Dagon",
    spoiler: "anime",
    trainingMode: "archive",
    hands: 0,
    difficulty: 1,
    confidence: "High",
    reference: "/references/horizon-captivating-skandha.webp",
    referenceAlt:
      "Anime frame showing the tied treasure-bag-like cursed seal drawn on Dagon's abdomen after his fingers were damaged.",
    sourceUrl: "https://jujutsu-kaisen.fandom.com/wiki/Horizon_of_the_Captivating_Skandha",
    sourceLabel: "Anime activation frame",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Horizon_of_the_Captivating_Skandha",
    summary:
      "Dagon activates through a drawn cursed seal on his abdomen after his fingers are damaged. A webcam hand pose would be invented, so this entry is reference-only.",
    steps: [
      "Study the tied-pouch-like cursed seal shown in the reference.",
      "Do not substitute a fan-made hand pose for this activation.",
    ],
    coach: ["Reference-only activation — no reproducible hand sign is shown."],
    caveat: "Reference-only: drawn sigil, not a hand pose.",
    mirrorAllowed: false,
    holdMs: 0,
    threshold: 1,
    patterns: [],
    pairRule: "none",
    accent: "#6aa5ad",
  },
  {
    id: "deadly-sentencing",
    name: "Deadly Sentencing",
    user: "Hiromi Higuruma",
    japanese: "Chūbuku Shishi",
    spoiler: "anime",
    trainingMode: "motion",
    hands: 0,
    difficulty: 1,
    confidence: "High",
    reference: "/references/deadly-sentencing.webp",
    referenceAlt:
      "Canon manga panel of Deadly Sentencing; Higuruma uses a raised and downward-swung gavel signal rather than a finger mudra.",
    sourceUrl: "https://jujutsu-kaisen.fandom.com/wiki/Deadly_Sentencing",
    sourceLabel: "Canon domain panel",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Deadly_Sentencing",
    summary:
      "Higuruma uses a gavel motion rather than a documented finger mudra. It belongs in a future full-body motion lesson, not hand-shape scoring.",
    steps: [
      "Raise an imaginary gavel with a neutral wrist.",
      "Drive the hand downward in one controlled strike.",
      "No physical prop is required or recommended.",
    ],
    coach: ["Motion-only activation — finger-pose grading is intentionally disabled."],
    caveat: "Motion lesson planned; no finger mudra.",
    mirrorAllowed: true,
    holdMs: 0,
    threshold: 1,
    patterns: [],
    pairRule: "none",
    accent: "#a89175",
  },
  {
    id: "smallpox-domain",
    name: "Unnamed Graveyard Domain",
    user: "Smallpox Deity",
    spoiler: "anime",
    trainingMode: "archive",
    hands: 0,
    difficulty: 1,
    confidence: "Limited",
    reference: "/references/smallpox-deity.webp",
    referenceAlt:
      "Canon character reference of the Smallpox Deity. The distinct Domain Expansion finger topology is not documented clearly enough for strict reproduction.",
    sourceUrl: "https://jujutsu-kaisen.fandom.com/wiki/Smallpox_Deity",
    sourceLabel: "Canon character and ability reference",
    canonUrl: "https://jujutsu-kaisen.fandom.com/wiki/Smallpox_Deity",
    summary:
      "A finger signal exists, but reliable references do not expose its topology clearly. The later fist-into-palm gravestone motion is a different technique.",
    steps: [
      "Do not train the fist-into-palm gravestone motion as the domain sign.",
      "This entry stays in the archive until a clear canonical view can be annotated.",
    ],
    coach: ["Archive-only — the domain sign is not documented clearly enough."],
    caveat: "The commonly copied fist/palm motion belongs to a later gravestone technique.",
    mirrorAllowed: false,
    holdMs: 0,
    threshold: 1,
    patterns: [],
    pairRule: "none",
    accent: "#879f92",
  },
];

export const cameraTechniques = techniques.filter(
  (technique) => technique.trainingMode !== "archive" && technique.trainingMode !== "motion",
);

export const researchNotes = [
  "Hanami begins a Domain Expansion, but its hand sign is interrupted and never shown in the manga or anime.",
  "Yuki Tsukumo is confirmed capable of Domain Expansion, but its name, environment, and activation sign are never shown.",
  "Yuta later performs Unlimited Void while using Gojo's body; that reuses Gojo's lesson rather than creating a new pose.",
];
