export type AccidentalPreference =
  | "sharp"
  | "flat";

export const ROOT_NOTE_OPTIONS = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B",
] as const;

const SHARP_NOTE_LABELS: Record<string, string> = {
  C: "C",
  Db: "C#",
  "C#": "C#",
  D: "D",
  Eb: "D#",
  "D#": "D#",
  E: "E",
  F: "F",
  Gb: "F#",
  "F#": "F#",
  G: "G",
  Ab: "G#",
  "G#": "G#",
  A: "A",
  Bb: "A#",
  "A#": "A#",
  B: "B",
};

const FLAT_NOTE_LABELS: Record<string, string> = {
  C: "C",
  "C#": "Db",
  Db: "Db",
  D: "D",
  "D#": "Eb",
  Eb: "Eb",
  E: "E",
  F: "F",
  "F#": "Gb",
  Gb: "Gb",
  G: "G",
  "G#": "Ab",
  Ab: "Ab",
  A: "A",
  "A#": "Bb",
  Bb: "Bb",
  B: "B",
};

let currentPreference: AccidentalPreference =
  "sharp";

export function setNoteDisplayPreference(
  preference: AccidentalPreference,
): void {
  currentPreference = preference;
}

export function getNoteDisplayPreference():
  AccidentalPreference {
  return currentPreference;
}

export function preferenceFromSpelling(
  note: string,
  fallback: AccidentalPreference,
): AccidentalPreference {
  if (note.includes("#")) return "sharp";
  if (note.includes("b")) return "flat";
  return fallback;
}

export function displayNote(
  note: string,
  preference: AccidentalPreference =
    currentPreference,
): string {
  const labels =
    preference === "flat"
      ? FLAT_NOTE_LABELS
      : SHARP_NOTE_LABELS;

  /*
   * Only normalize the ordinary enharmonic pitch-class names.
   * Theoretical spellings such as E#, Cb, Bbb, F## are kept intact,
   * because they can carry real harmonic meaning.
   */
  return labels[note] ?? note;
}

export function displayNotes(
  notes: readonly string[],
  preference: AccidentalPreference =
    currentPreference,
): string[] {
  return notes.map((note) =>
    displayNote(note, preference),
  );
}

export function displayChordToneDetail(
  detail: string,
  preference: AccidentalPreference =
    currentPreference,
): string {
  const match = detail.match(/^([^\s]+)(.*)$/);

  if (!match) {
    return detail;
  }

  return `${displayNote(
    match[1],
    preference,
  )}${match[2]}`;
}

export function displayChordToneDetails(
  details: readonly string[],
  preference: AccidentalPreference =
    currentPreference,
): string[] {
  return details.map((detail) =>
    displayChordToneDetail(
      detail,
      preference,
    ),
  );
}
