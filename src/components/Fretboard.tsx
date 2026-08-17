import {
  ALL_FRET_MARKERS,
  CHROMATIC_NOTES,
  DOUBLE_FRET_MARKERS,
  INTERVAL_LABELS,
  type DisplayMode,
  type LabelMode,
} from "../music/musicData";
import { displayNote } from "../music/noteDisplay";

export type ExplorerHighlight = {
  note: string;
  interval: number;
};

type FretboardStringGroup = {
  id: string;
  name: string;
  stringNumbers: readonly number[];
  gaugeDirection: "thick-to-thin" | "thin-to-thick";
};

type FretboardProps = {
  tuning: string[];
  frets: number;
  nonPlayableFrets: readonly number[];
  stringGroups: readonly FretboardStringGroup[];
  displayMode: DisplayMode;
  labelMode: LabelMode;
  rootNote: string;
  activeNoteIndexes: number[];
  customNotes: string[];
  showOutsideNotes: boolean;
  practiceRangeEnabled: boolean;
  practiceRangeFrom: number;
  practiceRangeTo: number;
  practiceScalePath: {
    noteIndex: number;
    stringIndex: number;
    fret: number;
  }[];
  practicePathReviewIndex: number | null;
  octaveHighlightEnabled: boolean;
  highlightedNote: string | null;
  explorerEnabled: boolean;
  explorerHighlights: ExplorerHighlight[];
  compareEnabled: boolean;
  compareSharedNotes: string[];
  compareOnlyANotes: string[];
  compareOnlyBNotes: string[];
  compareDisplayNames: Record<string, string>;
  analyzerEnabled: boolean;
  analyzerPositions: {
    note: string;
    stringIndex: number;
    fret: number;
  }[];
  relationshipEnabled: boolean;
  relationshipDisplayNames: Record<string, string>;
  relationshipPreservedNoteIndexes: number[];
  relationshipNewNoteIndexes: number[];
  relationshipResolutionTargetNoteIndexes: number[];
  selectedPosition: {
    stringIndex: number;
    fret: number;
  } | null;
  onNoteClick: (
    note: string,
    stringIndex: number,
    fret: number,
    tuningStringIndex: number,
  ) => void;
  onNoteDoubleClick: (
    note: string,
    stringIndex: number,
    fret: number,
  ) => void;
};



const standardLabelWidth = 82;
const groupedLabelWidth = 220;
const openStringWidth = 72;
const neckWidth = 1850;
const rightMargin = 38;

const stringSpacing = 58;
const topMargin = 82;
const bottomMargin = 84;

const standardFretboardStartX =
  standardLabelWidth + openStringWidth;

function getNoteIndex(note: string): number {
  const enharmonicMap: Record<string, string> = {
    "C#": "Db",
    "D#": "Eb",
    "F#": "Gb",
    "G#": "Ab",
    "A#": "Bb",
  };

  const normalizedNote =
    enharmonicMap[note] ?? note;

  return CHROMATIC_NOTES.indexOf(
    normalizedNote as (typeof CHROMATIC_NOTES)[number],
  );
}

function getNoteAtFret(openNote: string, fret: number): string {
  const openNoteIndex = getNoteIndex(openNote);

  if (openNoteIndex === -1) {
    return "?";
  }

  return CHROMATIC_NOTES[
    (openNoteIndex + fret) % CHROMATIC_NOTES.length
  ];
}

function getFretX(
  fret: number,
  numberOfFrets: number,
  fretboardStartX = standardFretboardStartX,
): number {
  if (fret === 0) {
    return fretboardStartX;
  }

  const fretRatio = 1 - Math.pow(2, -fret / 12);
  const finalFretRatio =
    1 - Math.pow(2, -numberOfFrets / 12);

  return (
    fretboardStartX +
    neckWidth * (fretRatio / finalFretRatio)
  );
}

function getFretCenterX(
  fret: number,
  numberOfFrets: number,
  fretboardStartX = standardFretboardStartX,
  labelWidth = standardLabelWidth,
): number {
  if (fret === 0) {
    return labelWidth + openStringWidth / 2;
  }

  return (
    getFretX(
      fret - 1,
      numberOfFrets,
      fretboardStartX,
    ) +
    getFretX(
      fret,
      numberOfFrets,
      fretboardStartX,
    )
  ) / 2;
}

