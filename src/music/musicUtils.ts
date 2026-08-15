import { CHROMATIC_NOTES, INTERVAL_LABELS } from "./musicData";

export function getNoteIndex(note: string): number {
  return CHROMATIC_NOTES.indexOf(
    note as (typeof CHROMATIC_NOTES)[number],
  );
}


export function getIntervalBetweenNotes(
  note: string,
  rootNote: string,
): number {
  const noteIndex = getNoteIndex(note);
  const rootIndex = getNoteIndex(rootNote);

  return (
    (noteIndex - rootIndex + CHROMATIC_NOTES.length) %
    CHROMATIC_NOTES.length
  );
}


export function getNoteAtInterval(
  rootNote: string,
  interval: number,
): string {
  const rootIndex = getNoteIndex(rootNote);
  const targetIndex =
    (rootIndex + interval) % CHROMATIC_NOTES.length;

  return CHROMATIC_NOTES[targetIndex];
}


export function getNoteIndexesFromIntervals(
  rootNote: string,
  intervals: readonly number[],
): number[] {
  const rootIndex = getNoteIndex(rootNote);

  return intervals.map(
    (interval) =>
      (rootIndex + interval) % CHROMATIC_NOTES.length,
  );
}


export function getNotesFromIntervals(
  rootNote: string,
  intervals: readonly number[],
): string[] {
  return getNoteIndexesFromIntervals(
    rootNote,
    intervals,
  ).map((noteIndex) => CHROMATIC_NOTES[noteIndex]);
}


const INTERVAL_LONG_NAMES = [
  "Unison",
  "Minor Second",
  "Major Second",
  "Minor Third",
  "Major Third",
  "Perfect Fourth",
  "Tritone",
  "Perfect Fifth",
  "Minor Sixth",
  "Major Sixth",
  "Minor Seventh",
  "Major Seventh",
] as const;

export function getIntervalLongName(
  interval: number,
): string {
  return INTERVAL_LONG_NAMES[interval] ?? "Unknown";
}


export function getChordToneDetails(
  rootNote: string,
  intervals: readonly number[],
): string[] {
  return intervals.map((interval) => {
    const note = getNoteAtInterval(rootNote, interval);

    return `${note} (${getIntervalLongName(interval)})`;
  });
}


export type NoteIntervalHighlight = {
  note: string;
  interval: number;
};

export function getHighlightsFromIntervals(
  rootNote: string,
  intervals: readonly number[],
): NoteIntervalHighlight[] {
  return intervals.map((interval) => ({
    note: getNoteAtInterval(rootNote, interval),
    interval,
  }));
}


export type ChordMatch = {
  rootNote: string;
  chordName: string;
};

export function findExactChordMatches(
  selectedNotes: readonly string[],
  chords: Record<string, readonly number[]>,
): ChordMatch[] {
  const uniqueSelected = Array.from(new Set(selectedNotes));

  if (uniqueSelected.length < 2) {
    return [];
  }

  const selectedIndexes = uniqueSelected
    .map(getNoteIndex)
    .sort((a, b) => a - b);

  const matches: ChordMatch[] = [];

  CHROMATIC_NOTES.forEach((rootNote) => {
    Object.entries(chords).forEach(([chordName, intervals]) => {
      if (intervals.length !== selectedIndexes.length) {
        return;
      }

      const chordIndexes = getNoteIndexesFromIntervals(
        rootNote,
        intervals,
      ).sort((a, b) => a - b);

      const isExactMatch = chordIndexes.every(
        (noteIndex, index) =>
          noteIndex === selectedIndexes[index],
      );

      if (isExactMatch) {
        matches.push({
          rootNote,
          chordName,
        });
      }
    });
  });

  return matches;
}


export type NearChordMatch = ChordMatch & {
  missingNotes: string[];
  extraNotes: string[];
};

export function findNearChordMatches(
  selectedNotes: readonly string[],
  chords: Record<string, readonly number[]>,
): NearChordMatch[] {
  const uniqueSelected = Array.from(new Set(selectedNotes));

  if (uniqueSelected.length < 2) {
    return [];
  }

  const selectedIndexes = new Set(
    uniqueSelected.map(getNoteIndex),
  );

  const matches: NearChordMatch[] = [];

  CHROMATIC_NOTES.forEach((rootNote) => {
    Object.entries(chords).forEach(([chordName, intervals]) => {
      const chordIndexes = getNoteIndexesFromIntervals(
        rootNote,
        intervals,
      );

      const chordIndexSet = new Set(chordIndexes);

      const missingIndexes = chordIndexes.filter(
        (index) => !selectedIndexes.has(index),
      );

      const extraIndexes = Array.from(selectedIndexes).filter(
        (index) => !chordIndexSet.has(index),
      );

      const differenceCount =
        missingIndexes.length + extraIndexes.length;

      if (differenceCount === 1) {
        matches.push({
          rootNote,
          chordName,
          missingNotes: missingIndexes.map(
            (index) => CHROMATIC_NOTES[index],
          ),
          extraNotes: extraIndexes.map(
            (index) => CHROMATIC_NOTES[index],
          ),
        });
      }
    });
  });

  return matches.slice(0, 8);
}


