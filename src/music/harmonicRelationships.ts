/*
  Harmonic Relationships — theory-engine skeleton

  Purpose:
  - shared foundation for Material -> Explore -> Analyze -> Relationships
  - no UI dependencies
  - no tension score
  - objective harmonic facts first; interpretation comes later

  Important design rule:
  pitch identity and harmonic function are separate.
*/

import {
  CHORDS,
  CHROMATIC_NOTES,
  SCALES,
} from "./musicData";

import {
  getChordFormulaLabels,
  getNoteIndex,
  spellChordNotes,
  spellScaleNotes,
} from "./musicUtils";

export type PitchName = string;
export type PitchClass = number;

export type HarmonicRole =
  | "chord-tone"
  | "extension"
  | "alteration"
  | "chromatic";

export type ToneSource =
  | "chord"
  | "added";

export type HarmonicFunction = {
  /** 0..11 semitone class from the event root */
  intervalClass: number;

  /**
   * Musical function label.
   * Examples: R, b3, 3, 5, b7, 7, 9, #11, 13.
   *
   * This must remain separate from intervalClass because the same
   * pitch class can legitimately be named b5, #11, 6 or 13 depending
   * on the harmonic context.
   */
  label: string;

  role: HarmonicRole;
};

export type EventTone = {
  pitch: PitchName;
  pitchClass: PitchClass;
  source: ToneSource;
  function: HarmonicFunction;
};

export type AddedToneInput = {
  /** Absolute pitch name, e.g. "F#" */
  pitch: PitchName;

  /** Contextual function supplied by the harmonic model, e.g. "#11" */
  functionLabel: string;

  role?: Extract<HarmonicRole, "extension" | "alteration" | "chromatic">;
};

export type ScalePitchFunction = {
  pitch: PitchName;
  pitchClass: PitchClass;
  intervalClass: number;
  label: string;
};

export type ScaleContext = {
  root: PitchName;
  scaleName: string;
  intervals: readonly number[];
  notes: PitchName[];
  pitchClasses: PitchClass[];

  /**
   * Functions of the currently selected/important pitches relative
   * to this scale root. These are scale-degree functions, not chord
   * functions.
   */
  selectedPitchFunctions: ScalePitchFunction[];
};

export type ScaleContextRelationship = {
  context: ScaleContext;

  /**
   * Comparison against the closest compatible scale context of the
   * current/source event.
   */
  closestCurrentContext?: ScaleContext;

  sharedPitchClasses: PitchClass[];
  addedPitchClasses: PitchClass[];
  removedPitchClasses: PitchClass[];

  /**
   * Number of collection substitutions/additions/removals.
   * For equal-size seven-note collections, replacing one pitch gives
   * a distance of 1 rather than 2.
   */
  distanceFromCurrent?: number;
};

export type HarmonicEvent = {
  id: string;

  root: PitchName;
  chordName: string;

  /**
   * The base harmony remains identifiable even when exploratory
   * tones are added.
   */
  chordIntervals: readonly number[];
  chordTones: EventTone[];
  addedTones: EventTone[];

  scaleContext?: ScaleContext;

  /**
   * Reserved for later progression/rhythm work.
   * No timing logic uses this yet.
   */
  duration?: number;
};

export type HarmonicProgression = {
  id: string;
  name?: string;
  events: HarmonicEvent[];
};

export type PitchIntent =
  | "hold"
  | "free"
  | "resolve"
  | "add";

export type PitchConstraint = {
  pitch: PitchName;
  intent: PitchIntent;

  targetPitch?: PitchName;
  preferredDirection?: "up" | "down" | "either";
};

export type FunctionChange = {
  pitch: PitchName;
  pitchClass: PitchClass;
  from?: HarmonicFunction;
  to?: HarmonicFunction;
};

export type VoiceMovement = {
  fromPitch: PitchName;
  toPitch: PitchName;

  semitoneDistance: number;
  direction: "up" | "down" | "same";

  fromFunction?: HarmonicFunction;
  toFunction?: HarmonicFunction;
};

export type EventRelationshipMetrics = {
  commonToneCount: number;
  addedToneCount: number;
  removedToneCount: number;

  /**
   * Objective pitch-set distance:
   * notes removed + notes added.
   *
   * This is NOT a tension score.
   */
  pitchSetDistance: number;
};

export type EventRelationship = {
  fromEventId: string;
  toEventId: string;

  sharedTones: EventTone[];
  addedTones: EventTone[];
  removedTones: EventTone[];

  functionChanges: FunctionChange[];

  metrics: EventRelationshipMetrics;
};

export type PitchAppearance = {
  eventId: string;
  eventRoot: PitchName;
  chordName: string;

  tone: EventTone | null;
};

export type PitchJourney = {
  pitch: PitchName;
  pitchClass: PitchClass;
  appearances: PitchAppearance[];
};

export type FunctionalDistanceSummary = {
  sameFunctionCount: number;
  sameRoleCount: number;
  roleChangeCount: number;

  /**
   * Objective weighted total across preserved/shared pitches:
   *
   * 0 = same function
   * 1 = function changed but role category stayed the same
   * 2 = chord-tone <-> extension
   * 3 = alteration/chromatic category involved
   *
   * This is NOT a tension score.
   */
  total: number;

  /**
   * Normalized value per shared pitch, useful when candidates preserve
   * different numbers of tones.
   */
  average: number;
};

export type HarmonicCandidateMetrics = {
  commonToneCount: number;
  pitchSetDistance: number;

  /**
   * Harmonic reinterpretation of the pitches that stay physically
   * unchanged. Kept independent from pitch-set distance.
   */
  functionalDistance: FunctionalDistanceSummary;

  /**
   * Placeholder for later voicing-aware calculation.
   * It should only be populated when actual voices/fretboard positions
   * are available.
   */
  totalVoiceMovement?: number;

  scaleContextDistance?: number;
};

export type HarmonicCandidate = {
  event: HarmonicEvent;

  preservedPitches: PitchName[];
  addedPitches: PitchName[];
  removedPitches: PitchName[];

  functionChanges: FunctionChange[];
  voiceMovements: VoiceMovement[];

  compatibleScaleContexts: ScaleContextRelationship[];

  metrics: HarmonicCandidateMetrics;
};

