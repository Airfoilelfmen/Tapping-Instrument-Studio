import {
  INSTRUMENT_PRESETS,
  type InstrumentPresetId,
} from "../music/instruments";

type MusicalSelectionPanelProps = {
  selectedInstrumentId: InstrumentPresetId;
  onInstrumentChange: (
    instrumentId: InstrumentPresetId,
  ) => void;
};

function MusicalSelectionPanel({
  selectedInstrumentId,
  onInstrumentChange,
}: MusicalSelectionPanelProps) {
  return (
    <>
      <div className="controlPanelHeading">
        <span>Instrument</span>
        <strong>Choose your instrument</strong>
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
            <option
              key={instrument.id}
              value={instrument.id}
            >
              {instrument.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export default MusicalSelectionPanel;
