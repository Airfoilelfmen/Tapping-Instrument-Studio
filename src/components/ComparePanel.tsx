import {
  SCALES,
  SCALE_GROUPS,
  type ScaleName,
} from "../music/musicData";
import { displayNote } from "../music/noteDisplay";

import {
  spellScaleNotes,
  type ScaleComparisonResult,
} from "../music/musicUtils";

type ComparePanelProps = {
  enabled: boolean;
  rootNote: string;
  scaleA: ScaleName;
  scaleB: ScaleName;
  comparison: ScaleComparisonResult;
  onEnabledChange: (enabled: boolean) => void;
  onScaleAChange: (scale: ScaleName) => void;
  onScaleBChange: (scale: ScaleName) => void;
};

function ComparePanel({
  enabled,
  rootNote,
  scaleA,
  scaleB,
  comparison,
  onEnabledChange,
  onScaleAChange,
  onScaleBChange,
}: ComparePanelProps) {
  const spelledA = spellScaleNotes(
    rootNote,
    SCALES[scaleA],
  );

  const spelledB = spellScaleNotes(
    rootNote,
    SCALES[scaleB],
  );


  const displayFor = (
    internalNote: string,
    scale: "A" | "B",
  ) => {
    const sourceInternal =
      scale === "A"
        ? SCALES[scaleA]
        : SCALES[scaleB];

    const sourceSpelled =
      scale === "A" ? spelledA : spelledB;

    const internalNotes = sourceInternal.map(
      (interval) => {
        const rootIndex = [
          "C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B",
        ].indexOf(rootNote);
        return [
          "C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B",
        ][(rootIndex + interval) % 12];
      },
    );

    const index = internalNotes.indexOf(internalNote);
    return index >= 0 ? sourceSpelled[index] : displayNote(internalNote);
  };

  return (
    <div className="compareSection">
      <div className="explorerHeading">
        <span>Compare</span>

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
        <span>Scale A</span>

        <select
          value={scaleA}
          disabled={!enabled}
          onChange={(event) =>
            onScaleAChange(
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

      <label className="explorerControl">
        <span>Scale B</span>

        <select
          value={scaleB}
          disabled={!enabled}
          onChange={(event) =>
            onScaleBChange(
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

      <div className="explorerResult">
        <span>Comparison</span>
        <strong>
          {enabled
            ? `${rootNote} ${scaleA} ↔ ${rootNote} ${scaleB}`
            : "Disabled"}
        </strong>
      </div>

      {enabled && (
        <>
          <div className="compareLegend">
            <div>
              <span className="compareLegendDot compareLegendShared" />
              Shared
            </div>
            <div>
              <span className="compareLegendDot compareLegendA" />
              {scaleA} only
            </div>
            <div>
              <span className="compareLegendDot compareLegendB" />
              {scaleB} only
            </div>
          </div>

          <div className="analyzerVoicingInfo">
            <span className="analyzerSectionLabel">
              Difference
            </span>

          <div className="analyzerInfoRow">
            <span>Shared</span>
            <strong>
              {comparison.shared
                .map((note) => displayFor(note, "A"))
                .join(" · ") || "—"}
            </strong>
          </div>

          <div className="analyzerInfoRow">
            <span>{scaleA} only</span>
            <strong>
              {comparison.onlyA
                .map((note) => displayFor(note, "A"))
                .join(" · ") || "—"}
            </strong>
          </div>

          <div className="analyzerInfoRow">
            <span>{scaleB} only</span>
            <strong>
              {comparison.onlyB
                .map((note) => displayFor(note, "B"))
                .join(" · ") || "—"}
            </strong>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

export default ComparePanel;