export type FretboardPosition = {
  note: string;
  stringIndex: number;
  fret: number;
};

function getOpenStringPitchOffsets(
  tuning: readonly string[],
): number[] {
  if (tuning.length === 0) {
    return [];
  }

  const offsets: number[] = [];
  let previousPitch = getNoteIndex(tuning[0]);

  offsets.push(previousPitch);

  for (let stringIndex = 1; stringIndex < tuning.length; stringIndex += 1) {
    const pitchClass = getNoteIndex(tuning[stringIndex]);
    let absolutePitch = pitchClass;

    while (absolutePitch <= previousPitch) {
      absolutePitch += CHROMATIC_NOTES.length;
    }

    offsets.push(absolutePitch);
    previousPitch = absolutePitch;
  }

  return offsets;
}

export function getLowestSelectedNote(
  positions: readonly FretboardPosition[],
  tuning: readonly string[],
  suppliedOpenStringOffsets?: readonly number[],
): string | null {
  if (positions.length === 0) {
    return null;
  }

  const openStringOffsets =
    suppliedOpenStringOffsets ?? getOpenStringPitchOffsets(tuning);

  let lowestPosition = positions[0];
  let lowestPitch =
    openStringOffsets[lowestPosition.stringIndex] +
    lowestPosition.fret;

  for (const position of positions.slice(1)) {
    const pitch =
      openStringOffsets[position.stringIndex] +
      position.fret;

    if (pitch < lowestPitch) {
      lowestPitch = pitch;
      lowestPosition = position;
    }
  }

  return lowestPosition.note;
}

export function getChordInversionLabel(
  rootNote: string,
  bassNote: string | null,
  intervals: readonly number[],
): string | null {
  if (!bassNote) {
    return null;
  }

  const bassInterval = getIntervalBetweenNotes(
    bassNote,
    rootNote,
  );

  const chordTones = Array.from(new Set(intervals))
    .sort((a, b) => a - b);

  const inversionIndex =
    chordTones.indexOf(bassInterval);

  if (inversionIndex < 0) {
    return null;
  }

  if (inversionIndex === 0) {
    return "Root position";
  }

  const ordinal =
    inversionIndex === 1
      ? "1st"
      : inversionIndex === 2
        ? "2nd"
        : inversionIndex === 3
          ? "3rd"
          : `${inversionIndex}th`;

  return `${ordinal} inversion`;
}


export function getSelectedVoicingNotes(
  positions: readonly FretboardPosition[],
  tuning: readonly string[],
  suppliedOpenStringOffsets?: readonly number[],
): string[] {
  if (positions.length === 0) {
    return [];
  }

  const openStringOffsets =
    suppliedOpenStringOffsets ?? getOpenStringPitchOffsets(tuning);

  return [...positions]
    .map((position) => ({
      note: position.note,
      pitch:
        openStringOffsets[position.stringIndex] +
        position.fret,
    }))
    .sort((a, b) => a.pitch - b.pitch)
    .map((position) => position.note);
}


export type VoicingDoubling = {
  note: string;
  count: number;
};

