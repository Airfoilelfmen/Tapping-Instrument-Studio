import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CHORDS,
  CHROMATIC_NOTES,
  SCALES,
  type ChordName,
  type DisplayMode,
  type ScaleName,
} from "../music/musicData";

import {
  chooseHarmonicPathCandidate,
  compareHarmonicEvents,
  createHarmonicEvent,
  createHarmonicPath,
  generateHarmonicPathBranch,
  getCurrentPathEvent,
  getEventTones,
  stepBackHarmonicPath,
  toPitchClass,
  type HarmonicCandidate,
  type HarmonicEvent,
  type HarmonicPath,
  type PitchConstraint,
  type RelationshipView,
} from "../music/harmonicRelationships";

import {
  displayNote,
  displayNotes,
  type AccidentalPreference,
} from "../music/noteDisplay";

export type RelationshipFretboardState = {
  rootNote: string;
  chordName: string;
  activeNoteIndexes: number[];
  displayNames: Record<string, string>;
  preservedNoteIndexes: number[];
  newNoteIndexes: number[];
  resolutionTargetNoteIndexes: number[];
  pathLength: number;
};

type RelationshipsPanelProps = {
  displayMode: DisplayMode;
  rootNote: string;
  selectedScale: ScaleName;
  selectedChord: ChordName;
  customNotes: string[];
  notationPreference: AccidentalPreference;
  fretboardVisualizationEnabled: boolean;
  onFretboardStateChange: (
    state: RelationshipFretboardState | null,
  ) => void;
};

type SimpleDirection =
  | "stay-close"
  | "transform"
  | "explore";

const ADVANCED_NOTE_OPTIONS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F",
  "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B",
] as const;

function createSourceEvent(
  displayMode: DisplayMode,
  rootNote: string,
  selectedScale: ScaleName,
  selectedChord: ChordName,
  customNotes: string[],
): HarmonicEvent {
  if (displayMode === "scale") {
    return createHarmonicEvent(
      `relationships-source-scale-${rootNote}-${selectedScale}`,
      rootNote,
      selectedScale,
      SCALES[selectedScale],
    );
  }

  if (displayMode === "custom") {
    const customRoot =
      customNotes[0] ?? rootNote;

    const rootPitchClass =
      toPitchClass(customRoot);

    const customIntervals =
      Array.from(
        new Set(
          customNotes.map((note) => {
            const pitchClass =
              toPitchClass(note);

            return (
              pitchClass -
              rootPitchClass +
              CHROMATIC_NOTES.length
            ) % CHROMATIC_NOTES.length;
          }),
        ),
      ).sort((a, b) => a - b);

    return createHarmonicEvent(
      `relationships-source-custom-${customRoot}-${customNotes.join("-")}`,
      customRoot,
      "Custom",
      customIntervals.length > 0
        ? customIntervals
        : [0],
    );
  }

  return createHarmonicEvent(
    `relationships-source-chord-${rootNote}-${selectedChord}`,
    rootNote,
    selectedChord,
    CHORDS[selectedChord],
  );
}

function viewLabel(view: SimpleDirection): string {
  if (view === "stay-close") return "Stay Close";
  if (view === "transform") return "Change Character";
  return "Explore";
}

function viewDescription(view: SimpleDirection): string {
  if (view === "stay-close") {
    return "Keep most notes in common.";
  }

  if (view === "transform") {
    return "Keep some notes, change the harmonic color.";
  }

  return "Move toward less obvious harmonic options.";
}

function eventName(
  event: HarmonicEvent,
  notationPreference: AccidentalPreference,
): string {
  return `${displayNote(
    event.root,
    notationPreference,
  )} ${event.chordName}`;
}