export type RelationshipChordDefinition = {
  name: string;
  intervals: readonly number[];
  source: "app-library" | "relationship-supplement";
};

/**
 * Relationship-only chord qualities can live here without changing the
 * existing chord dropdown/UI yet.
 *
 * Major 6/9 is included because it is an important result in our first
 * validation path: Cmaj7 + F# -> Em9 -> D6/9.
 */
export const RELATIONSHIP_SUPPLEMENTAL_CHORDS = {
  "Major 6/9": [0, 2, 4, 7, 9],
} as const;

export type CandidateGenerationOptions = {
  /**
   * Maximum number of ranked results returned.
   * Defaults to 24.
   */
  limit?: number;

  /**
   * Include relationship-only chord qualities in addition to CHORDS.
   * Defaults to true.
   */
  includeSupplementalChords?: boolean;

  /**
   * Keep a candidate even if it has the same pitch set as the current event.
   * Defaults to false because the first use case is "where can I go?".
   */
  includeSamePitchSet?: boolean;
};

export type RelationshipView =
  | "stay-close"
  | "transform"
  | "explore";

export type RelationshipProfile = {
  pitch: {
    commonToneCount: number;
    pitchSetDistance: number;
  };

  function: {
    total: number;
    average: number;
    description:
      | "minimal"
      | "moderate"
      | "strong";
  };

  scale: {
    closestDistance?: number;
    hasSameCollectionOption: boolean;
  };
};

export type RankedRelationshipCandidate = {
  candidate: HarmonicCandidate;
  profile: RelationshipProfile;
  view: RelationshipView;

  /**
   * Human-readable reasons are intentionally exposed alongside the
   * ordering. We do not hide the result behind one universal score.
   */
  reasons: string[];
};

export type HarmonicPathDecision = {
  fromEventId: string;
  toEventId: string;
  constraints: PitchConstraint[];
};

export type HarmonicPath = {
  id: string;
  name?: string;

  events: HarmonicEvent[];
  decisions: HarmonicPathDecision[];
};

export type HarmonicPathBranch = {
  path: HarmonicPath;
  fromEvent: HarmonicEvent;
  constraints: PitchConstraint[];
  candidates: HarmonicCandidate[];

  views: {
    stayClose: RankedRelationshipCandidate[];
    transform: RankedRelationshipCandidate[];
    explore: RankedRelationshipCandidate[];
  };
};

/**
 * Interpretation deliberately lives ABOVE the objective relationship engine.
 * We are not assigning universal numeric tension scores.
 */
export type ResolutionSuggestion = {
  movement: VoiceMovement;
  confidence:
    | "strong"
    | "possible"
    | "context-dependent";
  explanation: string;
};

export type HarmonicInterpretation = {
  likelyResolutions: ResolutionSuggestion[];
  characterTags: string[];
};


/* ------------------------------------------------------------------ */
/* Pitch helpers                                                       */
/* ------------------------------------------------------------------ */

