import { useEffect, useState } from "react";
import "./App.css";

import Fretboard, {
  type ExplorerHighlight,
} from "./components/Fretboard";
import SelectionPanel from "./components/SelectionPanel";
import ExplorerPanel from "./components/ExplorerPanel";
import InformationBar from "./components/InformationBar";
import TuningPanel from "./components/TuningPanel";
import LegendPanel from "./components/LegendPanel";
import MusicalSelectionPanel from "./components/MusicalSelectionPanel";
import AppHeader from "./components/AppHeader";
import ChordAnalyzerPanel from "./components/ChordAnalyzerPanel";
import ComparePanel from "./components/ComparePanel";

import {
  INSTRUMENT_PRESETS,
  TOUCH_GUITAR_U8,
  getDefaultTuningPreset,
  type InstrumentPresetId,
} from "./music/instruments";

import {
  CHORDS,
  CHROMATIC_NOTES,
  INTERVAL_LABELS,
  SCALES,
  type ChordName,
  type DisplayMode,
  type LabelMode,
  type ScaleName,
} from "./music/musicData";

import {
  findExactChordMatches,
  findNearChordMatches,
  getLowestSelectedNote,
  getSelectedVoicingNotes,
  getVoicingDoublings,
  compareIntervalSets,
  spellScaleNotes,
  spellChordNotes,
  getChordFormulaLabels,
  getHighlightsFromIntervals,
  getIntervalBetweenNotes,
  getIntervalLongName,
  getNoteAtInterval,
  getNoteIndex,
  getNoteIndexesFromIntervals,
  getNotesFromIntervals,
} from "./music/musicUtils";
import { displayNote, displayNotes } from "./music/noteDisplay";

type AnalyzerPosition = {
  note: string;
  stringIndex: number;
  fret: number;
};

type CustomTuningPreset = {
  id: string;
  name: string;
  tuning: string[];
  instrumentId: InstrumentPresetId;
};

const CUSTOM_TUNINGS_STORAGE_KEY = "touch-guitar-custom-tunings-v1";

const PRACTICE_PATHS_STORAGE_KEY = "touch-guitar-practice-paths-v1";

type SavedPracticePath = {
  id: string;
  name: string;
  instrumentId: InstrumentPresetId;
  displayMode: DisplayMode;
  rootNote: string;
  selectedScale: ScaleName;
  tuning: string[];
  tuningPresetId?: string;
  practiceRangeFrom: number;
  practiceRangeTo: number;
  positions: {
    noteIndex: number;
    note: string;
    stringIndex: number;
    fret: number;
  }[];
};

function App() {
  const [selectedInstrumentId, setSelectedInstrumentId] =
    useState<InstrumentPresetId>(TOUCH_GUITAR_U8.id);

  const selectedInstrument =
    INSTRUMENT_PRESETS.find(
      (instrument) => instrument.id === selectedInstrumentId,
    ) ?? TOUCH_GUITAR_U8;

  const [displayMode, setDisplayMode] =
    useState<DisplayMode>("scale");

  const [labelMode, setLabelMode] =
    useState<LabelMode>("notes");

  const [studyModeEnabled, setStudyModeEnabled] =
    useState(false);

  const [rootNote, setRootNote] = useState("C");

  const [selectedScale, setSelectedScale] =
    useState<ScaleName>("Major");

  const [selectedChord, setSelectedChord] =
    useState<ChordName>("Major");

  const [customNotes, setCustomNotes] = useState<string[]>([
    "C",
    "E",
    "G",
  ]);

  const [chordAnalyzerEnabled, setChordAnalyzerEnabled] =
    useState(false);

  const [analyzerPositions, setAnalyzerPositions] =
    useState<AnalyzerPosition[]>([]);

  const analyzerNotes = Array.from(
    new Set(
      analyzerPositions.map((position) => position.note),
    ),
  );

const [selectedTuningPresetId, setSelectedTuningPresetId] =
    useState<string>(
      getDefaultTuningPreset(TOUCH_GUITAR_U8).id,
    );

  const [tuning, setTuning] = useState<string[]>([
    ...getDefaultTuningPreset(TOUCH_GUITAR_U8).tuning,
  ]);

  const [customTuningPresets, setCustomTuningPresets] = useState<CustomTuningPreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_TUNINGS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CUSTOM_TUNINGS_STORAGE_KEY, JSON.stringify(customTuningPresets));
  }, [customTuningPresets]);

  const availableTuningPresets = [
    ...selectedInstrument.tuningPresets,
    ...customTuningPresets.filter(
      (preset) => preset.instrumentId === selectedInstrumentId,
    ),
  ];

  const [showOutsideNotes, setShowOutsideNotes] =
    useState(true);

  const [practiceRangeEnabled, setPracticeRangeEnabled] = useState(false);
  const [practiceRangeFrom, setPracticeRangeFrom] = useState(1);
  const [practiceRangeTo, setPracticeRangeTo] =
    useState(TOUCH_GUITAR_U8.frets);

