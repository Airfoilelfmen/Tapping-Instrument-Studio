import {
  INSTRUMENT_PRESETS,
  type InstrumentPresetId,
} from "../music/instruments";

import {
  CHORDS,
  CHROMATIC_NOTES,
  SCALE_GROUPS,
  type ChordName,
  type DisplayMode,
  type LabelMode,
  type ScaleName,
} from "../music/musicData";

type MusicalSelectionPanelProps = {
  selectedInstrumentId: InstrumentPresetId;
  displayMode: DisplayMode;
  labelMode: LabelMode;
  rootNote: string;
  selectedScale: ScaleName;
  selectedChord: ChordName;
  customNotes: string[];
  showOutsideNotes: boolean;
  octaveHighlightEnabled: boolean;
  highlightedNote: string | null;
  selectionTitle: string;
  onInstrumentChange: (instrumentId: InstrumentPresetId) => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onLabelModeChange: (mode: LabelMode) => void;
  onRootNoteChange: (note: string) => void;
  onScaleChange: (scale: ScaleName) => void;
  onChordChange: (chord: ChordName) => void;
  onCustomNoteToggle: (note: string) => void;
  onClearCustomNotes: () => void;
  onShowOutsideNotesChange: (enabled: boolean) => void;
  onOctaveHighlightChange: (enabled: boolean) => void;
};

function MusicalSelectionPanel({
  selectedInstrumentId,
  displayMode,
  labelMode,
  rootNote,
  selectedScale,
  selectedChord,
  customNotes,
  showOutsideNotes,
  octaveHighlightEnabled,
  highlightedNote,
  selectionTitle,
  onInstrumentChange,
  onDisplayModeChange,
  onLabelModeChange,
  onRootNoteChange,
  onScaleChange,
  onChordChange,
  onCustomNoteToggle,
  onClearCustomNotes,
  onShowOutsideNotesChange,
  onOctaveHighlightChange,
}: MusicalSelectionPanelProps) {
  return (
    <>
      <div className="controlPanelHeading">
        <span>Musical selection</span>
        <strong>{selectionTitle}</strong>
      </div>

      <label className="controlGroup">
        <span>Instrument</span>

        <select
          value={selectedInstrumentId}
          onChange={(event) =>
            onInstrumentChange(
              event.target.value as InstrumentPresetId,
            )
          }
        >
          {INSTRUMENT_PRESETS.map((instrument) => (
            <option key={instrument.id} value={instrument.id}>
              {instrument.name}
            </option>
          ))}
        </select>
      </label>

      <div className="modeSelector">
        <button
          className={
            displayMode === "scale" ? "activeMode" : ""
          }
          onClick={() => onDisplayModeChange("scale")}
          type="button"
        >
          Scale
        </button>

        <button
          className={
            displayMode === "chord" ? "activeMode" : ""
          }
          onClick={() => onDisplayModeChange("chord")}
          type="button"
        >
          Chord
        </button>

        <button
          className={
            displayMode === "custom" ? "activeMode" : ""
          }
          onClick={() => onDisplayModeChange("custom")}
          type="button"
        >
          Custom
        </button>
      </div>

      <div className="labelModeSection">
        <span className="labelModeHeading">
          Display labels
        </span>

        <div className="labelModeSelector">
          <button
            type="button"
            className={
              labelMode === "notes"
                ? "activeLabelMode"
                : ""
            }
            onClick={() => onLabelModeChange("notes")}
          >
            Notes
          </button>

          <button
            type="button"
            className={
              labelMode === "intervals"
                ? "activeLabelMode"
                : ""
            }
            onClick={() => onLabelModeChange("intervals")}
          >
            Intervals
          </button>

          <button
            type="button"
            className={
              labelMode === "semitones"
                ? "activeLabelMode"
                : ""
            }
            onClick={() => onLabelModeChange("semitones")}
          >
            Semitones
          </button>

          <button
            type="button"
            className={
              labelMode === "hidden"
                ? "activeLabelMode"
                : ""
            }
            onClick={() => onLabelModeChange("hidden")}
          >
            Hide
          </button>
        </div>
      </div>

      {displayMode !== "custom" && (
        <label className="controlGroup">
          <span>Root note</span>

          <select
            value={rootNote}
            onChange={(event) =>
              onRootNoteChange(event.target.value)
            }
          >
            {CHROMATIC_NOTES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </label>
      )}

      {displayMode === "scale" && (
        <label className="controlGroup">
          <span>Scale or mode</span>

          <select
            value={selectedScale}
            onChange={(event) =>
              onScaleChange(
                event.target.value as ScaleName,
              )
            }
          >
            {SCALE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.scales.map((scaleName) => (
                  <option key={scaleName} value={scaleName}>
                    {scaleName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}

      {displayMode === "chord" && (
        <label className="controlGroup">
          <span>Chord type</span>

          <select
            value={selectedChord}
            onChange={(event) =>
              onChordChange(
                event.target.value as ChordName,
              )
            }
          >
            {Object.keys(CHORDS).map((chordName) => (
              <option key={chordName} value={chordName}>
                {chordName}
              </option>
            ))}
          </select>
        </label>
      )}

      {displayMode === "custom" && (
        <div className="customNoteSection">
          <span className="customNoteHeading">
            Select notes
          </span>

          <div className="customNoteGrid">
            {CHROMATIC_NOTES.map((note) => {
              const isSelected =
                customNotes.includes(note);

              return (
                <button
                  key={note}
                  className={
                    isSelected
                      ? "customNoteButton selectedCustomNote"
                      : "customNoteButton"
                  }
                  onClick={() => onCustomNoteToggle(note)}
                  type="button"
                >
                  {note}
                </button>
              );
            })}
          </div>

          <button
            className="clearNotesButton"
            onClick={onClearCustomNotes}
            type="button"
          >
            Clear notes
          </button>
        </div>
      )}

      <label className="checkboxControl">
        <input
          type="checkbox"
          checked={showOutsideNotes}
          onChange={(event) =>
            onShowOutsideNotesChange(
              event.target.checked,
            )
          }
        />

        <span>Show notes outside the selection</span>
      </label>

      <label className="checkboxControl octaveHighlightControl">
        <input
          type="checkbox"
          checked={octaveHighlightEnabled}
          onChange={(event) =>
            onOctaveHighlightChange(
              event.target.checked,
            )
          }
        />

        <span>
          Highlight clicked pitch
          {highlightedNote ? `: ${highlightedNote}` : ""}
        </span>
      </label>
    </>
  );
}

export default MusicalSelectionPanel;