export function toPitchClass(
  pitch: PitchName,
): PitchClass {
  const directIndex = getNoteIndex(pitch);

  if (directIndex >= 0) {
    return directIndex;
  }

  /**
   * Parse theoretical spellings directly so the relationship engine
   * can understand double accidentals such as Bbb in Cdim7.
   */
  const match = pitch.match(/^([A-Ga-g])([#b]*)$/);

  if (match) {
    const letter =
      match[1].toUpperCase();
    const accidentals =
      match[2];

    const naturalPitchClasses:
      Record<string, number> = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
      };

    let pitchClass =
      naturalPitchClasses[letter];

    for (const accidental of accidentals) {
      pitchClass +=
        accidental === "#" ? 1 : -1;
    }

    return normalizeIntervalClass(
      pitchClass,
    );
  }

  throw new Error(
    `Unknown pitch "${pitch}".`,
  );
}

export function normalizeIntervalClass(
  value: number,
): number {
  return (
    (value % CHROMATIC_NOTES.length) +
    CHROMATIC_NOTES.length
  ) % CHROMATIC_NOTES.length;
}

function basicIntervalLabel(
  intervalClass: number,
): string {
  const labels = [
    "R",
    "b2",
    "2",
    "b3",
    "3",
    "4",
    "b5",
    "5",
    "#5",
    "6",
    "b7",
    "7",
  ] as const;

  return labels[
    normalizeIntervalClass(intervalClass)
  ];
}

function inferBasicRole(
  functionLabel: string,
): HarmonicRole {
  if (
    functionLabel === "R" ||
    functionLabel === "b3" ||
    functionLabel === "3" ||
    functionLabel === "b5" ||
    functionLabel === "5" ||
    functionLabel === "#5" ||
    functionLabel === "b7" ||
    functionLabel === "7"
  ) {
    return "chord-tone";
  }

  if (
    functionLabel.includes("9") ||
    functionLabel.includes("11") ||
    functionLabel.includes("13") ||
    functionLabel === "2" ||
    functionLabel === "4" ||
    functionLabel === "6"
  ) {
    return "extension";
  }

  return "alteration";
}


/* ------------------------------------------------------------------ */
/* Event construction                                                  */
/* ------------------------------------------------------------------ */

export function createHarmonicEvent(
  id: string,
  root: PitchName,
  chordName: string,
  chordIntervals: readonly number[],
  addedToneInputs: readonly AddedToneInput[] = [],
): HarmonicEvent {
  const formulaLabels =
    chordName === "Major 6/9"
      ? ["R", "9", "3", "5", "6"]
      : getChordFormulaLabels(
          chordName,
          chordIntervals,
        );

  const spelledChordNotes =
    spellChordNotes(
      root,
      chordName,
      chordIntervals,
    );

  const chordTones: EventTone[] =
    chordIntervals.map((interval, index) => {
      const pitch =
        spelledChordNotes[index];

      const label =
        formulaLabels[index] ??
        basicIntervalLabel(interval);

      return {
        pitch,
        pitchClass: toPitchClass(pitch),
        source: "chord",
        function: {
          intervalClass:
            normalizeIntervalClass(interval),
          label,
          role: inferBasicRole(label),
        },
      };
    });

  const rootPitchClass = toPitchClass(root);

  const addedTones: EventTone[] =
    addedToneInputs.map((input) => {
      const pitchClass = toPitchClass(
        input.pitch,
      );

      return {
        pitch: input.pitch,
        pitchClass,
        source: "added",
        function: {
          intervalClass:
            normalizeIntervalClass(
              pitchClass - rootPitchClass,
            ),
          label: input.functionLabel,
          role:
            input.role ??
            inferBasicRole(
              input.functionLabel,
            ),
        },
      };
    });

  return {
    id,
    root,
    chordName,
    chordIntervals,
    chordTones,
    addedTones,
  };
}

export function getEventTones(
  event: HarmonicEvent,
): EventTone[] {
  const byPitchClass = new Map<
    PitchClass,
    EventTone
  >();

  /**
   * Base chord first, then added tones.
   * If an added tone duplicates a chord tone, the base chord tone
   * remains authoritative.
   */
  [...event.chordTones, ...event.addedTones]
    .forEach((tone) => {
      if (!byPitchClass.has(tone.pitchClass)) {
        byPitchClass.set(
          tone.pitchClass,
          tone,
        );
      }
    });

  return Array.from(byPitchClass.values());
}

export function findToneInEvent(
  event: HarmonicEvent,
  pitch: PitchName,
): EventTone | null {
  const target = toPitchClass(pitch);

  return (
    getEventTones(event).find(
      (tone) =>
        tone.pitchClass === target,
    ) ?? null
  );
}


/* ------------------------------------------------------------------ */
/* Objective event comparison                                         */
/* ------------------------------------------------------------------ */

export function compareHarmonicEvents(
  from: HarmonicEvent,
  to: HarmonicEvent,
): EventRelationship {
  const fromTones = getEventTones(from);
  const toTones = getEventTones(to);

  const fromMap = new Map(
    fromTones.map(
      (tone) => [
        tone.pitchClass,
        tone,
      ] as const,
    ),
  );

  const toMap = new Map(
    toTones.map(
      (tone) => [
        tone.pitchClass,
        tone,
      ] as const,
    ),
  );

  const sharedTones =
    fromTones.filter(
      (tone) =>
        toMap.has(tone.pitchClass),
    );

  const removedTones =
    fromTones.filter(
      (tone) =>
        !toMap.has(tone.pitchClass),
    );

  const addedTones =
    toTones.filter(
      (tone) =>
        !fromMap.has(tone.pitchClass),
    );

  const functionChanges: FunctionChange[] =
    sharedTones.flatMap((fromTone) => {
      const toTone = toMap.get(
        fromTone.pitchClass,
      );

      if (!toTone) {
        return [];
      }

      return [
        {
          pitch: fromTone.pitch,
          pitchClass: fromTone.pitchClass,
          from: fromTone.function,
          to: toTone.function,
        },
      ];
    });

  return {
    fromEventId: from.id,
    toEventId: to.id,

    sharedTones,
    addedTones,
    removedTones,

    functionChanges,

    metrics: {
      commonToneCount:
        sharedTones.length,
      addedToneCount:
        addedTones.length,
      removedToneCount:
        removedTones.length,
      pitchSetDistance:
        addedTones.length +
        removedTones.length,
    },
  };
}


/* ------------------------------------------------------------------ */
/* Pitch journeys through a progression                               */
/* ------------------------------------------------------------------ */

export function buildPitchJourney(
  progression: HarmonicProgression,
  pitch: PitchName,
): PitchJourney {
  const pitchClass = toPitchClass(pitch);

  return {
    pitch,
    pitchClass,

    appearances:
      progression.events.map((event) => ({
        eventId: event.id,
        eventRoot: event.root,
        chordName: event.chordName,
        tone:
          getEventTones(event).find(
            (eventTone) =>
              eventTone.pitchClass ===
              pitchClass,
          ) ?? null,
      })),
  };
}


/* ------------------------------------------------------------------ */
/* Pitch-set voice movement helpers                                   */
/* ------------------------------------------------------------------ */

export function getDirectedSemitoneMovement(
  fromPitch: PitchName,
  toPitch: PitchName,
): VoiceMovement {
  const from = toPitchClass(fromPitch);
  const to = toPitchClass(toPitch);

  if (from === to) {
    return {
      fromPitch,
      toPitch,
      semitoneDistance: 0,
      direction: "same",
    };
  }

  const up =
    normalizeIntervalClass(to - from);

  const down =
    normalizeIntervalClass(from - to);

  if (up <= down) {
    return {
      fromPitch,
      toPitch,
      semitoneDistance: up,
      direction: "up",
    };
  }

  return {
    fromPitch,
    toPitch,
    semitoneDistance: down,
    direction: "down",
  };
}


/* ------------------------------------------------------------------ */
/* Candidate constraint checks                                        */
/* ------------------------------------------------------------------ */

export function candidateSatisfiesHoldConstraints(
  candidate: HarmonicEvent,
  constraints: readonly PitchConstraint[],
): boolean {
  const candidatePitchClasses =
    new Set(
      getEventTones(candidate).map(
        (tone) => tone.pitchClass,
      ),
    );

  return constraints
    .filter(
      (constraint) =>
        constraint.intent === "hold",
    )
    .every(
      (constraint) =>
        candidatePitchClasses.has(
          toPitchClass(
            constraint.pitch,
          ),
        ),
    );
}


/* ------------------------------------------------------------------ */
/* Compatible scale / mode contexts                                   */
/* ------------------------------------------------------------------ */

/**
 * Canonical scale names for the relationship engine.
 *
 * musicData contains a few aliases with identical interval sets
 * (for example Aeolian / Natural Minor). Relationships should not
 * flood the user with duplicate names, so this list keeps one useful
 * pedagogical name for each intended scale/mode entry.
 */
export const RELATIONSHIP_SCALE_NAMES = [
  "Major",
  "Dorian",
  "Phrygian",
  "Lydian",
  "Mixolydian",
  "Aeolian",
  "Locrian",

  "Harmonic Minor",
  "Melodic Minor",

  "Dorian b2",
  "Lydian Augmented",
  "Lydian Dominant",
  "Mixolydian b6",
  "Locrian ♮2",
  "Altered (Super Locrian)",

  "Locrian ♮6",
  "Ionian #5",
  "Dorian #4",
  "Phrygian Dominant",
  "Lydian #2",
  "Ultra Locrian",

  "Major Pentatonic",
  "Minor Pentatonic",
  "Major Blues",
  "Minor Blues",

  "Whole Tone",
  "Diminished Half-Whole",
  "Diminished Whole-Half",
  "Augmented",
] as const;

function scalePitchClasses(
  root: PitchName,
  intervals: readonly number[],
): PitchClass[] {
  const rootClass = toPitchClass(root);

  return intervals.map(
    (interval) =>
      normalizeIntervalClass(
        rootClass + interval,
      ),
  );
}

function scaleContainsEvent(
  scalePitchClassSet: Set<PitchClass>,
  event: HarmonicEvent,
): boolean {
  return getEventTones(event).every(
    (tone) =>
      scalePitchClassSet.has(
        tone.pitchClass,
      ),
  );
}

function buildScalePitchFunctions(
  root: PitchName,
  selectedPitches: readonly PitchName[],
): ScalePitchFunction[] {
  const rootClass = toPitchClass(root);

  return selectedPitches.map((pitch) => {
    const pitchClass = toPitchClass(pitch);
    const intervalClass =
      normalizeIntervalClass(
        pitchClass - rootClass,
      );

    return {
      pitch,
      pitchClass,
      intervalClass,
      label:
        basicIntervalLabel(
          intervalClass,
        ),
    };
  });
}

/**
 * Find scale/mode contexts rooted on the harmonic event's chord root.
 *
 * This is deliberate for Step 5:
 * - it answers "what modal/scalar contexts fit this chord?"
 * - it avoids returning the same seven-note collection under all seven
 *   modal roots at once
 * - parent-collection equivalence is still discovered by comparing the
 *   resulting pitch-class collections across harmonic events
 */
export function findCompatibleScaleContexts(
  event: HarmonicEvent,
  selectedPitches: readonly PitchName[] = [],
): ScaleContext[] {
  const root = event.root;

  return RELATIONSHIP_SCALE_NAMES.flatMap(
    (scaleName) => {
      const intervals =
        SCALES[
          scaleName as keyof typeof SCALES
        ];

      if (!intervals) {
        return [];
      }

      const pitchClasses =
        scalePitchClasses(
          root,
          intervals,
        );

      const pitchClassSet =
        new Set(pitchClasses);

      if (
        !scaleContainsEvent(
          pitchClassSet,
          event,
        )
      ) {
        return [];
      }

      return [
        {
          root,
          scaleName,
          intervals,
          notes:
            spellScaleNotes(
              root,
              intervals,
            ),
          pitchClasses,
          selectedPitchFunctions:
            buildScalePitchFunctions(
              root,
              selectedPitches,
            ),
        },
      ];
    },
  );
}

export function compareScaleContexts(
  current: ScaleContext,
  candidate: ScaleContext,
): ScaleContextRelationship {
  const currentSet =
    new Set(current.pitchClasses);

  const candidateSet =
    new Set(candidate.pitchClasses);

  const sharedPitchClasses =
    current.pitchClasses.filter(
      (pitchClass) =>
        candidateSet.has(
          pitchClass,
        ),
    );

  const removedPitchClasses =
    current.pitchClasses.filter(
      (pitchClass) =>
        !candidateSet.has(
          pitchClass,
        ),
    );

  const addedPitchClasses =
    candidate.pitchClasses.filter(
      (pitchClass) =>
        !currentSet.has(
          pitchClass,
        ),
    );

  return {
    context: candidate,
    closestCurrentContext: current,

    sharedPitchClasses,
    addedPitchClasses,
    removedPitchClasses,

    distanceFromCurrent:
      Math.max(
        addedPitchClasses.length,
        removedPitchClasses.length,
      ),
  };
}

export function relateCandidateScaleContexts(
  current: HarmonicEvent,
  candidate: HarmonicEvent,
  selectedPitches: readonly PitchName[] = [],
): ScaleContextRelationship[] {
  const currentContexts =
    findCompatibleScaleContexts(
      current,
      selectedPitches,
    );

  const candidateContexts =
    findCompatibleScaleContexts(
      candidate,
      selectedPitches,
    );

  /**
   * If the source has no compatible context in the current scale
   * library, we still report the candidate's compatible contexts.
   */
  if (currentContexts.length === 0) {
    return candidateContexts.map(
      (context) => ({
        context,
        sharedPitchClasses: [],
        addedPitchClasses: [],
        removedPitchClasses: [],
      }),
    );
  }

  return candidateContexts
    .map((context) => {
      const relationships =
        currentContexts.map(
          (currentContext) =>
            compareScaleContexts(
              currentContext,
              context,
            ),
        );

      relationships.sort(
        (a, b) =>
          (a.distanceFromCurrent ??
            Number.POSITIVE_INFINITY) -
          (b.distanceFromCurrent ??
            Number.POSITIVE_INFINITY),
      );

      return relationships[0];
    })
    .sort((a, b) => {
      const distanceDifference =
        (a.distanceFromCurrent ??
          Number.POSITIVE_INFINITY) -
        (b.distanceFromCurrent ??
          Number.POSITIVE_INFINITY);

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      return a.context.scaleName.localeCompare(
        b.context.scaleName,
      );
    });
}

/* ------------------------------------------------------------------ */
/* Functional distance                                                */
/* ------------------------------------------------------------------ */

export function getFunctionTransitionCost(
  from: HarmonicFunction,
  to: HarmonicFunction,
): number {
  if (
    from.label === to.label &&
    from.role === to.role
  ) {
    return 0;
  }

  if (from.role === to.role) {
    return 1;
  }

  const structuralRoles =
    new Set<HarmonicRole>([
      "chord-tone",
      "extension",
    ]);

  if (
    structuralRoles.has(from.role) &&
    structuralRoles.has(to.role)
  ) {
    return 2;
  }

  return 3;
}

export function calculateFunctionalDistance(
  changes: readonly FunctionChange[],
): FunctionalDistanceSummary {
  if (changes.length === 0) {
    return {
      sameFunctionCount: 0,
      sameRoleCount: 0,
      roleChangeCount: 0,
      total: 0,
      average: 0,
    };
  }

  let sameFunctionCount = 0;
  let sameRoleCount = 0;
  let roleChangeCount = 0;
  let total = 0;

  changes.forEach((change) => {
    if (!change.from || !change.to) {
      return;
    }

    const cost =
      getFunctionTransitionCost(
        change.from,
        change.to,
      );

    total += cost;

    if (cost === 0) {
      sameFunctionCount += 1;
    } else if (
      change.from.role ===
      change.to.role
    ) {
      sameRoleCount += 1;
    } else {
      roleChangeCount += 1;
    }
  });

  return {
    sameFunctionCount,
    sameRoleCount,
    roleChangeCount,
    total,
    average:
      total / changes.length,
  };
}

export function describeFunctionalDistance(
  summary: FunctionalDistanceSummary,
): "minimal" | "moderate" | "strong" {
  if (summary.average < 0.75) {
    return "minimal";
  }

  if (summary.average < 1.5) {
    return "moderate";
  }

  return "strong";
}


/* ------------------------------------------------------------------ */
/* Candidate generation                                               */
/* ------------------------------------------------------------------ */

export function getRelationshipChordCatalog(
  includeSupplementalChords = true,
): RelationshipChordDefinition[] {
  const appLibrary =
    Object.entries(CHORDS).map(
      ([name, intervals]) => ({
        name,
        intervals:
          intervals as readonly number[],
        source:
          "app-library" as const,
      }),
    );

  if (!includeSupplementalChords) {
    return appLibrary;
  }

  const supplemental =
    Object.entries(
      RELATIONSHIP_SUPPLEMENTAL_CHORDS,
    ).map(
      ([name, intervals]) => ({
        name,
        intervals:
          intervals as readonly number[],
        source:
          "relationship-supplement" as const,
      }),
    );

  return [
    ...appLibrary,
    ...supplemental,
  ];
}

function pitchClassSet(
  event: HarmonicEvent,
): Set<PitchClass> {
  return new Set(
    getEventTones(event).map(
      (tone) => tone.pitchClass,
    ),
  );
}

function haveSamePitchSet(
  a: HarmonicEvent,
  b: HarmonicEvent,
): boolean {
  const aSet = pitchClassSet(a);
  const bSet = pitchClassSet(b);

  if (aSet.size !== bSet.size) {
    return false;
  }

  return Array.from(aSet).every(
    (pitchClass) =>
      bSet.has(pitchClass),
  );
}

function requiredDestinationPitchClasses(
  constraints: readonly PitchConstraint[],
): Set<PitchClass> {
  const required = new Set<PitchClass>();

  constraints.forEach((constraint) => {
    if (
      constraint.intent === "hold" ||
      constraint.intent === "add"
    ) {
      required.add(
        toPitchClass(constraint.pitch),
      );
    }

    if (
      constraint.intent === "resolve" &&
      constraint.targetPitch
    ) {
      required.add(
        toPitchClass(
          constraint.targetPitch,
        ),
      );
    }
  });

  return required;
}

export function candidateSatisfiesConstraints(
  candidate: HarmonicEvent,
  constraints: readonly PitchConstraint[],
): boolean {
  const candidatePitchClasses =
    pitchClassSet(candidate);

  const required =
    requiredDestinationPitchClasses(
      constraints,
    );

  const hasAllRequired =
    Array.from(required).every(
      (pitchClass) =>
        candidatePitchClasses.has(
          pitchClass,
        ),
    );

  if (!hasAllRequired) {
    return false;
  }

  /**
   * Step 9 strict pitch-set resolution semantics:
   *
   * Resolve X -> Y means:
   * - Y must be present in the destination, AND
   * - X must no longer be present in the destination.
   *
   * This is intentionally a pitch-class approximation until the app
   * tracks individual voices/register/fret positions. At that later
   * stage one voice may resolve X -> Y while another X is retained.
   */
  return constraints
    .filter(
      (constraint) =>
        constraint.intent === "resolve" &&
        Boolean(
          constraint.targetPitch,
        ),
    )
    .every((constraint) => {
      const sourcePitchClass =
        toPitchClass(
          constraint.pitch,
        );

      const targetPitchClass =
        toPitchClass(
          constraint.targetPitch!,
        );

      /**
       * Resolving a pitch to its enharmonic equivalent / same pitch
       * class is effectively a hold at this abstraction level.
       */
      if (
        sourcePitchClass ===
        targetPitchClass
      ) {
        return candidatePitchClasses.has(
          targetPitchClass,
        );
      }

      return (
        candidatePitchClasses.has(
          targetPitchClass,
        ) &&
        !candidatePitchClasses.has(
          sourcePitchClass,
        )
      );
    });
}

function candidateIdPart(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pitchNamesFromTones(
  tones: readonly EventTone[],
): PitchName[] {
  return tones.map(
    (tone) => tone.pitch,
  );
}

export function buildHarmonicCandidate(
  current: HarmonicEvent,
  candidateEvent: HarmonicEvent,
  selectedPitches: readonly PitchName[] = [],
): HarmonicCandidate {
  const relationship =
    compareHarmonicEvents(
      current,
      candidateEvent,
    );

  return {
    event: candidateEvent,

    preservedPitches:
      pitchNamesFromTones(
        relationship.sharedTones,
      ),

    addedPitches:
      pitchNamesFromTones(
        relationship.addedTones,
      ),

    removedPitches:
      pitchNamesFromTones(
        relationship.removedTones,
      ),

    functionChanges:
      relationship.functionChanges,

    /**
     * Voice-leading is intentionally still empty here.
     * Pitch-set comparison is not enough to know actual physical voices.
     */
    voiceMovements: [],

    compatibleScaleContexts:
      relateCandidateScaleContexts(
        current,
        candidateEvent,
        selectedPitches,
      ),

    metrics: {
      commonToneCount:
        relationship.metrics
          .commonToneCount,

      pitchSetDistance:
        relationship.metrics
          .pitchSetDistance,

      functionalDistance:
        calculateFunctionalDistance(
          relationship.functionChanges,
        ),

      scaleContextDistance:
        (() => {
          const contexts =
            relateCandidateScaleContexts(
              current,
              candidateEvent,
              selectedPitches,
            );

          const distances =
            contexts
              .map(
                (context) =>
                  context.distanceFromCurrent,
              )
              .filter(
                (
                  value,
                ): value is number =>
                  typeof value === "number",
              );

          return distances.length > 0
            ? Math.min(...distances)
            : undefined;
        })(),
    },
  };
}

export function rankHarmonicCandidates(
  candidates: readonly HarmonicCandidate[],
): HarmonicCandidate[] {
  return [...candidates].sort(
    (a, b) => {
      /**
       * 1. Preserve as much pitch material as possible.
       */
      const commonDifference =
        b.metrics.commonToneCount -
        a.metrics.commonToneCount;

      if (commonDifference !== 0) {
        return commonDifference;
      }

      /**
       * 2. Prefer fewer pitch-set changes.
       */
      const distanceDifference =
        a.metrics.pitchSetDistance -
        b.metrics.pitchSetDistance;

      if (distanceDifference !== 0) {
        return distanceDifference;
      }

      /**
       * 3. Prefer the smaller destination chord when two candidates
       *    are otherwise equally close.
       */
      const sizeDifference =
        getEventTones(a.event).length -
        getEventTones(b.event).length;

      if (sizeDifference !== 0) {
        return sizeDifference;
      }

      /**
       * 4. Stable deterministic ordering.
       */
      const rootDifference =
        toPitchClass(a.event.root) -
        toPitchClass(b.event.root);

      if (rootDifference !== 0) {
        return rootDifference;
      }

      return a.event.chordName.localeCompare(
        b.event.chordName,
      );
    },
  );
}

function importantPitchesFromConstraints(
  constraints: readonly PitchConstraint[],
): PitchName[] {
  const byPitchClass =
    new Map<PitchClass, PitchName>();

  constraints.forEach((constraint) => {
    const pitchClass =
      toPitchClass(
        constraint.pitch,
      );

    if (!byPitchClass.has(pitchClass)) {
      byPitchClass.set(
        pitchClass,
        constraint.pitch,
      );
    }

    if (constraint.targetPitch) {
      const targetClass =
        toPitchClass(
          constraint.targetPitch,
        );

      if (!byPitchClass.has(targetClass)) {
        byPitchClass.set(
          targetClass,
          constraint.targetPitch,
        );
      }
    }
  });

  return Array.from(
    byPitchClass.values(),
  );
}

export function generateHarmonicCandidates(
  current: HarmonicEvent,
  constraints: readonly PitchConstraint[],
  options: CandidateGenerationOptions = {},
): HarmonicCandidate[] {
  const {
    limit = 24,
    includeSupplementalChords = true,
    includeSamePitchSet = false,
  } = options;

  const catalog =
    getRelationshipChordCatalog(
      includeSupplementalChords,
    );

  const importantPitches =
    importantPitchesFromConstraints(
      constraints,
    );

  const candidates: HarmonicCandidate[] = [];

  CHROMATIC_NOTES.forEach((root) => {
    catalog.forEach((definition) => {
      const candidateEvent =
        createHarmonicEvent(
          `candidate-${candidateIdPart(root)}-${candidateIdPart(definition.name)}`,
          root,
          definition.name,
          definition.intervals,
        );

      if (
        !candidateSatisfiesConstraints(
          candidateEvent,
          constraints,
        )
      ) {
        return;
      }

      if (
        !includeSamePitchSet &&
        haveSamePitchSet(
          current,
          candidateEvent,
        )
      ) {
        return;
      }

      candidates.push(
        buildHarmonicCandidate(
          current,
          candidateEvent,
          importantPitches,
        ),
      );
    });
  });

  return rankHarmonicCandidates(
    candidates,
  ).slice(
    0,
    Math.max(0, limit),
  );
}

export function findCandidateByName(
  candidates: readonly HarmonicCandidate[],
  root: PitchName,
  chordName: string,
): HarmonicCandidate | null {
  const rootClass =
    toPitchClass(root);

  return (
    candidates.find(
      (candidate) =>
        toPitchClass(
          candidate.event.root,
        ) === rootClass &&
        candidate.event.chordName ===
          chordName,
    ) ?? null
  );
}


/* ------------------------------------------------------------------ */
/* Relationship profiles / development ranking views                  */
/* ------------------------------------------------------------------ */

export function buildRelationshipProfile(
  candidate: HarmonicCandidate,
): RelationshipProfile {
  const functional =
    candidate.metrics.functionalDistance;

  return {
    pitch: {
      commonToneCount:
        candidate.metrics.commonToneCount,
      pitchSetDistance:
        candidate.metrics.pitchSetDistance,
    },

    function: {
      total: functional.total,
      average: functional.average,
      description:
        describeFunctionalDistance(
          functional,
        ),
    },

    scale: {
      closestDistance:
        candidate.metrics
          .scaleContextDistance,

      hasSameCollectionOption:
        candidate.compatibleScaleContexts
          .some(
            (relationship) =>
              relationship
                .distanceFromCurrent === 0,
          ),
    },
  };
}

function compareStayClose(
  a: HarmonicCandidate,
  b: HarmonicCandidate,
): number {
  const pitchDistance =
    a.metrics.pitchSetDistance -
    b.metrics.pitchSetDistance;

  if (pitchDistance !== 0) {
    return pitchDistance;
  }

  const commonTones =
    b.metrics.commonToneCount -
    a.metrics.commonToneCount;

  if (commonTones !== 0) {
    return commonTones;
  }

  const functional =
    a.metrics.functionalDistance.average -
    b.metrics.functionalDistance.average;

  if (functional !== 0) {
    return functional;
  }

  return (
    (a.metrics.scaleContextDistance ??
      Number.POSITIVE_INFINITY) -
    (b.metrics.scaleContextDistance ??
      Number.POSITIVE_INFINITY)
  );
}

function compareTransform(
  a: HarmonicCandidate,
  b: HarmonicCandidate,
): number {
  /**
   * Transform means:
   * preserve as much physical material as possible while maximizing
   * reinterpretation of the notes that remain.
   *
   * This is a lexicographic view, not a blended tension score.
   */
  const commonTones =
    b.metrics.commonToneCount -
    a.metrics.commonToneCount;

  if (commonTones !== 0) {
    return commonTones;
  }

  const functional =
    b.metrics.functionalDistance.average -
    a.metrics.functionalDistance.average;

  if (functional !== 0) {
    return functional;
  }

  const scaleContinuity =
    (a.metrics.scaleContextDistance ??
      Number.POSITIVE_INFINITY) -
    (b.metrics.scaleContextDistance ??
      Number.POSITIVE_INFINITY);

  if (scaleContinuity !== 0) {
    return scaleContinuity;
  }

  return (
    a.metrics.pitchSetDistance -
    b.metrics.pitchSetDistance
  );
}

function compareExplore(
  a: HarmonicCandidate,
  b: HarmonicCandidate,
): number {
  /**
   * Explore favors a larger collection change first, then stronger
   * functional reinterpretation. It remains deterministic and
   * inspectable rather than collapsing the dimensions into one score.
   */
  const scaleDistance =
    (b.metrics.scaleContextDistance ?? -1) -
    (a.metrics.scaleContextDistance ?? -1);

  if (scaleDistance !== 0) {
    return scaleDistance;
  }

  const functional =
    b.metrics.functionalDistance.average -
    a.metrics.functionalDistance.average;

  if (functional !== 0) {
    return functional;
  }

  const pitchDistance =
    b.metrics.pitchSetDistance -
    a.metrics.pitchSetDistance;

  if (pitchDistance !== 0) {
    return pitchDistance;
  }

  return (
    b.metrics.commonToneCount -
    a.metrics.commonToneCount
  );
}

function relationshipViewReasons(
  candidate: HarmonicCandidate,
  view: RelationshipView,
): string[] {
  const profile =
    buildRelationshipProfile(
      candidate,
    );

  const reasons: string[] = [
    `${profile.pitch.commonToneCount} common tone${
      profile.pitch.commonToneCount === 1
        ? ""
        : "s"
    }`,
    `pitch-set distance ${profile.pitch.pitchSetDistance}`,
    `${profile.function.description} functional transformation (${profile.function.average.toFixed(2)})`,
  ];

  if (
    profile.scale.closestDistance !==
    undefined
  ) {
    reasons.push(
      profile.scale.hasSameCollectionOption
        ? "same scale collection available"
        : `closest scale-context distance ${profile.scale.closestDistance}`,
    );
  }

  if (view === "stay-close") {
    reasons.unshift(
      "prioritizes minimum pitch change",
    );
  } else if (view === "transform") {
    reasons.unshift(
      "prioritizes preserved tones with stronger reinterpretation",
    );
  } else {
    reasons.unshift(
      "prioritizes broader scale/context change",
    );
  }

  return reasons;
}

export function rankCandidatesForRelationshipView(
  candidates: readonly HarmonicCandidate[],
  view: RelationshipView,
): RankedRelationshipCandidate[] {
  const sorted = [...candidates];

  if (view === "stay-close") {
    sorted.sort(compareStayClose);
  } else if (view === "transform") {
    sorted.sort(compareTransform);
  } else {
    sorted.sort(compareExplore);
  }

  return sorted.map((candidate) => ({
    candidate,
    profile:
      buildRelationshipProfile(
        candidate,
      ),
    view,
    reasons:
      relationshipViewReasons(
        candidate,
        view,
      ),
  }));
}


/* ------------------------------------------------------------------ */
/* Harmonic path / branch generation                                  */
/* ------------------------------------------------------------------ */

export function createHarmonicPath(
  id: string,
  initialEvent: HarmonicEvent,
  name?: string,
): HarmonicPath {
  return {
    id,
    name,
    events: [initialEvent],
    decisions: [],
  };
}

export function getCurrentPathEvent(
  path: HarmonicPath,
): HarmonicEvent {
  const current =
    path.events[
      path.events.length - 1
    ];

  if (!current) {
    throw new Error(
      `Harmonic path "${path.id}" has no events.`,
    );
  }

  return current;
}

export function generateHarmonicPathBranch(
  path: HarmonicPath,
  constraints: readonly PitchConstraint[],
  options: CandidateGenerationOptions = {},
): HarmonicPathBranch {
  const fromEvent =
    getCurrentPathEvent(path);

  const candidates =
    generateHarmonicCandidates(
      fromEvent,
      constraints,
      options,
    );

  return {
    path,
    fromEvent,
    constraints: [...constraints],
    candidates,

    views: {
      stayClose:
        rankCandidatesForRelationshipView(
          candidates,
          "stay-close",
        ),

      transform:
        rankCandidatesForRelationshipView(
          candidates,
          "transform",
        ),

      explore:
        rankCandidatesForRelationshipView(
          candidates,
          "explore",
        ),
    },
  };
}

export function chooseHarmonicPathCandidate(
  path: HarmonicPath,
  candidate: HarmonicCandidate,
  constraints: readonly PitchConstraint[],
): HarmonicPath {
  const fromEvent =
    getCurrentPathEvent(path);

  return {
    ...path,

    events: [
      ...path.events,
      candidate.event,
    ],

    decisions: [
      ...path.decisions,
      {
        fromEventId: fromEvent.id,
        toEventId:
          candidate.event.id,
        constraints: [
          ...constraints,
        ],
      },
    ],
  };
}

export function stepBackHarmonicPath(
  path: HarmonicPath,
): HarmonicPath {
  if (path.events.length <= 1) {
    return path;
  }

  return {
    ...path,
    events:
      path.events.slice(0, -1),
    decisions:
      path.decisions.slice(0, -1),
  };
}

export function findCandidateInBranch(
  branch: HarmonicPathBranch,
  root: PitchName,
  chordName: string,
): HarmonicCandidate | null {
  return findCandidateByName(
    branch.candidates,
    root,
    chordName,
  );
}

/**
 * Development fixture for Step 8.
 *
 * Step 1:
 * Cmaj7 + F# -> D13
 *
 * Step 2 constraints from D13:
 * - Hold E
 * - Free B
 * - Resolve F# -> G
 *
 * "Free B" intentionally places no requirement on B in the destination.
 * "Resolve F# -> G" requires G in the destination, while F# itself may
 * disappear or remain depending on the candidate.
 */
export function createPathValidationExample(): {
  pathAfterD13: HarmonicPath;
  secondBranch: HarmonicPathBranch;
  secondStepConstraints: PitchConstraint[];
  strictResolveValidation: {
    allContainTargetG: boolean;
    noneContainSourceFSharp: boolean;
  };
} {
  const firstExample =
    createRelationshipValidationExample();

  const initialEvent =
    firstExample.progression.events[0];

  const initialPath =
    createHarmonicPath(
      "path-validation-1",
      initialEvent,
      "Cmaj7 + F# -> D13 -> ?",
    );

  const firstBranch =
    generateHarmonicPathBranch(
      initialPath,
      firstExample.constraints,
      {
        limit: 48,
      },
    );

  const d13 =
    findCandidateInBranch(
      firstBranch,
      "D",
      "Dominant 13",
    );

  if (!d13) {
    throw new Error(
      "Path validation could not find D Dominant 13 in the first branch.",
    );
  }

  const pathAfterD13 =
    chooseHarmonicPathCandidate(
      initialPath,
      d13,
      firstExample.constraints,
    );

  const secondStepConstraints:
    PitchConstraint[] = [
      {
        pitch: "E",
        intent: "hold",
      },
      {
        pitch: "B",
        intent: "free",
      },
      {
        pitch: "F#",
        intent: "resolve",
        targetPitch: "G",
      },
    ];

  const secondBranch =
    generateHarmonicPathBranch(
      pathAfterD13,
      secondStepConstraints,
      {
        limit: 48,
      },
    );

  const strictResolveValidation = {
    allContainTargetG:
      secondBranch.candidates.every(
        (candidate) =>
          pitchClassSet(
            candidate.event,
          ).has(
            toPitchClass("G"),
          ),
      ),

    noneContainSourceFSharp:
      secondBranch.candidates.every(
        (candidate) =>
          !pitchClassSet(
            candidate.event,
          ).has(
            toPitchClass("F#"),
          ),
      ),
  };

  return {
    pathAfterD13,
    secondBranch,
    secondStepConstraints,
    strictResolveValidation,
  };
}


/* ------------------------------------------------------------------ */
/* Intentionally deferred                                             */
/* ------------------------------------------------------------------ */

/**
 * TODO — later engine layers:
 *
 * 1. calculateVoicingRelationship(...)
 *    - accept ACTUAL fretboard positions / registers
 *    - preserve voices vs pitch classes
 *    - physical movement on Touch Guitar / Chapman Stick
 *
 * 2. interpretRelationship(...)
 *    - resolution tendencies
 *    - tension/release descriptions
 *    - contextual, never a universal numeric tension score
 *
 */


/* ------------------------------------------------------------------ */
/* Validation example                                                  */
/* ------------------------------------------------------------------ */

/**
 * Our first architecture test:
 *
 * Cmaj7 + F# -> Em9 -> D6/9
 *
 * E and B are intended as Hold tones.
 * F# begins as an added #11 and later becomes 9, then 3.
 *
 * This function is not called by the app. It exists as a convenient
 * development fixture while the engine is being built.
 */
export function createRelationshipValidationExample(): {
  progression: HarmonicProgression;
  constraints: PitchConstraint[];
  transitions: EventRelationship[];
  journeys: {
    E: PitchJourney;
    B: PitchJourney;
    FSharp: PitchJourney;
  };
  candidates: HarmonicCandidate[];
  validationTargets: {
    eMinor9: HarmonicCandidate | null;
    dMajor69: HarmonicCandidate | null;
  };
} {
  const cMaj7 = createHarmonicEvent(
    "event-cmaj7",
    "C",
    "Major 7",
    [0, 4, 7, 11],
    [
      {
        pitch: "F#",
        functionLabel: "#11",
        role: "extension",
      },
    ],
  );

  const eMin9 = createHarmonicEvent(
    "event-em9",
    "E",
    "Minor 9",
    [0, 3, 7, 10, 2],
  );

  const d69 = createHarmonicEvent(
    "event-d69",
    "D",
    "Major 6/9",
    [0, 4, 7, 9, 2],
  );

  const progression: HarmonicProgression = {
    id: "validation-path-1",
    name: "Hold E + B, introduce F#",
    events: [
      cMaj7,
      eMin9,
      d69,
    ],
  };

  const constraints: PitchConstraint[] = [
    {
      pitch: "E",
      intent: "hold",
    },
    {
      pitch: "B",
      intent: "hold",
    },
    {
      pitch: "F#",
      intent: "add",
    },
  ];

  const candidates =
    generateHarmonicCandidates(
      cMaj7,
      constraints,
      {
        limit: 48,
      },
    );

  return {
    progression,
    constraints,

    transitions: [
      compareHarmonicEvents(
        cMaj7,
        eMin9,
      ),
      compareHarmonicEvents(
        eMin9,
        d69,
      ),
    ],

    journeys: {
      E: buildPitchJourney(
        progression,
        "E",
      ),
      B: buildPitchJourney(
        progression,
        "B",
      ),
      FSharp: buildPitchJourney(
        progression,
        "F#",
      ),
    },

    candidates,

    validationTargets: {
      eMinor9: findCandidateByName(
        candidates,
        "E",
        "Minor 9",
      ),
      dMajor69: findCandidateByName(
        candidates,
        "D",
        "Major 6/9",
      ),
    },
  };
}