export function getVoicingDoublings(
  positions: readonly FretboardPosition[],
): VoicingDoubling[] {
  const counts = new Map<string, number>();

  positions.forEach((position) => {
    counts.set(
      position.note,
      (counts.get(position.note) ?? 0) + 1,
    );
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([note, count]) => ({
      note,
      count,
    }));
}


export type ScaleComparisonResult = {
  shared: string[];
  onlyA: string[];
  onlyB: string[];
};

export function compareIntervalSets(
  rootNote: string,
  intervalsA: readonly number[],
  intervalsB: readonly number[],
): ScaleComparisonResult {
  const notesA = getNotesFromIntervals(rootNote, intervalsA);
  const notesB = getNotesFromIntervals(rootNote, intervalsB);

  const setA = new Set(notesA);
  const setB = new Set(notesB);

  return {
    shared: notesA.filter((note) => setB.has(note)),
    onlyA: notesA.filter((note) => !setB.has(note)),
    onlyB: notesB.filter((note) => !setA.has(note)),
  };
}


const NATURAL_NOTE_INDEXES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;

function parseRootLetter(rootNote: string): string {
  return rootNote[0];
}

function accidentalForDifference(diff: number): string {
  const normalized = ((diff + 6) % 12) - 6;

  if (normalized === 0) return "";
  if (normalized === 1) return "#";
  if (normalized === 2) return "##";
  if (normalized === -1) return "b";
  if (normalized === -2) return "bb";

  return "";
}

export function spellScaleNotes(
  rootNote: string,
  intervals: readonly number[],
): string[] {
  const rootLetter = parseRootLetter(rootNote);
  const rootLetterIndex = LETTERS.indexOf(
    rootLetter as (typeof LETTERS)[number],
  );

  if (rootLetterIndex < 0) {
    return getNotesFromIntervals(rootNote, intervals);
  }

  const rootPitch = getNoteIndex(rootNote);

  // Seven-note scales are diatonic in letter structure: each successive
  // scale degree uses the next letter name. This preserves spellings such
  // as F# in G major, Bb in F major, and altered degrees in modes.
  if (intervals.length === 7) {
    return intervals.map((interval, degreeIndex) => {
      const letter =
        LETTERS[(rootLetterIndex + degreeIndex) % LETTERS.length];

      const naturalPitch = NATURAL_NOTE_INDEXES[letter];
      const targetPitch = (rootPitch + interval) % 12;
      const diff = targetPitch - naturalPitch;

      return `${letter}${accidentalForDifference(diff)}`;
    });
  }

  // Pentatonic, blues and symmetrical collections do not always map to
  // seven consecutive letter names. Keep their pitch-class spelling stable
  // rather than forcing misleading diatonic letters.
  return getNotesFromIntervals(rootNote, intervals);
}

const CHORD_DEGREE_LETTER_STEPS: Record<number, number> = {
  0: 0,  // root
  1: 1,  // b2 / b9
  2: 1,  // 2 / 9
  3: 2,  // b3
  4: 2,  // 3
  5: 3,  // 4 / 11
  6: 4,  // b5 (default chord interpretation)
  7: 4,  // 5
  8: 4,  // #5 (default chord interpretation)
  9: 5,  // 6 / 13
  10: 6, // b7
  11: 6, // 7
};

function spellPitchForLetter(
  rootNote: string,
  interval: number,
  letterStep: number,
): string {
  const rootLetter = parseRootLetter(rootNote);
  const rootLetterIndex = LETTERS.indexOf(
    rootLetter as (typeof LETTERS)[number],
  );

  if (rootLetterIndex < 0) {
    return getNoteAtInterval(rootNote, interval);
  }

  const letter =
    LETTERS[(rootLetterIndex + letterStep) % LETTERS.length];
  const naturalPitch = NATURAL_NOTE_INDEXES[letter];
  const targetPitch =
    (getNoteIndex(rootNote) + interval) % CHROMATIC_NOTES.length;
  const diff = targetPitch - naturalPitch;

  return `${letter}${accidentalForDifference(diff)}`;
}

export function spellChordNotes(
  rootNote: string,
  chordName: string,
  intervals: readonly number[],
): string[] {
  return intervals.map((interval, index) => {
    if (index === 0) {
      return spellPitchForLetter(rootNote, interval, 0);
    }

    // A diminished seventh is a diminished seventh in notation, not a
    // major sixth: Cdim7 = C Eb Gb Bbb.
    if (chordName === "Diminished 7" && index === intervals.length - 1) {
      return spellPitchForLetter(rootNote, interval, 6);
    }

    const letterStep = CHORD_DEGREE_LETTER_STEPS[interval];

    if (letterStep === undefined) {
      return getNoteAtInterval(rootNote, interval);
    }

    return spellPitchForLetter(rootNote, interval, letterStep);
  });
}

export function getChordFormulaLabels(
  chordName: string,
  intervals: readonly number[],
): string[] {
  return intervals.map((interval, index) => {
    if (index === 0) return "R";

    if (chordName === "Diminished 7" && index === intervals.length - 1) {
      return "bb7";
    }

    if (interval === 1) return "b9";
    if (interval === 2) {
      return chordName.includes("Add9") ||
        chordName.includes(" 9") ||
        chordName.includes(" 11") ||
        chordName.includes(" 13")
        ? "9"
        : "2";
    }
    if (interval === 3) return "b3";
    if (interval === 4) return "3";
    if (interval === 5) {
      return chordName.includes(" 11") ? "11" : "4";
    }
    if (interval === 6) return "b5";
    if (interval === 7) return "5";
    if (interval === 8) return "#5";
    if (interval === 9) {
      return chordName.includes(" 13") ? "13" : "6";
    }
    if (interval === 10) return "b7";
    if (interval === 11) return "7";

    return INTERVAL_LABELS[interval] ?? String(interval);
  });
}