const [octaveHighlightEnabled, setOctaveHighlightEnabled] =
  useState(false);

const [highlightedNote, setHighlightedNote] =
  useState<string | null>(null);

  const [explorerEnabled, setExplorerEnabled] = useState(false);
  const [explorerMode, setExplorerMode] =
    useState<"notes" | "intervals" | "chords" | "scales">("notes");
  const [explorerTargetNote, setExplorerTargetNote] = useState("Bb");
  const [explorerTargetInterval, setExplorerTargetInterval] =
    useState(7);
  const [explorerTargetChord, setExplorerTargetChord] =
    useState<ChordName>("Major");
  const [explorerTargetScale, setExplorerTargetScale] =
    useState<ScaleName>("Major");

  const [compareEnabled, setCompareEnabled] =
    useState(false);

  const [compareScaleA, setCompareScaleA] =
    useState<ScaleName>("Major");

  const [compareScaleB, setCompareScaleB] =
    useState<ScaleName>("Lydian");


  
  const [selectedPosition, setSelectedPosition] = useState<{
    stringIndex: number;
    fret: number;
  } | null>(null);

  const [selectedNoteInfo, setSelectedNoteInfo] = useState<{
    note: string;
    stringIndex: number;
    tuningStringIndex: number;
    fret: number;
  } | null>(null);