function RelationshipsPanel({
  displayMode,
  rootNote,
  selectedScale,
  selectedChord,
  customNotes,
  notationPreference,
  fretboardVisualizationEnabled,
  onFretboardStateChange,
}: RelationshipsPanelProps) {
  const initialEvent = useMemo(
    () =>
      createSourceEvent(
        displayMode,
        rootNote,
        selectedScale,
        selectedChord,
        customNotes,
      ),
    [
      displayMode,
      rootNote,
      selectedScale,
      selectedChord,
      customNotes,
    ],
  );

  const [path, setPath] =
    useState<HarmonicPath>(() =>
      createHarmonicPath(
        "relationships-simple-path",
        initialEvent,
        "Harmony exploration",
      ),
    );

  const [view, setView] =
    useState<SimpleDirection>("stay-close");

  const [keptPitchClasses, setKeptPitchClasses] =
    useState<number[]>([]);

  const [previewCandidate, setPreviewCandidate] =
    useState<HarmonicCandidate | null>(null);

  const [advancedOpen, setAdvancedOpen] =
    useState(false);

  const [resolveSource, setResolveSource] =
    useState("");

  const [resolveTarget, setResolveTarget] =
    useState("");

  const [requiredPitch, setRequiredPitch] =
    useState("");

  useEffect(() => {
    const next =
      createSourceEvent(
        displayMode,
        rootNote,
        selectedScale,
        selectedChord,
        customNotes,
      );

    setPath(
      createHarmonicPath(
        "relationships-simple-path",
        next,
        "Harmony exploration",
      ),
    );

    setKeptPitchClasses([]);
    setPreviewCandidate(null);
    setResolveSource("");
    setResolveTarget("");
    setRequiredPitch("");
  }, [
    displayMode,
    rootNote,
    selectedScale,
    selectedChord,
    customNotes,
  ]);

  const currentEvent =
    getCurrentPathEvent(path);

  const currentTones =
    getEventTones(currentEvent);

  const constraints = useMemo(() => {
    const result: PitchConstraint[] =
      currentTones.map((tone) => ({
        pitch: tone.pitch,
        intent: keptPitchClasses.includes(tone.pitchClass)
          ? "hold"
          : "free",
      }));

    if (
      advancedOpen &&
      resolveSource &&
      resolveTarget
    ) {
      const sourceIndex =
        result.findIndex(
          (constraint) =>
            constraint.pitch === resolveSource,
        );

      const resolveConstraint: PitchConstraint = {
        pitch: resolveSource,
        intent: "resolve",
        targetPitch: resolveTarget,
      };

      if (sourceIndex >= 0) {
        result[sourceIndex] =
          resolveConstraint;
      } else {
        result.push(resolveConstraint);
      }
    }

    if (
      advancedOpen &&
      requiredPitch
    ) {
      result.push({
        pitch: requiredPitch,
        intent: "add",
      });
    }

    return result;
  }, [
    currentTones,
    keptPitchClasses,
    advancedOpen,
    resolveSource,
    resolveTarget,
    requiredPitch,
  ]);

  const branch = useMemo(
    () =>
      generateHarmonicPathBranch(
        path,
        constraints,
        { limit: 48 },
      ),
    [path, constraints],
  );

  const ranked =
    view === "stay-close"
      ? branch.views.stayClose
      : view === "transform"
        ? branch.views.transform
        : branch.views.explore;

  const suggestions =
    ranked.slice(0, 4);

  useEffect(() => {
    /*
     * Relationships only takes visual control of the fretboard
     * while the musician is actively previewing a suggestion.
     *
     * Without a preview, Fretboard Highlight (or Off) owns the
     * fretboard visualization.
     */
    if (!previewCandidate || !fretboardVisualizationEnabled) {
      onFretboardStateChange(null);
      return;
    }

    const displayedEvent =
      previewCandidate.event;

    const displayedTones =
      getEventTones(displayedEvent);

    const relationship =
      compareHarmonicEvents(
        currentEvent,
        previewCandidate.event,
      );

    const resolutionTargets =
      constraints
        .filter(
          (constraint) =>
            constraint.intent === "resolve" &&
            Boolean(constraint.targetPitch),
        )
        .map((constraint) =>
          toPitchClass(
            constraint.targetPitch!,
          ),
        );

    onFretboardStateChange({
      rootNote: displayedEvent.root,
      chordName: displayedEvent.chordName,
      activeNoteIndexes:
        displayedTones.map(
          (tone) => tone.pitchClass,
        ),
      displayNames:
        Object.fromEntries(
          displayedTones.map((tone) => [
            CHROMATIC_NOTES[tone.pitchClass],
            displayNote(
              tone.pitch,
              notationPreference,
            ),
          ]),
        ),
      preservedNoteIndexes:
        relationship.sharedTones.map(
          (tone) => tone.pitchClass,
        ),
      newNoteIndexes:
        relationship.addedTones.map(
          (tone) => tone.pitchClass,
        ),
      resolutionTargetNoteIndexes:
        resolutionTargets,
      pathLength: path.events.length,
    });

    return () => {
      onFretboardStateChange(null);
    };
  }, [
    path,
    currentEvent,
    previewCandidate,
    constraints,
    fretboardVisualizationEnabled,
    onFretboardStateChange,
  ]);

  function toggleKeep(
    pitchClass: number,
  ) {
    setKeptPitchClasses(
      (current) =>
        current.includes(pitchClass)
          ? current.filter(
              (value) =>
                value !== pitchClass,
            )
          : [...current, pitchClass],
    );

    setPreviewCandidate(null);
  }

  function commitPreview() {
    if (!previewCandidate) return;

    const nextPath =
      chooseHarmonicPathCandidate(
        path,
        previewCandidate,
        constraints,
      );

    setPath(nextPath);
    setPreviewCandidate(null);
    setKeptPitchClasses([]);
    setResolveSource("");
    setResolveTarget("");
    setRequiredPitch("");
  }

  function back() {
    if (previewCandidate) {
      setPreviewCandidate(null);
      return;
    }

    const nextPath =
      stepBackHarmonicPath(path);

    setPath(nextPath);
    setKeptPitchClasses([]);
    setResolveSource("");
    setResolveTarget("");
    setRequiredPitch("");
  }

  function reset() {
    const next =
      createSourceEvent(
        displayMode,
        rootNote,
        selectedScale,
        selectedChord,
        customNotes,
      );

    setPath(
      createHarmonicPath(
        "relationships-simple-path",
        next,
        "Harmony exploration",
      ),
    );

    setPreviewCandidate(null);
    setKeptPitchClasses([]);
    setResolveSource("");
    setResolveTarget("");
    setRequiredPitch("");
  }

  const previewName =
    previewCandidate
      ? eventName(
          previewCandidate.event,
          notationPreference,
        )
      : null;

  return (
    <section className="relationshipsSimple">
      <div className="relationshipsSimpleHeader">
        <div>
          <span className="simplePanelEyebrow">
            Harmony Relationships
          </span>
          <h2>
            Where could{" "}
            {eventName(currentEvent, notationPreference)} go?
          </h2>
        </div>

      </div>

      <div className="relationshipsSimpleDirections">
        {(
          [
            "stay-close",
            "transform",
            "explore",
          ] as RelationshipView[]
        ).map((option) => (
          <button
            type="button"
            key={option}
            className={
              view === option
                ? `active ${option}`
                : option
            }
            onClick={() => {
              setView(option as SimpleDirection);
              setPreviewCandidate(null);
            }}
          >
            <strong>
              {viewLabel(option as SimpleDirection)}
            </strong>
            <span>
              {viewDescription(option as SimpleDirection)}
            </span>
          </button>
        ))}
      </div>

      <div className="relationshipsSimpleKeep">
        <div className="relationshipsSimpleKeepHeading">
          <div>
            <strong>Keep notes</strong>
            <span>
              Optional — choose notes you want to preserve.
            </span>
          </div>

          <button
            type="button"
            className="relationshipsAdvancedToggle"
            onClick={() =>
              setAdvancedOpen(
                (current) => !current,
              )
            }
          >
            Guide the Harmony{" "}
            {advancedOpen ? "▴" : "▾"}
          </button>
        </div>

        <div className="relationshipsKeepNotes">
          {currentTones.map((tone) => (
            <button
              type="button"
              key={`keep-${tone.pitchClass}`}
              className={
                keptPitchClasses.includes(
                  tone.pitchClass,
                )
                  ? "selected"
                  : ""
              }
              onClick={() =>
                toggleKeep(
                  tone.pitchClass,
                )
              }
            >
              {displayNote(
                tone.pitch,
                notationPreference,
              )}
            </button>
          ))}
        </div>

        {advancedOpen && (
          <div className="relationshipsAdvanced">
            <div className="relationshipsAdvancedSection">
              <div className="relationshipsAdvancedCopy">
                <strong>Resolve a note</strong>
                <span>
                  Choose a note from the current harmony and where you want it to move.
                </span>
              </div>

              <div className="relationshipsAdvancedField relationshipsResolveField">
                <select
                  value={resolveSource}
                  aria-label="Resolve source note"
                  onChange={(event) => {
                    const source =
                      event.target.value;

                    setResolveSource(source);

                    if (
                      source &&
                      !resolveTarget
                    ) {
                      const sourceClass =
                        toPitchClass(source);

                      setResolveTarget(
                        displayNote(
                          CHROMATIC_NOTES[
                            (sourceClass + 1) %
                            CHROMATIC_NOTES.length
                          ],
                          notationPreference,
                        ),
                      );
                    }
                  }}
                >
                  <option value="">
                    No resolution
                  </option>
                  {currentTones.map(
                    (tone) => (
                      <option
                        key={`resolve-source-${tone.pitchClass}`}
                        value={tone.pitch}
                      >
                        {displayNote(
                          tone.pitch,
                          notationPreference,
                        )}
                      </option>
                    ),
                  )}
                </select>

                {resolveSource && (
                  <>
                    <span
                      className="relationshipsResolveArrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                    <select
                      value={resolveTarget}
                      aria-label="Resolve target note"
                      onChange={(event) =>
                        setResolveTarget(
                          event.target.value,
                        )
                      }
                    >
                      {ADVANCED_NOTE_OPTIONS.map(
                        (note) => (
                          <option
                            key={`resolve-target-${note}`}
                            value={note}
                          >
                            {note}
                          </option>
                        ),
                      )}
                    </select>
                  </>
                )}
              </div>
            </div>

            <div className="relationshipsAdvancedSection">
              <div className="relationshipsAdvancedCopy">
                <strong>Require a note</strong>
                <span>
                  Only show harmonic options that include this note.
                </span>
              </div>

              <label className="relationshipsAdvancedField">
                <select
                  value={requiredPitch}
                  aria-label="Required note"
                  onChange={(event) =>
                    setRequiredPitch(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    None
                  </option>
                  {ADVANCED_NOTE_OPTIONS.map(
                    (note) => (
                      <option
                        key={`require-${note}`}
                        value={note}
                      >
                        {note}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className={`relationshipsSimpleSuggestions ${view}`}>
        {suggestions.map(
          (result) => {
            const candidate =
              result.candidate;

            const isPreviewed =
              previewCandidate?.event.id ===
              candidate.event.id;

            return (
              <button
                type="button"
                key={candidate.event.id}
                className={
                  isPreviewed
                    ? "relationshipSuggestion selected"
                    : "relationshipSuggestion"
                }
                onClick={() =>
                  setPreviewCandidate(
                    candidate,
                  )
                }
              >
                <strong>
                  {eventName(candidate.event, notationPreference)}
                </strong>

                <span>
                  {
                    candidate
                      .preservedPitches
                      .length
                  }{" "}
                  note
                  {
                    candidate
                      .preservedPitches
                      .length === 1
                      ? ""
                      : "s"
                  }{" "}
                  in common
                </span>

                <small>
                  {candidate.addedPitches.length > 0
                    ? `Adds ${displayNotes(
                        candidate.addedPitches,
                        notationPreference,
                      ).join(" · ")}`
                    : "No new pitch required"}
                </small>
              </button>
            );
          },
        )}
      </div>

      <div className="relationshipsSimpleFooter">
        <div>
          <span>
            {previewName
              ? "Previewing"
              : "Preview"}
          </span>
          <strong>
            {previewName ??
              "Choose one of the suggestions above."}
          </strong>
        </div>

        {path.events.length > 1 && (
          <div className="relationshipsFooterPath">
            <span className="relationshipsFooterPathLabel">
              Path
            </span>
            <div className="relationshipsFooterPathEvents">
              {path.events.map(
                (event, index) => (
                  <span
                    key={`${event.id}-${index}`}
                    className="relationshipsFooterPathEvent"
                  >
                    {index > 0 && (
                      <span
                        className="relationshipsFooterPathArrow"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    )}
                    <strong>
                      {eventName(
                        event,
                        notationPreference,
                      )}
                    </strong>
                  </span>
                ),
              )}
            </div>
          </div>
        )}

        <div className="relationshipsSimpleActions">
          {(previewCandidate ||
            path.events.length > 1) && (
            <button
              type="button"
              onClick={back}
            >
              {previewCandidate
                ? "Cancel Preview"
                : "Back"}
            </button>
          )}

          {path.events.length > 1 && (
            <button
              type="button"
              onClick={reset}
            >
              Reset
            </button>
          )}

          <button
            type="button"
            className="relationshipsAddToPath"
            disabled={!previewCandidate}
            onClick={commitPreview}
          >
            Add to Path
          </button>
        </div>
      </div>
    </section>
  );
}

export default RelationshipsPanel;
