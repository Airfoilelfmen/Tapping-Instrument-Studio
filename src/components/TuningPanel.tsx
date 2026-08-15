import { useState } from "react";

type TuningStringGroup = {
  id: string;
  name: string;
  stringNumbers: readonly number[];
};

type TuningPresetOption = {
  id: string;
  name: string;
  tuning: readonly string[];
};

type TuningPanelProps = {
  tuning: string[];
  stringGroups: readonly TuningStringGroup[];
  availableNotes: readonly string[];
  presets: readonly TuningPresetOption[];
  selectedPresetId: string;
  onPresetChange: (presetId: string) => void;
  onSaveCustomTuning: (name: string) => void;
  onDeleteCustomTuning: (presetId: string) => void;
  onReset: () => void;
  onStringChange: (stringIndex: number, note: string) => void;
};

function TuningPanel({
  tuning,
  stringGroups,
  availableNotes,
  presets,
  selectedPresetId,
  onPresetChange,
  onSaveCustomTuning,
  onDeleteCustomTuning,
  onReset,
  onStringChange,
}: TuningPanelProps) {
  const [customTuningName, setCustomTuningName] = useState("");

  function handleSaveCustomTuning() {
    const trimmedName = customTuningName.trim();
    if (!trimmedName) return;
    onSaveCustomTuning(trimmedName);
    setCustomTuningName("");
  }

  const displayedStrings =
    stringGroups.length > 1
      ? stringGroups.flatMap((group) =>
          group.stringNumbers.map((stringNumber) => ({
            stringIndex: stringNumber - 1,
            stringNumber,
            note: tuning[stringNumber - 1],
            groupName: group.name,
          })),
        )
      : [...tuning]
          .map((note, stringIndex) => ({
            stringIndex,
            stringNumber: stringIndex + 1,
            note,
            groupName: "",
          }))
          .reverse();

  const selectedPresetIsCustom = selectedPresetId.startsWith("custom-");

  return (
    <aside className="fretboardTuningPanel">
      <div className="fretboardTuningHeader">
        <span>Tuning</span>

        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="fretboardTuningPreset">
        <select
          value={selectedPresetId}
          aria-label="Tuning preset"
          onChange={(event) =>
            onPresetChange(event.target.value)
          }
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>

        {selectedPresetIsCustom && (
          <button
            type="button"
            className="fretboardTuningDelete"
            onClick={() => {
              const preset = presets.find(
                (candidate) => candidate.id === selectedPresetId,
              );
              if (preset && window.confirm(`Delete custom tuning "${preset.name}"?`)) {
                onDeleteCustomTuning(selectedPresetId);
              }
            }}
          >
            Delete custom preset
          </button>
        )}
      </div>

      <div className="fretboardTuningSave">
        <input
          type="text"
          value={customTuningName}
          placeholder="Custom name"
          aria-label="Custom tuning name"
          onChange={(event) => setCustomTuningName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSaveCustomTuning();
          }}
        />
        <button type="button" disabled={!customTuningName.trim()} onClick={handleSaveCustomTuning}>
          Save
        </button>
      </div>

      <div className="fretboardTuningRows">
        {displayedStrings.map(
          ({ note, stringIndex, stringNumber }) => {
          return (
            <label
              key={`fretboard-tuning-${stringIndex}`}
              className="fretboardTuningRow"
            >
              <span>S{stringNumber}</span>

              <select
                value={
                  note === "F#"
                    ? "Gb"
                    : note === "C#"
                      ? "Db"
                      : note
                }
                aria-label={`Tune string ${stringIndex + 1}`}
                onChange={(event) =>
                  onStringChange(
                    stringIndex,
                    event.target.value,
                  )
                }
              >
                {availableNotes.map((availableNote) => (
                  <option
                    key={availableNote}
                    value={availableNote}
                  >
                    {stringNumber === 5 && availableNote === "Gb"
                      ? "F#"
                      : stringNumber === 6 &&
                          availableNote === "Db"
                        ? "C#"
                        : availableNote}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </aside>
  );
}

export default TuningPanel;