function Fretboard({
  tuning,
  frets,
  nonPlayableFrets,
  stringGroups,
  displayMode,
  labelMode,
  rootNote,
  activeNoteIndexes,
  customNotes,
  showOutsideNotes,
  practiceRangeEnabled,
  practiceRangeFrom,
  practiceRangeTo,
  practiceScalePath,
  practicePathReviewIndex,
  octaveHighlightEnabled,
  highlightedNote,
  explorerEnabled,
  explorerHighlights,
  compareEnabled,
  compareSharedNotes,
  compareOnlyANotes,
  compareOnlyBNotes,
  compareDisplayNames,
  analyzerEnabled,
  analyzerPositions,
  relationshipEnabled,
  relationshipDisplayNames,
  relationshipPreservedNoteIndexes,
  relationshipNewNoteIndexes,
  relationshipResolutionTargetNoteIndexes,
  selectedPosition,
  onNoteClick,
  onNoteDoubleClick,
}: FretboardProps) {
  const hasStringGroups = stringGroups.length > 1;

  const hasDamperPosition = nonPlayableFrets.includes(1);

  const toMusicalFret = (physicalFret: number) =>
    hasDamperPosition ? physicalFret - 1 : physicalFret;

  const toPhysicalFret = (musicalFret: number) =>
    hasDamperPosition ? musicalFret + 1 : musicalFret;

  const getDisplayedFretLabel = (physicalFret: number) =>
    hasDamperPosition && physicalFret === 1
      ? "X"
      : String(toMusicalFret(physicalFret));
  const labelWidth = hasStringGroups
    ? groupedLabelWidth
    : standardLabelWidth;
  const fretboardStartX = labelWidth + openStringWidth;
  const fretboardEndX = fretboardStartX + neckWidth;
  const svgWidth = fretboardEndX + rightMargin;

  const displayedStrings =
    stringGroups.length > 1
      ? stringGroups.flatMap((group) =>
          group.stringNumbers.map((stringNumber) => ({
            openNote: tuning[stringNumber - 1],
            tuningStringIndex: stringNumber - 1,
            stringNumber,
            groupId: group.id,
            groupName: group.name,
          })),
        )
      : [...tuning]
          .map((openNote, tuningStringIndex) => ({
            openNote,
            tuningStringIndex,
            stringNumber: tuningStringIndex + 1,
            groupId: "main",
            groupName: "",
          }))
          .reverse();

  const displayedGroupLabels =
    stringGroups.length > 1
      ? stringGroups.map((group) => {
          const indexes = displayedStrings
            .map((row, index) =>
              row.groupId === group.id ? index : -1,
            )
            .filter((index) => index >= 0);

          const firstIndex = indexes[0];
          const lastIndex = indexes[indexes.length - 1];

          return {
            id: group.id,
            name: group.name,
            firstIndex,
            lastIndex,
            centerIndex:
              (firstIndex + lastIndex) / 2,
          };
        })
      : [];

  const fretMarkers = hasDamperPosition
    ? [2, 7, 12, 17].filter(
        (fret) => toPhysicalFret(fret) <= frets,
      )
    : ALL_FRET_MARKERS.filter(
        (fret) => fret <= frets,
      );

  const doubleMarkers = hasDamperPosition
    ? []
    : DOUBLE_FRET_MARKERS.filter(
        (fret) => fret <= frets,
      );

  const positionMarkerRadius = hasDamperPosition ? 18 : 8;

  const groupSeparation = hasStringGroups ? 18 : 0;

  function getStringY(stringIndex: number): number {
    const secondGroupStart =
      stringGroups.length > 1
        ? stringGroups[0].stringNumbers.length
        : displayedStrings.length;

    return (
      topMargin +
      stringIndex * stringSpacing +
      (stringIndex >= secondGroupStart ? groupSeparation : 0)
    );
  }

  const svgHeight =
    topMargin +
    displayedStrings.length * stringSpacing +
    groupSeparation +
    bottomMargin;

  const rootIndex = getNoteIndex(rootNote);

  function getStringThickness(stringNumber: number): number {
    const group = stringGroups.find(
      (candidate) =>
        candidate.stringNumbers.includes(stringNumber),
    );

    if (!group || group.stringNumbers.length <= 1) {
      const fallbackIndex = Math.max(0, stringNumber - 1);
      return 1.4 + fallbackIndex * 0.28;
    }

    const position = group.stringNumbers.indexOf(stringNumber);
    const ratio =
      position / (group.stringNumbers.length - 1);

    const normalized =
      group.gaugeDirection === "thin-to-thick"
        ? ratio
        : 1 - ratio;

    return 1.4 + normalized * 2.2;
  }

  function getIntervalFromRoot(note: string): number {
    const noteIndex = getNoteIndex(note);

    return (
      (noteIndex - rootIndex + CHROMATIC_NOTES.length) %
      CHROMATIC_NOTES.length
    );
  }


  function getNoteLabel(note: string): string {
    if (labelMode === "hidden") {
      return "";
    }

    if (labelMode === "notes") {
      if (
        relationshipEnabled &&
        relationshipDisplayNames[note]
      ) {
        return relationshipDisplayNames[note];
      }

      if (
        compareEnabled &&
        compareDisplayNames[note]
      ) {
        return compareDisplayNames[note];
      }

      return displayNote(note);
    }

    const interval = getIntervalFromRoot(note);

    if (labelMode === "intervals") {
      return INTERVAL_LABELS[interval];
    }

    return interval.toString();
  }

  function getDegreeClass(interval: number): string {
    switch (interval) {
      case 0:
        return "degreeRoot";

      case 1:
      case 2:
        return "degreeSecond";

      case 3:
      case 4:
        return "degreeThird";

      case 5:
      case 6:
        return "degreeFourth";

      case 7:
        return "degreeFifth";

      case 8:
      case 9:
        return "degreeSixth";

      case 10:
      case 11:
        return "degreeSeventh";

      default:
        return "degreeOther";
    }
  }

  function getNoteStatus(note: string) {
    const noteIndex = getNoteIndex(note);
    const interval = getIntervalFromRoot(note);
    const isSelected =
      relationshipEnabled
        ? activeNoteIndexes.includes(noteIndex)
        : !explorerEnabled &&
          activeNoteIndexes.includes(noteIndex);

    const isRoot =
      displayMode !== "custom" && interval === 0 && isSelected;

    const isMinorThird =
      displayMode === "chord" &&
      interval === 3 &&
      isSelected;

    const isMajorThird =
      displayMode === "chord" &&
      interval === 4 &&
      isSelected;

    const isFifth =
      displayMode === "chord" &&
      interval === 7 &&
      isSelected;

    const isCustomRoot =
      displayMode === "custom" &&
      note === customNotes[0] &&
      isSelected;

    return {
      isSelected,
      isRoot: isRoot || isCustomRoot,
      isThird: isMinorThird || isMajorThird,
      isFifth,
    };
  }

  return (
    <section className="fretboardPanel">
      <div className="scrollHint">
        Scroll horizontally to inspect the complete fretboard
      </div>

      <div className="fretboardScroller">
        <svg
          className="fretboard"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={svgWidth}
          height={svgHeight}
          role="img"
          aria-label={`${tuning.length}-string tapping instrument fretboard`}
        >
          <defs>
            <linearGradient
              id="fretboardGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#25272a" />
              <stop offset="55%" stopColor="#17191c" />
              <stop offset="100%" stopColor="#101113" />
            </linearGradient>

            <filter
              id="noteShadow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodOpacity="0.5"
              />
            </filter>
          </defs>

          <rect
            className="neckBackground"
            x={fretboardStartX}
            y={topMargin - 28}
            width={neckWidth}
            height={
              (displayedStrings.length - 1) * stringSpacing +
                groupSeparation +
                56
            }
            rx="8"
            fill="url(#fretboardGradient)"
          />

          {practiceRangeEnabled && (
            <rect
              className="practiceRangeBand"
              x={getFretX(
                Math.max(
                  0,
                  toPhysicalFret(practiceRangeFrom) - 1,
                ),
                frets,
                fretboardStartX,
              )}
              y={topMargin - 28}
              width={
                getFretX(
                  toPhysicalFret(practiceRangeTo),
                  frets,
                  fretboardStartX,
                ) -
                getFretX(
                  Math.max(
                    0,
                    toPhysicalFret(practiceRangeFrom) - 1,
                  ),
                  frets,
                  fretboardStartX,
                )
              }
              height={
                (displayedStrings.length - 1) * stringSpacing +
                groupSeparation +
                56
              }
              rx="6"
            />
          )}

          {Array.from(
            { length: frets },
            (_, index) => index + 1,
          ).map((fret) => (
            <text
              key={`fret-number-${fret}`}
              className={
                nonPlayableFrets.includes(fret)
                  ? "fretNumber fretNumberNonPlayable"
                  : "fretNumber"
              }
              x={getFretCenterX(
                fret,
                frets,
                fretboardStartX,
                labelWidth,
              )}
              y={35}
              textAnchor="middle"
            >
              {getDisplayedFretLabel(fret)}
            </text>
          ))}

          {Array.from(
            { length: frets + 1 },
            (_, fret) => {
              const x = getFretX(fret, frets, fretboardStartX);

              return (
                <line
                  key={`fret-wire-${fret}`}
                  className={fret === 0 ? "nut" : "fretWire"}
                  x1={x}
                  y1={topMargin - 28}
                  x2={x}
                  y2={
                    topMargin +
                    (displayedStrings.length - 1) * stringSpacing +
                    groupSeparation +
                    28
                  }
                />
              );
            },
          )}

          {(nonPlayableFrets.includes(1) || !hasDamperPosition) && (
            <g className="damperArea">
              <rect
                className="damperBand"
                x={getFretX(0, frets, fretboardStartX) + 5}
                y={topMargin - 24}
                width={
                  getFretX(1, frets, fretboardStartX) -
                  getFretX(0, frets, fretboardStartX) -
                  10
                }
                height={
                  (displayedStrings.length - 1) *
                    stringSpacing +
                  groupSeparation +
                  48
                }
                rx="6"
              />

              <text
                className="damperLabel"
                x={getFretCenterX(
                  1,
                  frets,
                  fretboardStartX,
                  labelWidth,
                )}
                y={
                  topMargin +
                  (displayedStrings.length - 1) *
                    stringSpacing +
                  groupSeparation +
                  48
                }
                textAnchor="middle"
              >
                DAMPER
              </text>
            </g>
          )}

          {fretMarkers.map((fret) => {
            const markerPhysicalFret = hasDamperPosition
              ? toPhysicalFret(fret)
              : fret;
            const markerX = getFretCenterX(
              markerPhysicalFret,
              frets,
              fretboardStartX,
              labelWidth,
            );
            const middleY =
              topMargin +
              ((displayedStrings.length - 1) * stringSpacing) / 2;

            if (doubleMarkers.includes(fret)) {
              return (
                <g key={`marker-${fret}`}>
                  <circle
                    className="positionMarker"
                    cx={markerX}
                    cy={middleY - 65}
                    r={positionMarkerRadius}
                  />

                  <circle
                    className="positionMarker"
                    cx={markerX}
                    cy={middleY + 65}
                    r={positionMarkerRadius}
                  />
                </g>
              );
            }

            return (
              <circle
                key={`marker-${fret}`}
                className="positionMarker"
                cx={markerX}
                cy={middleY}
                r={positionMarkerRadius}
              />
            );
          })}

          {selectedPosition && (
            <>
              <rect
                className="selectedFretHighlight"
                x={
                  selectedPosition.fret === 0 && !hasDamperPosition
                    ? labelWidth
                    : getFretX(
                        Math.max(
                          0,
                          toPhysicalFret(selectedPosition.fret) - 1,
                        ),
                        frets,
                      )
                }
                y={topMargin - 28}
                width={
                  selectedPosition.fret === 0 && !hasDamperPosition
                    ? openStringWidth
                    : getFretX(
                        toPhysicalFret(selectedPosition.fret),
                        frets,
                      ) -
                      getFretX(
                        Math.max(
                          0,
                          toPhysicalFret(selectedPosition.fret) - 1,
                        ),
                        frets,
                      )
                }
                height={
                  (displayedStrings.length - 1) * stringSpacing +
                  groupSeparation +
                  56
                }
              />

              <rect
                className="selectedStringHighlight"
                x={labelWidth}
                y={
                  getStringY(selectedPosition.stringIndex) -
                  stringSpacing / 2
                }
                width={fretboardEndX - labelWidth}
                height={stringSpacing}
              />
            </>
          )}

          {displayedGroupLabels.map((group) => {
            const groupTop =
              getStringY(group.firstIndex) -
              stringSpacing * 0.38;

            const groupBottom =
              getStringY(group.lastIndex) +
              stringSpacing * 0.38;

            const groupMiddle =
              (getStringY(group.firstIndex) +
              getStringY(group.lastIndex)) /
              2;

            return (
              <g key={`group-label-${group.id}`}>
                <line
                  className="stringGroupBracket"
                  x1={98}
                  y1={groupTop}
                  x2={98}
                  y2={groupBottom}
                />

                <line
                  className="stringGroupBracket"
                  x1={98}
                  y1={groupTop}
                  x2={110}
                  y2={groupTop}
                />

                <line
                  className="stringGroupBracket"
                  x1={72}
                  y1={groupBottom}
                  x2={110}
                  y2={groupBottom}
                />

                <text
                  className={[
                    "stringGroupLabel",
                    group.name.toLowerCase() === "melody"
                      ? "stringGroupLabelMelody"
                      : group.name.toLowerCase() === "bass"
                        ? "stringGroupLabelBass"
                        : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  x={14}
                  y={groupMiddle + 5}
                  textAnchor="start"
                >
                  {group.name.toUpperCase()}
                </text>
              </g>
            );
          })}

          {displayedStrings.map(
            (
              {
                openNote,
                tuningStringIndex,
                stringNumber,
                groupName,
              },
              stringIndex,
            ) => {
            const y = getStringY(stringIndex);
            const stringThickness =
              getStringThickness(stringNumber);

            return (
              <g key={`string-${stringIndex}-${openNote}`}>
                <text
                  className={[
                    "stringLabel",
                    hasStringGroups &&
                    groupName.toLowerCase() === "melody"
                      ? "stringLabelMelody"
                      : "",
                    hasStringGroups &&
                    groupName.toLowerCase() === "bass"
                      ? "stringLabelBass"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  x={
                    hasStringGroups
                      ? 164
                      : 38
                  }
                  y={y + 6}
                  textAnchor="middle"
                >
                  {openNote}
                </text>

                <line
                  className="stringLine"
                  x1={labelWidth}
                  y1={y}
                  x2={fretboardEndX}
                  y2={y}
                  strokeWidth={stringThickness}
                />

                {Array.from(
                  { length: frets },
                  (_, index) => index + 1,
                ).map((physicalFret) => {
                    const fret = toMusicalFret(physicalFret);
                    const note = getNoteAtFret(openNote, fret);
                    const noteIndex = getNoteIndex(note);
                    const x = getFretCenterX(
                      physicalFret,
                      frets,
                      fretboardStartX,
                      labelWidth,
                    );

                    const isPracticeScalePathNote =
                      practiceRangeEnabled &&
                      practiceScalePath.some(
                        (position) =>
                          position.stringIndex === tuningStringIndex &&
                          position.fret === fret &&
                          position.noteIndex === noteIndex,
                      );

                    const hasPracticeScalePath =
                      practiceRangeEnabled &&
                      practiceScalePath.length > 0;

                    const practicePathStep =
                      practiceScalePath.findIndex(
                        (position) =>
                          position.stringIndex === tuningStringIndex &&
                          position.fret === fret &&
                          position.noteIndex === noteIndex,
                      ) + 1;

                    const isPracticePathReviewNote =
                      practicePathReviewIndex !== null &&
                      practicePathStep === practicePathReviewIndex + 1;

                    const isPracticePathReviewBackground =
                      practicePathReviewIndex !== null &&
                      practicePathStep > 0 &&
                      !isPracticePathReviewNote;
                    const isNonPlayableFret =
                      nonPlayableFrets.includes(physicalFret) ||
                      (!hasDamperPosition && physicalFret === 1);

                    const isSelectedString =
                      selectedPosition?.stringIndex === stringIndex;

                    const isSelectedFret =
                      selectedPosition?.fret === fret;

                    const isSelectedPosition =
                      isSelectedString && isSelectedFret;

                    const {
                      isSelected,
                      isRoot,
                      isThird,
                      isFifth,
                    } = getNoteStatus(note);

                  const isOctaveHighlighted =
  			octaveHighlightEnabled &&
  			highlightedNote === note;

                    const explorerHighlight =
                      explorerEnabled
                        ? explorerHighlights.find(
                            (highlight) =>
                              highlight.note === note,
                          )
                        : undefined;

                    const isExplorerMatch =
                      Boolean(explorerHighlight);

                    const compareHasPriority =
                      compareEnabled && !analyzerEnabled;

                    const isCompareShared =
                      compareHasPriority &&
                      compareSharedNotes.includes(note);

                    const isCompareOnlyA =
                      compareHasPriority &&
                      compareOnlyANotes.includes(note);

                    const isCompareOnlyB =
                      compareHasPriority &&
                      compareOnlyBNotes.includes(note);

                    const isCompareMatch =
                      isCompareShared ||
                      isCompareOnlyA ||
                      isCompareOnlyB;

                    const isAnalyzerSelected =
                      analyzerEnabled &&
                      analyzerPositions.some(
                        (position) =>
                          position.stringIndex ===
                            tuningStringIndex &&
                          position.fret === fret,
                      );

                    const isRelationshipPreserved =
                      relationshipEnabled &&
                      relationshipPreservedNoteIndexes.includes(
                        noteIndex,
                      );

                    const isRelationshipNew =
                      relationshipEnabled &&
                      relationshipNewNoteIndexes.includes(
                        noteIndex,
                      );

                    const isRelationshipResolutionTarget =
                      relationshipEnabled &&
                      relationshipResolutionTargetNoteIndexes.includes(
                        noteIndex,
                      );

                    const isRelationshipMatch =
                      relationshipEnabled &&
                      activeNoteIndexes.includes(
                        noteIndex,
                      );

                    // A clicked-pitch highlight is an intentional
                    // exception to "Show notes outside selection".
                    // If the pitch is highlighted, its circles and labels
                    // should remain visible even when outside notes are hidden.
                    const shouldShow =
                      isSelected ||
                      isExplorerMatch ||
                      isCompareMatch ||
                      isAnalyzerSelected ||
                      isRelationshipMatch ||
                      isOctaveHighlighted ||
                      showOutsideNotes;

                    const explorerRoleClass =
                      explorerHighlights.length <= 1 ||
                      !explorerHighlight
                        ? ""
                        : getDegreeClass(
                            explorerHighlight.interval,
                          );

			const circleClasses = [

                      "noteCircle",
                      fret === 0 ? "openNoteCircle" : "",
                      isRoot ? "rootNoteCircle" : "",
                      isThird ? "thirdNoteCircle" : "",
                      isFifth ? "fifthNoteCircle" : "",
		      isOctaveHighlighted ? "octaveHighlightCircle" : "",
                      isExplorerMatch &&
                      explorerHighlights.length <= 1
                        ? "explorerMatchCircle"
                        : "",
                      explorerRoleClass,
                      analyzerEnabled &&
                      isExplorerMatch &&
                      !isAnalyzerSelected
                        ? "analyzerExplorerBackgroundCircle"
                        : "",
                      isAnalyzerSelected
                        ? "analyzerSelectedCircle"
                        : "",
                      analyzerEnabled &&
                      isSelected &&
                      !isAnalyzerSelected
                        ? "analyzerBackgroundCircle"
                        : "",
                      isSelectedPosition && !analyzerEnabled
                        ? "selectedPositionCircle"
                        : "",
                      isSelected &&
                      !isRoot &&
                      !isThird &&
                      !isFifth
                        ? displayMode === "chord"
                          ? "chordToneCircle"
                          : "scaleNoteCircle"
                        : "",
                      isCompareShared
                        ? "compareSharedCircle"
                        : "",
                      isCompareOnlyA
                        ? "compareOnlyACircle"
                        : "",
                      isCompareOnlyB
                        ? "compareOnlyBCircle"
                        : "",
                      !isSelected && !isCompareMatch
                        ? "outsideNoteCircle"
                        : "",
                      !shouldShow ? "hiddenNoteCircle" : "",
                      isPracticeScalePathNote
                        ? "practiceScalePathCircle"
                        : "",
                      isPracticePathReviewNote
                        ? "practicePathReviewCurrentCircle"
                        : "",
                      isPracticePathReviewBackground
                        ? "practicePathReviewBackgroundCircle"
                        : "",
                      isRelationshipMatch
                        ? "relationshipNoteCircle"
                        : "",
                      isRelationshipPreserved
                        ? "relationshipPreservedCircle"
                        : "",
                      isRelationshipNew
                        ? "relationshipNewCircle"
                        : "",
                      isRelationshipResolutionTarget
                        ? "relationshipResolutionTargetCircle"
                        : "",

                      hasPracticeScalePath &&
                      fret >= practiceRangeFrom &&
                      fret <= practiceRangeTo &&
                      isSelected &&
                      !isPracticeScalePathNote
                        ? "practiceScalePathBackground"
                        : "",
                      isNonPlayableFret
                        ? "nonPlayableFretNote"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    if (isNonPlayableFret) {
                      return null;
                    }

                    return (
                      <g
                        key={`note-${stringIndex}-${physicalFret}`}
                        className={[
                          "noteGroup",
                          practiceRangeEnabled &&
                          (fret < practiceRangeFrom || fret > practiceRangeTo)
                            ? "practiceRangeOutside"
                            : "",
                        ].filter(Boolean).join(" ")}
                        onClick={() => {
                          if (!isNonPlayableFret) {
                            onNoteClick(
                              note,
                              stringIndex,
                              fret,
                              tuningStringIndex,
                            );
                          }
                        }}
                        onDoubleClick={() => {
                          if (!isNonPlayableFret) {
                            onNoteDoubleClick(
                              note,
                              stringIndex,
                              fret,
                            );
                          }
                        }}
                        role="button"
                        tabIndex={isNonPlayableFret ? -1 : 0}
                        aria-label={`Select ${note}; double-click to set as root`}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            if (!isNonPlayableFret) {
                              onNoteClick(
                                note,
                                stringIndex,
                                fret,
                                tuningStringIndex,
                              );
                            }
                          }
                        }}
                      >
                        <circle
                          className={circleClasses}
                          cx={x}
                          cy={y}
                          r={
                            isRelationshipResolutionTarget
                              ? 21
                              : isRelationshipMatch
                                ? 19
                                : 16
                          }
                          filter="url(#noteShadow)"
                        />

                        {shouldShow && labelMode !== "hidden" && (
                          <text
                            className={[
                              "noteName",
                              isRoot ? "rootNoteName" : "",
                              !isSelected &&
                              !isCompareMatch &&
                              !isOctaveHighlighted
                                ? "outsideNoteName"
                                : "",
                              isOctaveHighlighted
                                ? "octaveHighlightNoteName"
                                : "",
                              isCompareMatch
                                ? "compareNoteName"
                                : "",
                              analyzerEnabled &&
                              isSelected &&
                              !isAnalyzerSelected
                                ? "analyzerBackgroundNoteName"
                                : "",
                              analyzerEnabled &&
                              isExplorerMatch &&
                              !isAnalyzerSelected
                                ? "analyzerExplorerBackgroundNoteName"
                                : "",
                              isRelationshipMatch
                                ? "relationshipNoteName"
                                : "",
                              isRelationshipResolutionTarget
                                ? "relationshipResolutionTargetNoteName"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            x={x}
                            y={y + 5}
                            textAnchor="middle"
                          >
                            {getNoteLabel(note)}
                          </text>
                        )}

                        {practicePathStep > 0 && (
                          <>
                            <circle
                              className={
                                isPracticePathReviewNote
                                  ? "practicePathStepBadge practicePathStepBadgeCurrent"
                                  : "practicePathStepBadge"
                              }
                              cx={x + 14}
                              cy={y - 14}
                              r="8"
                            />
                            <text
                              className={
                                isPracticePathReviewNote
                                  ? "practicePathStepNumber practicePathStepNumberCurrent"
                                  : "practicePathStepNumber"
                              }
                              x={x + 14}
                              y={y - 11}
                              textAnchor="middle"
                            >
                              {practicePathStep}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
              </g>
            );
          })}

          <text
            className="nutLabel"
            x={fretboardStartX}
            y={svgHeight - 22}
            textAnchor="middle"
          >
            NUT
          </text>
        </svg>
      </div>
    </section>
  );
}

export default Fretboard;
