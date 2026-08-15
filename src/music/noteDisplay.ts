const SHARP_NOTE_LABELS: Record<string, string> = {
  C: "C",
  Db: "C#",
  D: "D",
  Eb: "D#",
  E: "E",
  F: "F",
  Gb: "F#",
  G: "G",
  Ab: "G#",
  A: "A",
  Bb: "A#",
  B: "B",
};

export function displayNote(note: string): string {
  return SHARP_NOTE_LABELS[note] ?? note;
}

export function displayNotes(notes: readonly string[]): string[] {
  return notes.map(displayNote);
}


export function displayChordToneDetail(
  detail: string,
): string {
  const match = detail.match(/^([^\s]+)(.*)$/);

  if (!match) {
    return detail;
  }

  return `${displayNote(match[1])}${match[2]}`;
}

export function displayChordToneDetails(
  details: readonly string[],
): string[] {
  return details.map(displayChordToneDetail);
}
