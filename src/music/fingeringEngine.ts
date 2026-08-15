export type FingeringHand = "left" | "right";

export type FingeringPosition = {
  noteIndex: number;
  stringIndex: number;
  fret: number;
  hand: FingeringHand;
};

export type FingeringRun = {
  id: string;
  score: number;
  difficulty: "Easy" | "Moderate" | "Wide";
  positions: FingeringPosition[];
};

type FingeringEngineOptions = {
  tuningNoteIndexes: number[];
  scaleNoteIndexes: number[];
  rootNoteIndex: number;
  fromFret: number;
  toFret: number;
  nonPlayableFrets?: readonly number[];
  leftHandStringIndexes: number[];
  rightHandStringIndexes: number[];
  runLength?: number;
};

function circularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 12;
  return Math.min(diff, 12 - diff);
}

function buildScaleSequence(
  scaleNoteIndexes: number[],
  rootNoteIndex: number,
  runLength: number,
): number[] {
  const ordered = [...new Set(scaleNoteIndexes)]
    .map((noteIndex) => ({
      noteIndex,
      distance: (noteIndex - rootNoteIndex + 12) % 12,
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.noteIndex);

  if (ordered.length === 0) {
    return [];
  }

  const sequence: number[] = [];

  for (let i = 0; i < runLength; i += 1) {
    sequence.push(ordered[i % ordered.length]);
  }

  return sequence;
}

function getCandidatePositions(
  tuningNoteIndexes: number[],
  targetNoteIndex: number,
  fromFret: number,
  toFret: number,
  nonPlayableFrets: readonly number[],
  allowedStrings: number[],
): FingeringPosition[] {
  const allowed = new Set(allowedStrings);

  return tuningNoteIndexes.flatMap((openIndex, stringIndex) => {
    if (!allowed.has(stringIndex)) {
      return [];
    }

    const positions: FingeringPosition[] = [];

    for (let fret = fromFret; fret <= toFret; fret += 1) {
      if (nonPlayableFrets.includes(fret)) {
        continue;
      }

      if ((openIndex + fret) % 12 === targetNoteIndex) {
        positions.push({
          noteIndex: targetNoteIndex,
          stringIndex,
          fret,
          hand: "left",
        });
      }
    }

    return positions;
  });
}

function evaluateHandPath(
  positions: FingeringPosition[],
): number {
  if (positions.length <= 1) {
    return 0;
  }

  let score = 0;
  let minFret = positions[0].fret;
  let maxFret = positions[0].fret;

  for (let i = 1; i < positions.length; i += 1) {
    const prev = positions[i - 1];
    const current = positions[i];

    const fretJump = Math.abs(current.fret - prev.fret);
    const stringJump = Math.abs(
      current.stringIndex - prev.stringIndex,
    );

    // Prefer compact movement, but allow diagonal shapes.
    score += fretJump * 1.8;
    score += stringJump * 0.9;

    // Repeating exactly the same physical point is impossible for
    // successive notes; strongly reject it.
    if (
      current.fret === prev.fret &&
      current.stringIndex === prev.stringIndex
    ) {
      score += 50;
    }

    // Very tight clustering on adjacent strings at the same fret can be
    // awkward with neighboring fingers on tapping instruments.
    if (fretJump === 0 && stringJump === 1) {
      score += 3.5;
    }

    // Large skips are possible but should rank lower.
    if (fretJump >= 4) {
      score += (fretJump - 3) * 3;
    }

    if (stringJump >= 3) {
      score += (stringJump - 2) * 2.5;
    }

    minFret = Math.min(minFret, current.fret);
    maxFret = Math.max(maxFret, current.fret);
  }

  const reach = maxFret - minFret;

  // Four active fingers per hand: prefer a hand footprint that stays
  // within roughly four frets.
  if (reach > 4) {
    score += (reach - 4) * 5;
  }

  return score;
}

function buildHandRun(
  sequence: number[],
  candidatesByNote: Map<number, FingeringPosition[]>,
  hand: FingeringHand,
): FingeringPosition[] | null {
  const result: FingeringPosition[] = [];

  for (const noteIndex of sequence) {
    const candidates = candidatesByNote.get(noteIndex) ?? [];

    if (candidates.length === 0) {
      return null;
    }

    const previous = result[result.length - 1];

    const ranked = candidates
      .map((candidate) => {
        let cost = 0;

        if (previous) {
          cost += Math.abs(candidate.fret - previous.fret) * 1.8;
          cost +=
            Math.abs(candidate.stringIndex - previous.stringIndex) *
            0.9;

          if (
            candidate.fret === previous.fret &&
            candidate.stringIndex === previous.stringIndex
          ) {
            cost += 50;
          }

          if (
            candidate.fret === previous.fret &&
            Math.abs(
              candidate.stringIndex - previous.stringIndex,
            ) === 1
          ) {
            cost += 3.5;
          }
        }

        return { candidate, cost };
      })
      .sort((a, b) => a.cost - b.cost);

    result.push({
      ...ranked[0].candidate,
      hand,
    });
  }

  return result;
}

export function findTwoHandScaleRuns(
  options: FingeringEngineOptions,
): FingeringRun[] {
  const {
    tuningNoteIndexes,
    scaleNoteIndexes,
    rootNoteIndex,
    fromFret,
    toFret,
    nonPlayableFrets = [],
    leftHandStringIndexes,
    rightHandStringIndexes,
    runLength = 8,
  } = options;

  const sequence = buildScaleSequence(
    scaleNoteIndexes,
    rootNoteIndex,
    runLength,
  );

  if (sequence.length === 0) {
    return [];
  }

  const leftCandidates = new Map<
    number,
    FingeringPosition[]
  >();
  const rightCandidates = new Map<
    number,
    FingeringPosition[]
  >();

  for (const noteIndex of new Set(sequence)) {
    leftCandidates.set(
      noteIndex,
      getCandidatePositions(
        tuningNoteIndexes,
        noteIndex,
        fromFret,
        toFret,
        nonPlayableFrets,
        leftHandStringIndexes,
      ),
    );

    rightCandidates.set(
      noteIndex,
      getCandidatePositions(
        tuningNoteIndexes,
        noteIndex,
        fromFret,
        toFret,
        nonPlayableFrets,
        rightHandStringIndexes,
      ),
    );
  }

  // Try a few musically sensible distributions between the two hands.
  const splits = [3, 4, 5];
  const runs: FingeringRun[] = [];

  for (const split of splits) {
    const leftSequence = sequence.slice(0, split);
    const rightSequence = sequence.slice(split);

    const leftPath = buildHandRun(
      leftSequence,
      leftCandidates,
      "left",
    );
    const rightPath = buildHandRun(
      rightSequence,
      rightCandidates,
      "right",
    );

    if (!leftPath || !rightPath) {
      continue;
    }

    const leftScore = evaluateHandPath(leftPath);
    const rightScore = evaluateHandPath(rightPath);

    // Encourage the two hands to occupy distinct regions instead of
    // converging on nearly identical frets.
    const leftAverageFret =
      leftPath.reduce((sum, p) => sum + p.fret, 0) /
      Math.max(1, leftPath.length);
    const rightAverageFret =
      rightPath.reduce((sum, p) => sum + p.fret, 0) /
      Math.max(1, rightPath.length);

    let overlapPenalty = 0;
    if (
      circularDistance(
        Math.round(leftAverageFret),
        Math.round(rightAverageFret),
      ) <= 1
    ) {
      overlapPenalty = 4;
    }

    const score = leftScore + rightScore + overlapPenalty;

    runs.push({
      id: `split-${split}`,
      score,
      difficulty:
        score <= 18
          ? "Easy"
          : score <= 30
            ? "Moderate"
            : "Wide",
      positions: [...leftPath, ...rightPath],
    });
  }

  return runs
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}