const rootIndex = getNoteIndex(rootNote);

  const activeIntervals =
    displayMode === "scale"
      ? SCALES[selectedScale]
      : displayMode === "chord"
        ? CHORDS[selectedChord]
        : [];

  const activeNoteIndexes =
    displayMode === "custom"
      ? customNotes.map(getNoteIndex)
      : getNoteIndexesFromIntervals(
          rootNote,
          activeIntervals,
        );

  const studyModeAvailable =
    displayMode === "scale" || displayMode === "chord";

  const studyTitle =
    displayMode === "scale"
      ? `${displayNote(rootNote)} ${selectedScale}`
      : `${displayNote(rootNote)} ${selectedChord}`;

  const studyNotes =
    displayMode === "chord"
      ? spellChordNotes(
          rootNote,
          selectedChord,
          activeIntervals,
        )
      : displayMode === "scale"
        ? spellScaleNotes(rootNote, activeIntervals)
        : [];

  const studyFormula =
    displayMode === "chord"
      ? getChordFormulaLabels(
          selectedChord,
          activeIntervals,
        )
      : displayMode === "scale"
        ? activeIntervals.map(
            (interval) => INTERVAL_LABELS[interval],
          )
        : [];

  const practiceRangeMatchCount = practiceRangeEnabled
    ? tuning.reduce((total, openNote) => {
        const openIndex = getNoteIndex(openNote);

        const matchesOnString = Array.from(
          {
            length:
              practiceRangeTo - practiceRangeFrom + 1,
          },
          (_, index) => practiceRangeFrom + index,
        ).reduce((count, fret) => {
          if (
            selectedInstrument.geometry.nonPlayableFrets?.includes(
              fret,
            )
          ) {
            return count;
          }

          const noteIndex =
            (openIndex + fret) % CHROMATIC_NOTES.length;

          return activeNoteIndexes.includes(noteIndex)
            ? count + 1
            : count;
        }, 0);

        return total + matchesOnString;
      }, 0)
    : 0;

  const [recordPracticePathEnabled, setRecordPracticePathEnabled] =
    useState(false);
  const [recordedPracticePath, setRecordedPracticePath] = useState<
    {
      noteIndex: number;
      note: string;
      stringIndex: number;
      fret: number;
    }[]
  >([]);

  const [practicePathName, setPracticePathName] = useState("");

  const [practicePathReviewIndex, setPracticePathReviewIndex] =
    useState<number | null>(null);

  const [practicePathPlaying, setPracticePathPlaying] =
    useState(false);
  const [practicePathPlaybackSpeed, setPracticePathPlaybackSpeed] =
    useState<"slow" | "medium" | "fast">("medium");

  const [savedPracticePaths, setSavedPracticePaths] = useState<
    SavedPracticePath[]
  >(() => {
    try {
      const saved = localStorage.getItem(PRACTICE_PATHS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      PRACTICE_PATHS_STORAGE_KEY,
      JSON.stringify(savedPracticePaths),
    );
  }, [savedPracticePaths]);

  const instrumentSavedPracticePaths = savedPracticePaths.filter(
    (path) => path.instrumentId === selectedInstrumentId,
  );

  const [selectedSavedPracticePathId, setSelectedSavedPracticePathId] =
    useState("");

  const loadedPracticePath =
    savedPracticePaths.find(
      (path) => path.id === selectedSavedPracticePathId,
    ) ?? null;


  useEffect(() => {
    if (
      !practicePathPlaying ||
      recordedPracticePath.length === 0
    ) {
      return;
    }

    const delay =
      practicePathPlaybackSpeed === "slow"
        ? 1100
        : practicePathPlaybackSpeed === "fast"
          ? 450
          : 750;

    const timer = window.setTimeout(() => {
      setPracticePathReviewIndex((current) => {
        if (
          current === null ||
          current >= recordedPracticePath.length - 1
        ) {
          setPracticePathPlaying(false);
          return recordedPracticePath.length - 1;
        }

        return current + 1;
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    practicePathPlaying,
    practicePathReviewIndex,
    practicePathPlaybackSpeed,
    recordedPracticePath.length,
  ]);

  const analyzerOpenStringPitchOffsets =
    selectedInstrument.geometry.stringGroups?.length === 2 &&
    tuning.length === 12
      ? [
          50, // S1 D
          45, // S2 A
          40, // S3 E
          35, // S4 B
          30, // S5 F#
          25, // S6 C#
          24, // S7 C
          31, // S8 G
          38, // S9 D
          45, // S10 A
          52, // S11 E
          59, // S12 B
        ]
      : undefined;

  function changeInstrument(instrumentId: InstrumentPresetId) {
    const nextInstrument =
      INSTRUMENT_PRESETS.find(
        (instrument) => instrument.id === instrumentId,
      ) ?? TOUCH_GUITAR_U8;

    const defaultPreset = getDefaultTuningPreset(nextInstrument);

    setSelectedInstrumentId(nextInstrument.id);
    setSelectedTuningPresetId(defaultPreset.id);
    setTuning([...defaultPreset.tuning]);
    setSelectedPosition(null);
    setSelectedNoteInfo(null);
    setHighlightedNote(null);
    setPracticeRangeFrom(
      nextInstrument.geometry.nonPlayableFrets?.includes(1) ? 2 : 1,
    );
    setPracticeRangeTo(nextInstrument.frets);
    setRecordPracticePathEnabled(false);
    setRecordedPracticePath([]);
    setSelectedSavedPracticePathId("");
    setPracticePathReviewIndex(null);
    setPracticePathPlaying(false);
  }

function changeTuningPreset(presetId: string) {
    const preset =
      availableTuningPresets.find(
        (candidate) => candidate.id === presetId,
      ) ?? getDefaultTuningPreset(selectedInstrument);

    setSelectedTuningPresetId(preset.id);
    setTuning([...preset.tuning]);
    setSelectedPosition(null);
    setSelectedNoteInfo(null);
    setHighlightedNote(null);
  }

  function saveCustomTuning(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = `custom-${Date.now()}`;
    setCustomTuningPresets((currentPresets) => [
      ...currentPresets,
      {
        id,
        name: trimmedName,
        tuning: [...tuning],
        instrumentId: selectedInstrumentId,
      },
    ]);
    setSelectedTuningPresetId(id);
  }

  function deleteCustomTuning(presetId: string) {
    if (!presetId.startsWith("custom-")) return;

    setCustomTuningPresets((currentPresets) =>
      currentPresets.filter((preset) => preset.id !== presetId),
    );

    if (selectedTuningPresetId === presetId) {
      const defaultPreset = getDefaultTuningPreset(selectedInstrument);
      setSelectedTuningPresetId(defaultPreset.id);
      setTuning([...defaultPreset.tuning]);
      setSelectedPosition(null);
      setSelectedNoteInfo(null);
      setHighlightedNote(null);
    }
  }

  function updateTuningString(
  stringIndex: number,
  note: string,
) {
  setTuning((currentTuning) =>
    currentTuning.map((currentNote, index) =>
      index === stringIndex ? note : currentNote,
    ),
  );
}

  function saveRecordedPracticePath() {
    const trimmedName = practicePathName.trim();

    if (!trimmedName || recordedPracticePath.length === 0) {
      return;
    }

    const newPath: SavedPracticePath = {
      id: `practice-${Date.now()}`,
      name: trimmedName,
      instrumentId: selectedInstrumentId,
      displayMode,
      rootNote,
      selectedScale,
      tuning: [...tuning],
      tuningPresetId: selectedTuningPresetId,
      practiceRangeFrom,
      practiceRangeTo,
      positions: recordedPracticePath.map((position) => ({
        ...position,
      })),
    };

    setSavedPracticePaths((current) => [...current, newPath]);
    setSelectedSavedPracticePathId(newPath.id);
    setPracticePathName("");
  }

  function loadSavedPracticePath(pathId: string) {
    const path = savedPracticePaths.find(
      (candidate) => candidate.id === pathId,
    );
    if (!path || path.instrumentId !== selectedInstrumentId) return;

    setSelectedSavedPracticePathId(path.id);
    setDisplayMode("scale");
    setRootNote(path.rootNote);
    setSelectedScale(path.selectedScale);
    setTuning([...path.tuning]);

    if (
      path.tuningPresetId &&
      availableTuningPresets.some(
        (preset) => preset.id === path.tuningPresetId,
      )
    ) {
      setSelectedTuningPresetId(path.tuningPresetId);
    }

    setPracticeRangeEnabled(true);
    setPracticeRangeFrom(path.practiceRangeFrom);
    setPracticeRangeTo(path.practiceRangeTo);
    setRecordedPracticePath(path.positions.map((position) => ({ ...position })));
    setPracticePathPlaying(false);
    setPracticePathReviewIndex(path.positions.length > 0 ? 0 : null);
    setRecordPracticePathEnabled(false);
    setSelectedPosition(null);
    setSelectedNoteInfo(null);
    setHighlightedNote(null);
  }

  function deleteSavedPracticePath(pathId: string) {
    const path = savedPracticePaths.find(
      (candidate) => candidate.id === pathId,
    );
    if (!path) return;

    if (!window.confirm(`Delete saved practice path "${path.name}"?`)) return;

    setSavedPracticePaths((current) =>
      current.filter((candidate) => candidate.id !== pathId),
    );

    if (selectedSavedPracticePathId === pathId) {
      setSelectedSavedPracticePathId("");
    }
  }

  function toggleCustomNote(note: string) {
    setCustomNotes((currentNotes) => {
      if (currentNotes.includes(note)) {
        return currentNotes.filter(
          (currentNote) => currentNote !== note,
        );
      }

      return [...currentNotes, note];
    });
  }

 function handleFretboardNoteClick(
    note: string,
    stringIndex: number,
    fret: number,
    tuningStringIndex: number,
  ) {
    if (
      recordPracticePathEnabled &&
      practiceRangeEnabled &&
      displayMode === "scale" &&
      fret >= practiceRangeFrom &&
      fret <= practiceRangeTo
    ) {
      const noteIndex = getNoteIndex(note);

      if (!activeNoteIndexes.includes(noteIndex)) {
        return;
      }

      setPracticePathReviewIndex(null);

      setRecordedPracticePath((current) => {
        const existingIndex = current.findIndex(
          (position) =>
            position.stringIndex === tuningStringIndex &&
            position.fret === fret,
        );

        if (existingIndex >= 0) {
          return current.slice(0, existingIndex);
        }

        return [
          ...current,
          {
            noteIndex,
            note,
            stringIndex: tuningStringIndex,
            fret,
          },
        ];
      });

      return;
    }

    const isSamePosition =
      selectedPosition?.stringIndex === stringIndex &&
      selectedPosition?.fret === fret;

    if (isSamePosition) {
      setSelectedPosition(null);
      setSelectedNoteInfo(null);
    } else {
      setSelectedPosition({ stringIndex, fret });
      setSelectedNoteInfo({
        note,
        stringIndex,
        tuningStringIndex,
        fret,
      });
    }

    if (explorerEnabled && explorerMode === "notes") {
      setExplorerTargetNote(note);
    }

    if (chordAnalyzerEnabled) {
      setAnalyzerPositions((currentPositions) => {
        const alreadySelected = currentPositions.some(
          (position) =>
            position.stringIndex === tuningStringIndex &&
            position.fret === fret,
        );

        return alreadySelected
          ? currentPositions.filter(
              (position) =>
                !(
                  position.stringIndex === tuningStringIndex &&
                  position.fret === fret
                ),
            )
          : [
              ...currentPositions,
              {
                note,
                stringIndex: tuningStringIndex,
                fret,
              },
            ];
      });
      return;
    }

    if (octaveHighlightEnabled) {
      setHighlightedNote((currentNote) =>
        currentNote === note ? null : note,
      );
      return;
    }

    if (displayMode === "custom") {
      toggleCustomNote(note);
    }
  }

  function handleFretboardNoteDoubleClick(note: string) {
    if (displayMode === "custom") {
      return;
    }

    setRootNote(note);
  }




  function getSelectedIntervalInfo() {
    if (!selectedNoteInfo) {
      return {
        longName: "—",
        symbol: "—",
        semitones: "—",
        stringLabel: "—",
      };
    }

    const interval = getIntervalBetweenNotes(
      selectedNoteInfo.note,
      rootNote,
    );

    const openNote =
      tuning[selectedNoteInfo.tuningStringIndex];

    return {
      longName: getIntervalLongName(interval),
      symbol: INTERVAL_LABELS[interval],
      semitones: String(interval),
      stringLabel: `${selectedNoteInfo.tuningStringIndex + 1} (${displayNote(openNote)})`,
    };
  }

  function getExplorerLabel(): string {
    if (explorerMode === "notes") {
      return displayNote(explorerTargetNote);
    }

    if (explorerMode === "chords") {
      return `${displayNote(rootNote)} ${explorerTargetChord} → ${displayNotes(getExplorerChordNotes()).join(" · ")}`;
    }

    if (explorerMode === "scales") {
      return `${displayNote(rootNote)} ${explorerTargetScale} → ${displayNotes(getExplorerScaleNotes()).join(" · ")}`;
    }

    return `${getIntervalLongName(explorerTargetInterval)} → ${displayNote(getExplorerTargetNote())}`;
  }

  function getExplorerChordToneDetails(): string[] {
    const intervals = CHORDS[explorerTargetChord];
    const notes = spellChordNotes(
      rootNote,
      explorerTargetChord,
      intervals,
    );
    const formulas = getChordFormulaLabels(
      explorerTargetChord,
      intervals,
    );

    return notes.map(
      (note, index) => `${note} (${formulas[index]})`,
    );
  }

  function getExplorerScaleNotes(): string[] {
    return getNotesFromIntervals(
      rootNote,
      SCALES[explorerTargetScale],
    );
  }

  function getExplorerHighlights(): ExplorerHighlight[] {
    if (explorerMode === "chords") {
      return getHighlightsFromIntervals(
        rootNote,
        CHORDS[explorerTargetChord],
      );
    }

    if (explorerMode === "scales") {
      return getHighlightsFromIntervals(
        rootNote,
        SCALES[explorerTargetScale],
      );
    }

    const note = getExplorerTargetNote();

    return [
      {
        note,
        interval:
          (getNoteIndex(note) -
            rootIndex +
            CHROMATIC_NOTES.length) %
          CHROMATIC_NOTES.length,
      },
    ];
  }

  function getExplorerChordNotes(): string[] {
    return getNotesFromIntervals(
      rootNote,
      CHORDS[explorerTargetChord],
    );
  }

  function getExplorerTargetNote(): string {
    if (explorerMode === "notes") {
      return explorerTargetNote;
    }

    return getNoteAtInterval(
      rootNote,
      explorerTargetInterval,
    );
  }

  function getExplorerOccurrenceCount(): number {
    if (!explorerEnabled || explorerMode === "chords") {
      return 0;
    }

    return tuning.reduce((total, openNote) => {
      const openIndex = getNoteIndex(openNote);
      const targetIndex = getNoteIndex(getExplorerTargetNote());

      const matchesOnString = Array.from(
        { length: selectedInstrument.frets + 1 },
        (_, fret) =>
          (openIndex + fret) % CHROMATIC_NOTES.length === targetIndex
            ? 1
            : 0,
      ).reduce<number>((sum, match) => sum + match, 0);

      return total + matchesOnString;
    }, 0);
  }

  function getSelectionTitle(): string {
    if (displayMode === "scale") {
      return `${displayNote(rootNote)} ${selectedScale}`;
    }

    if (displayMode === "chord") {
      return `${displayNote(rootNote)} ${selectedChord}`;
    }

    return customNotes.length > 0
      ? displayNotes(customNotes).join(" · ")
      : "No custom notes selected";
  }

  return (
    <main className="app">
      <AppHeader
        description={selectedInstrument.description}
        tuning={tuning}
      />

      <section className="workspace">
        <aside className="controlPanel">
          <MusicalSelectionPanel
            selectedInstrumentId={selectedInstrumentId}
            displayMode={displayMode}
            labelMode={labelMode}
            rootNote={rootNote}
            selectedScale={selectedScale}
            selectedChord={selectedChord}
            customNotes={customNotes}
            showOutsideNotes={showOutsideNotes}
            octaveHighlightEnabled={octaveHighlightEnabled}
            highlightedNote={highlightedNote}
            selectionTitle={getSelectionTitle()}
            onInstrumentChange={changeInstrument}
            onDisplayModeChange={setDisplayMode}
            onLabelModeChange={setLabelMode}
            onRootNoteChange={setRootNote}
            onScaleChange={setSelectedScale}
            onChordChange={setSelectedChord}
            onCustomNoteToggle={toggleCustomNote}
            onClearCustomNotes={() => setCustomNotes([])}
            onShowOutsideNotesChange={setShowOutsideNotes}
            onOctaveHighlightChange={(enabled) => {
              setOctaveHighlightEnabled(enabled);

              if (!enabled) {
                setHighlightedNote(null);
              }
            }}
          />

          {studyModeAvailable && (
            <section className="studyModePanel">
              <div className="studyModeHeader">
                <div>
                  <span className="studyModeEyebrow">Study</span>
                  <strong>Scale / Chord Study</strong>
                </div>

                <label className="studyModeToggle">
                  <input
                    type="checkbox"
                    checked={studyModeEnabled}
                    onChange={(event) => {
                      const enabled = event.target.checked;
                      setStudyModeEnabled(enabled);

                      if (enabled && labelMode === "hidden") {
                        setLabelMode("notes");
                      }
                    }}
                  />
                  <span>{studyModeEnabled ? "On" : "Off"}</span>
                </label>
              </div>

              {studyModeEnabled && (
                <div className="studyModeBody">
                  <div className="studyModeLabelChoice">
                    <span>Fretboard labels</span>
                    <div className="studyModeSegmented">
                      <button
                        type="button"
                        className={labelMode === "notes" ? "active" : ""}
                        onClick={() => setLabelMode("notes")}
                      >
                        Note names
                      </button>
                      <button
                        type="button"
                        className={labelMode === "intervals" ? "active" : ""}
                        onClick={() => setLabelMode("intervals")}
                      >
                        Degrees
                      </button>
                    </div>
                  </div>

                  <div className="studyModeSummary">
                    <strong>{studyTitle}</strong>

                    <div className="studyModeSummaryRow">
                      <span>Notes</span>
                      <b>{studyNotes.join(" · ")}</b>
                    </div>

                    <div className="studyModeSummaryRow">
                      <span>Formula</span>
                      <b>{studyFormula.join(" · ")}</b>
                    </div>

                    <div className="studyModeSummaryRow">
                      <span>Semitones</span>
                      <b>{activeIntervals.join(" · ")}</b>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}


<ExplorerPanel
  enabled={explorerEnabled}
  mode={explorerMode}
  targetNote={explorerTargetNote}
  targetInterval={explorerTargetInterval}
  targetChord={explorerTargetChord}
  targetScale={explorerTargetScale}
  occurrenceCount={getExplorerOccurrenceCount()}
  resolvedTargetNote={getExplorerTargetNote()}
  chordToneDetails={getExplorerChordToneDetails()}
  scaleNotes={getExplorerScaleNotes()}
  onEnabledChange={setExplorerEnabled}
  onModeChange={setExplorerMode}
  onTargetNoteChange={setExplorerTargetNote}
  onTargetIntervalChange={setExplorerTargetInterval}
  onTargetChordChange={setExplorerTargetChord}
  onTargetScaleChange={setExplorerTargetScale}
/>

<ChordAnalyzerPanel
            enabled={chordAnalyzerEnabled}
            selectedNotes={
              chordAnalyzerEnabled
                ? analyzerNotes
                : customNotes
            }
            matches={findExactChordMatches(
              chordAnalyzerEnabled
                ? analyzerNotes
                : customNotes,
              CHORDS,
            )}
            nearMatches={findNearChordMatches(
              chordAnalyzerEnabled
                ? analyzerNotes
                : customNotes,
              CHORDS,
            )}
            bassNote={
              chordAnalyzerEnabled
                ? getLowestSelectedNote(
                    analyzerPositions,
                    tuning,
                    analyzerOpenStringPitchOffsets,
                  )
                : null
            }
            voicingNotes={
              chordAnalyzerEnabled
                ? getSelectedVoicingNotes(
                    analyzerPositions,
                    tuning,
                    analyzerOpenStringPitchOffsets,
                  )
                : []
            }
            doublings={
              chordAnalyzerEnabled
                ? getVoicingDoublings(
                    analyzerPositions,
                  )
                : []
            }
            onEnabledChange={(enabled) => {
              setChordAnalyzerEnabled(enabled);

              if (enabled) {
                setAnalyzerPositions([]);
              }
            }}
            onClear={() => setAnalyzerPositions([])}
            onUseMatch={(match) => {
              setRootNote(match.rootNote);
              setSelectedChord(match.chordName as ChordName);
              setDisplayMode("chord");
              setChordAnalyzerEnabled(false);
            }}
          />

<ComparePanel
  enabled={compareEnabled}
  rootNote={rootNote}
  scaleA={compareScaleA}
  scaleB={compareScaleB}
  comparison={compareIntervalSets(
    rootNote,
    SCALES[compareScaleA],
    SCALES[compareScaleB],
  )}
  onEnabledChange={setCompareEnabled}
  onScaleAChange={setCompareScaleA}
  onScaleBChange={setCompareScaleB}
/>

        </aside>

        <section className="instrumentArea">
          <InformationBar
            instrumentName={selectedInstrument.name}
            frets={selectedInstrument.frets}
            strings={tuning.length}
            explorerText={
              explorerEnabled
                ? `${getExplorerLabel()} (${getExplorerOccurrenceCount()})`
                : "Disabled"
            }
            selectionText={getSelectionTitle()}
          />

          <SelectionPanel
            selectedNoteInfo={selectedNoteInfo}
            intervalInfo={getSelectedIntervalInfo()}
            onClear={() => {
              setSelectedPosition(null);
              setSelectedNoteInfo(null);
            }}
          />

          <div className="fretboardInfoRow">
            <LegendPanel
              displayMode={displayMode}
              explorerEnabled={explorerEnabled}
              explorerMode={explorerMode}
              analyzerEnabled={chordAnalyzerEnabled}
            />
          </div>

          <div className="practiceRangeBar">
            <label className="practiceRangeEnable">
              <input
                type="checkbox"
                checked={practiceRangeEnabled}
                onChange={(event) =>
                  setPracticeRangeEnabled(event.target.checked)
                }
              />
              <span>Practice Range</span>
            </label>

            <label className="practiceRangeField">
              <span>From</span>
              <select
                value={practiceRangeFrom}
                disabled={!practiceRangeEnabled}
                onChange={(event) => {
                  const nextFrom = Number(event.target.value);
                  setPracticeRangeFrom(nextFrom);
                  if (nextFrom > practiceRangeTo) {
                    setPracticeRangeTo(nextFrom);
                  }
                }}
              >
                {Array.from(
                  {
                    length:
                      selectedInstrument.frets -
                      (selectedInstrument.geometry.nonPlayableFrets?.includes(1)
                        ? 2
                        : 1) +
                      1,
                  },
                  (_, index) =>
                    (selectedInstrument.geometry.nonPlayableFrets?.includes(1)
                      ? 2
                      : 1) + index,
                ).map((fret) => (
                  <option key={`practice-from-${fret}`} value={fret}>
                    {fret}
                  </option>
                ))}
              </select>
            </label>

            <label className="practiceRangeField">
              <span>To</span>
              <select
                value={practiceRangeTo}
                disabled={!practiceRangeEnabled}
                onChange={(event) => {
                  const nextTo = Number(event.target.value);
                  setPracticeRangeTo(nextTo);
                  if (nextTo < practiceRangeFrom) {
                    setPracticeRangeFrom(nextTo);
                  }
                }}
              >
                {Array.from(
                  {
                    length:
                      selectedInstrument.frets -
                      (selectedInstrument.geometry.nonPlayableFrets?.includes(1)
                        ? 2
                        : 1) +
                      1,
                  },
                  (_, index) =>
                    (selectedInstrument.geometry.nonPlayableFrets?.includes(1)
                      ? 2
                      : 1) + index,
                ).map((fret) => (
                  <option key={`practice-to-${fret}`} value={fret}>
                    {fret}
                  </option>
                ))}
              </select>
            </label>

            {practiceRangeEnabled && (
              <div className="practiceRangeCount">
                <span>Matching positions</span>
                <strong>{practiceRangeMatchCount}</strong>
              </div>
            )}

            {practiceRangeEnabled && displayMode === "scale" && (
              <div className="recordPracticePathBar">
                <label className="recordPracticePathToggle">
                  <input
                    type="checkbox"
                    checked={recordPracticePathEnabled}
                    onChange={(event) => {
                      setRecordPracticePathEnabled(event.target.checked);
                      if (event.target.checked) {
                        setSelectedSavedPracticePathId("");
                        setPracticePathReviewIndex(null);
                        setPracticePathPlaying(false);
                      }
                      setSelectedPosition(null);
                      setSelectedNoteInfo(null);
                    }}
                  />
                  <span>Record Practice Path</span>
                </label>

                <span className="recordPracticePathCount">
                  {recordedPracticePath.length} notes
                </span>

                {recordedPracticePath.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="recordPracticePathButton"
                      onClick={() => {
                        setPracticePathPlaying(false);
                        setPracticePathReviewIndex(null);
                        setRecordedPracticePath((current) =>
                          current.slice(0, -1),
                        );
                      }}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="recordPracticePathButton"
                      onClick={() => {
                        setPracticePathPlaying(false);
                        setRecordedPracticePath([]);
                        setSelectedSavedPracticePathId("");
                        setPracticePathReviewIndex(null);
                      }}
                    >
                      Clear
                    </button>
                  </>
                )}

                {recordedPracticePath.length > 0 && (
                  <div className="practicePathReviewControls">
                    <button
                      type="button"
                      className="recordPracticePathButton"
                      onClick={() => {
                        setPracticePathPlaying(false);
                        setPracticePathReviewIndex((current) =>
                          current === null ? 0 : Math.max(0, current - 1),
                        );
                      }}
                    >
                      Previous
                    </button>

                    <span className="practicePathReviewStep">
                      {practicePathReviewIndex === null
                        ? "Review path"
                        : `Step ${practicePathReviewIndex + 1} / ${recordedPracticePath.length}`}
                    </span>

                    <button
                      type="button"
                      className="recordPracticePathButton"
                      onClick={() => {
                        setPracticePathPlaying(false);
                        setPracticePathReviewIndex((current) =>
                          current === null
                            ? 0
                            : Math.min(
                                recordedPracticePath.length - 1,
                                current + 1,
                              ),
                        );
                      }}
                    >
                      Next
                    </button>

                    <button
                      type="button"
                      className={
                        practicePathPlaying
                          ? "recordPracticePathButton practicePathPlayButton active"
                          : "recordPracticePathButton practicePathPlayButton"
                      }
                      onClick={() => {
                        if (practicePathPlaying) {
                          setPracticePathPlaying(false);
                          return;
                        }

                        setPracticePathReviewIndex((current) =>
                          current === null ||
                          current >= recordedPracticePath.length - 1
                            ? 0
                            : current,
                        );
                        setPracticePathPlaying(true);
                      }}
                    >
                      {practicePathPlaying ? "Pause" : "Play"}
                    </button>

                    <label className="practicePathSpeedControl">
                      <span>Speed</span>
                      <select
                        value={practicePathPlaybackSpeed}
                        onChange={(event) =>
                          setPracticePathPlaybackSpeed(
                            event.target.value as
                              | "slow"
                              | "medium"
                              | "fast",
                          )
                        }
                      >
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </label>

                    {practicePathReviewIndex !== null && (
                      <button
                        type="button"
                        className="recordPracticePathButton"
                        onClick={() => {
                          setPracticePathPlaying(false);
                          setPracticePathReviewIndex(null);
                        }}
                      >
                        Show all
                      </button>
                    )}
                  </div>
                )}

                <div className="recordPracticePathSave">
                  <input
                    type="text"
                    value={practicePathName}
                    placeholder="Path name"
                    aria-label="Practice path name"
                    onChange={(event) =>
                      setPracticePathName(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        saveRecordedPracticePath();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="recordPracticePathButton"
                    disabled={
                      !practicePathName.trim() ||
                      recordedPracticePath.length === 0
                    }
                    onClick={saveRecordedPracticePath}
                  >
                    Save Path
                  </button>
                </div>

                <span className="recordPracticePathSavedCount">
                  Saved: {instrumentSavedPracticePaths.length}
                </span>

                {loadedPracticePath && (
                  <div className="loadedPracticePathIndicator">
                    <span>Loaded</span>
                    <strong>{loadedPracticePath.name}</strong>
                    <small>
                      {loadedPracticePath.rootNote} {loadedPracticePath.selectedScale}
                    </small>
                  </div>
                )}

                {instrumentSavedPracticePaths.length > 0 && (
                  <div className="savedPracticePathControls">
                    <select
                      value={selectedSavedPracticePathId}
                      aria-label="Saved practice path"
                      onChange={(event) =>
                        setSelectedSavedPracticePathId(event.target.value)
                      }
                    >
                      <option value="">Saved paths…</option>
                      {instrumentSavedPracticePaths.map((path) => (
                        <option key={path.id} value={path.id}>
                          {path.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className="recordPracticePathButton"
                      disabled={!selectedSavedPracticePathId}
                      onClick={() =>
                        loadSavedPracticePath(selectedSavedPracticePathId)
                      }
                    >
                      Load
                    </button>

                    <button
                      type="button"
                      className="recordPracticePathButton savedPracticePathDelete"
                      disabled={!selectedSavedPracticePathId}
                      onClick={() =>
                        deleteSavedPracticePath(selectedSavedPracticePathId)
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}

                <small>
                  Click scale notes on the fretboard in the order you would play them.
                  Save keeps the path even after Clear or browser reload.
                </small>
              </div>
            )}
          </div>

          <div className="fretboardWorkspace">
            <TuningPanel
              tuning={tuning}
              stringGroups={
                selectedInstrument.geometry.stringGroups ?? []
              }
              availableNotes={CHROMATIC_NOTES}
              presets={availableTuningPresets}
              selectedPresetId={selectedTuningPresetId}
              onPresetChange={changeTuningPreset}
              onSaveCustomTuning={saveCustomTuning}
              onDeleteCustomTuning={deleteCustomTuning}
              onReset={() => {
                const preset =
                  availableTuningPresets.find(
                    (candidate) =>
                      candidate.id === selectedTuningPresetId,
                  ) ?? getDefaultTuningPreset(selectedInstrument);

                setTuning([...preset.tuning]);
              }}
              onStringChange={updateTuningString}
            />

            <Fretboard
              tuning={tuning}
            frets={selectedInstrument.frets}
            nonPlayableFrets={
              selectedInstrument.geometry.nonPlayableFrets ?? []
            }
            stringGroups={
              selectedInstrument.geometry.stringGroups ?? []
            }
            displayMode={displayMode}
            labelMode={labelMode}
            rootNote={rootNote}
            activeNoteIndexes={activeNoteIndexes}
            customNotes={customNotes}
            showOutsideNotes={showOutsideNotes}
            practiceRangeEnabled={practiceRangeEnabled}
            practiceRangeFrom={practiceRangeFrom}
            practiceRangeTo={practiceRangeTo}
            practiceScalePath={recordedPracticePath}
            practicePathReviewIndex={practicePathReviewIndex}
            octaveHighlightEnabled={octaveHighlightEnabled}
            highlightedNote={highlightedNote}
            explorerEnabled={explorerEnabled}
            explorerHighlights={getExplorerHighlights()}
            compareEnabled={compareEnabled}
            compareSharedNotes={
              compareIntervalSets(
                rootNote,
                SCALES[compareScaleA],
                SCALES[compareScaleB],
              ).shared
            }
            compareOnlyANotes={
              compareIntervalSets(
                rootNote,
                SCALES[compareScaleA],
                SCALES[compareScaleB],
              ).onlyA
            }
            compareOnlyBNotes={
              compareIntervalSets(
                rootNote,
                SCALES[compareScaleA],
                SCALES[compareScaleB],
              ).onlyB
            }
            compareDisplayNames={Object.fromEntries([
              ...getNotesFromIntervals(
                rootNote,
                SCALES[compareScaleA],
              ).map((note, index) => [
                note,
                spellScaleNotes(
                  rootNote,
                  SCALES[compareScaleA],
                )[index],
              ]),
              ...getNotesFromIntervals(
                rootNote,
                SCALES[compareScaleB],
              ).map((note, index) => [
                note,
                spellScaleNotes(
                  rootNote,
                  SCALES[compareScaleB],
                )[index],
              ]),
            ])}
            analyzerEnabled={chordAnalyzerEnabled}
            analyzerPositions={analyzerPositions}
            selectedPosition={selectedPosition}
            onNoteClick={handleFretboardNoteClick}
              onNoteDoubleClick={handleFretboardNoteDoubleClick}
            />
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
