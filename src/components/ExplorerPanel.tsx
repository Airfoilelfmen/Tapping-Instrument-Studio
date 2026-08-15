import {
  CHORDS,
  CHROMATIC_NOTES,
  SCALE_GROUPS,
  type ChordName,
  type ScaleName,
} from "../music/musicData";
import { displayNote, displayNotes } from "../music/noteDisplay";

type ExplorerMode =
  | "notes"
  | "intervals"
  | "chords"
  | "scales";

type ExplorerPanelProps = {
  enabled: boolean;
  mode: ExplorerMode;
  targetNote: string;
  targetInterval: number;
  targetChord: ChordName;
  targetScale: ScaleName;
  occurrenceCount: number;
  resolvedTargetNote: string;
  chordToneDetails: string[];
  scaleNotes: string[];
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: ExplorerMode) => void;
  onTargetNoteChange: (note: string) => void;
  onTargetIntervalChange: (interval: number) => void;
  onTargetChordChange: (chord: ChordName) => void;
  onTargetScaleChange: (scale: ScaleName) => void;
};

function ExplorerPanel({
  enabled,
  mode,
  targetNote,
  targetInterval,
  targetChord,
  targetScale,
  occurrenceCount,
  resolvedTargetNote,
  chordToneDetails,
  scaleNotes,
  onEnabledChange,
  onModeChange,
  onTargetNoteChange,
  onTargetIntervalChange,
  onTargetChordChange,
  onTargetScaleChange,
}: ExplorerPanelProps) {
  return (
    <div className="explorerSection">
      <div className="explorerHeading">
        <span>Fretboard Explorer</span>

        <label className="explorerToggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) =>
              onEnabledChange(event.target.checked)
            }
          />
          <span>{enabled ? "On" : "Off"}</span>
        </label>
      </div>

      <label className="explorerControl">
        <span>Mode</span>
        <select
          value={mode}
          onChange={(event) =>
            onModeChange(
              event.target.value as ExplorerMode,
            )
          }
        >
          <option value="notes">Notes</option>
          <option value="intervals">Intervals</option>
          <option value="chords">Chords</option>
          <option value="scales">Scales</option>
        </select>
      </label>

      <label className="explorerControl">
        <span>
          {mode === "notes"
            ? "Target note"
            : mode === "intervals"
              ? "Target interval"
              : mode === "chords"
                ? "Target chord"
                : "Target scale"}
        </span>

        {mode === "notes" ? (
          <select
            value={targetNote}
            onChange={(event) =>
              onTargetNoteChange(event.target.value)
            }
            disabled={!enabled}
          >
            {CHROMATIC_NOTES.map((note) => (
              <option key={note} value={note}>
                {displayNote(note)}
              </option>
            ))}
          </select>
        ) : mode === "intervals" ? (
          <select
            value={targetInterval}
            onChange={(event) =>
              onTargetIntervalChange(
                Number(event.target.value),
              )
            }
            disabled={!enabled}
          >
            <option value={0}>Unison</option>
            <option value={1}>Minor Second</option>
            <option value={2}>Major Second</option>
            <option value={3}>Minor Third</option>
            <option value={4}>Major Third</option>
            <option value={5}>Perfect Fourth</option>
            <option value={6}>Tritone</option>
            <option value={7}>Perfect Fifth</option>
            <option value={8}>Minor Sixth</option>
            <option value={9}>Major Sixth</option>
            <option value={10}>Minor Seventh</option>
            <option value={11}>Major Seventh</option>
          </select>
        ) : mode === "chords" ? (
          <select
            value={targetChord}
            onChange={(event) =>
              onTargetChordChange(
                event.target.value as ChordName,
              )
            }
            disabled={!enabled}
          >
            {Object.keys(CHORDS).map((chordName) => (
              <option key={chordName} value={chordName}>
                {chordName}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={targetScale}
            onChange={(event) =>
              onTargetScaleChange(
                event.target.value as ScaleName,
              )
            }
            disabled={!enabled}
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
        )}
      </label>

      <div className="explorerResult">
        <span>
          {mode === "notes"
            ? "Occurrences"
            : mode === "intervals"
              ? "Resolved target"
              : mode === "chords"
                ? "Selected chord"
                : "Selected scale"}
        </span>

        <strong>
          {!enabled
            ? "Disabled"
            : mode === "notes"
              ? `${occurrenceCount} positions`
              : mode === "intervals"
                ? `${resolvedTargetNote} · ${occurrenceCount} positions`
                : mode === "chords"
                  ? chordToneDetails.join(" · ")
                  : displayNotes(scaleNotes).join(" · ")}
        </strong>
      </div>
    </div>
  );
}

export default ExplorerPanel;
