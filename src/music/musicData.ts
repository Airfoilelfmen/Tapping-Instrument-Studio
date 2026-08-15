export const NUMBER_OF_FRETS = 24;

/*
  Original tuning from lowest string to highest string.
*/
export const ORIGINAL_TUNING = [
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "C",
  "D",
] as const;

export const CHROMATIC_NOTES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export const SCALES = {
  // Diatonic modes
  Major: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  "Natural Minor (Aeolian)": [0, 2, 3, 5, 7, 8, 10],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10],
  "Blues Minor": [0, 3, 5, 6, 7, 10],

  // Minor scale family
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],

  // Modes of Melodic Minor
  "Dorian b2": [0, 1, 3, 5, 7, 9, 10],
  "Lydian Augmented": [0, 2, 4, 6, 8, 9, 11],
  "Lydian Dominant": [0, 2, 4, 6, 7, 9, 10],
  "Mixolydian b6": [0, 2, 4, 5, 7, 8, 10],
  "Locrian ♮2": [0, 2, 3, 5, 6, 8, 10],
  "Locrian natural 2": [0, 2, 3, 5, 6, 8, 10],
  "Altered (Super Locrian)": [0, 1, 3, 4, 6, 8, 10],

  // Modes of Harmonic Minor
  "Locrian ♮6": [0, 1, 3, 5, 6, 9, 10],
  "Locrian natural 6": [0, 1, 3, 5, 6, 9, 10],
  "Ionian #5": [0, 2, 4, 5, 8, 9, 11],
  "Dorian #4": [0, 2, 3, 6, 7, 9, 10],
  "Phrygian Dominant": [0, 1, 4, 5, 7, 8, 10],
  "Lydian #2": [0, 3, 4, 6, 7, 9, 11],
  "Ultra Locrian": [0, 1, 3, 4, 6, 8, 9],

  // Pentatonic & Blues
  "Major Pentatonic": [0, 2, 4, 7, 9],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
  "Major Blues": [0, 2, 3, 4, 7, 9],
  "Minor Blues": [0, 3, 5, 6, 7, 10],

  // Symmetrical scales
  "Whole Tone": [0, 2, 4, 6, 8, 10],
  "Diminished Half-Whole": [0, 1, 3, 4, 6, 7, 9, 10],
  "Diminished Whole-Half": [0, 2, 3, 5, 6, 8, 9, 11],
  "Augmented": [0, 3, 4, 7, 8, 11],
} as const;

export const CHORDS = {
  Major: [0, 4, 7],
  Minor: [0, 3, 7],
  Diminished: [0, 3, 6],
  Augmented: [0, 4, 8],
  Sus2: [0, 2, 7],
  Sus4: [0, 5, 7],
  "Major 6": [0, 4, 7, 9],
  "Minor 6": [0, 3, 7, 9],
  "Major 7": [0, 4, 7, 11],
  "Dominant 7": [0, 4, 7, 10],
  "Minor 7": [0, 3, 7, 10],
  "Minor Major 7": [0, 3, 7, 11],
  "Half-Diminished 7": [0, 3, 6, 10],
  "Diminished 7": [0, 3, 6, 9],
  Add9: [0, 2, 4, 7],
  "Minor Add9": [0, 2, 3, 7],
  "Major 9": [0, 2, 4, 7, 11],
  "Dominant 9": [0, 2, 4, 7, 10],
  "Minor 9": [0, 2, 3, 7, 10],
  "Major 11": [0, 2, 4, 5, 7, 11],
  "Minor 11": [0, 2, 3, 5, 7, 10],
  "Dominant 13": [0, 2, 4, 7, 9, 10],
} as const;

export const ALL_FRET_MARKERS = [
  3,
  5,
  7,
  9,
  12,
  15,
  17,
  19,
  21,
  24,
  27,
  29,
  31,
  33,
  36,
];

export const DOUBLE_FRET_MARKERS = [12, 24, 36];

export type ScaleName = keyof typeof SCALES;

export const SCALE_GROUPS: {
  label: string;
  scales: ScaleName[];
}[] = [
  { label: "Diatonic Modes", scales: ["Major","Dorian","Phrygian","Lydian","Mixolydian","Aeolian","Locrian"] },
  { label: "Minor Family", scales: ["Natural Minor (Aeolian)","Harmonic Minor","Melodic Minor"] },
  { label: "Melodic Minor Modes", scales: ["Dorian b2","Lydian Augmented","Lydian Dominant","Mixolydian b6","Locrian ♮2","Altered (Super Locrian)"] },
  { label: "Harmonic Minor Modes", scales: ["Locrian ♮6","Ionian #5","Dorian #4","Phrygian Dominant","Lydian #2","Ultra Locrian"] },
  { label: "Pentatonic & Blues", scales: ["Major Pentatonic","Minor Pentatonic","Major Blues","Minor Blues"] },
  { label: "Symmetrical", scales: ["Whole Tone","Diminished Half-Whole","Diminished Whole-Half","Augmented"] },
];
export type ChordName = keyof typeof CHORDS;
export type DisplayMode = "scale" | "chord" | "custom";

export type LabelMode =
  | "notes"
  | "intervals"
  | "semitones"
  | "hidden";

export const INTERVAL_LABELS = [
  "R",
  "b2",
  "2",
  "b3",
  "3",
  "4",
  "#4",
  "5",
  "b6",
  "6",
  "b7",
  "7",
] as const;