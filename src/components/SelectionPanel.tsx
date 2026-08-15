import { displayNote } from "../music/noteDisplay";

type SelectedNoteInfo = {
  note: string;
  stringIndex: number;
  fret: number;
};

type IntervalInfo = {
  longName: string;
  symbol: string;
  semitones: string;
  stringLabel: string;
};

type SelectionPanelProps = {
  selectedNoteInfo: SelectedNoteInfo | null;
  intervalInfo: IntervalInfo;
  onClear: () => void;
};

function SelectionPanel({
  selectedNoteInfo,
  intervalInfo,
  onClear,
}: SelectionPanelProps) {
  return (
    <section
      className={
        selectedNoteInfo
          ? "selectionPanel"
          : "selectionPanel selectionPanelIdle"
      }
    >
      <div className="selectionPanelHeading">
        <div>
          <span>Selected position</span>
          <strong>
            {selectedNoteInfo
              ? displayNote(selectedNoteInfo.note)
              : "Click a note"}
          </strong>
        </div>

        {selectedNoteInfo && (
          <div className="selectionPanelActions">
            <button type="button" onClick={onClear}>
              Clear
            </button>
          </div>
        )}
      </div>

      {selectedNoteInfo && (
        <div className="selectionDetails">
          <div>
            <span>Note</span>
            <strong>{displayNote(selectedNoteInfo.note)}</strong>
          </div>

          <div>
            <span>String</span>
            <strong>{intervalInfo.stringLabel}</strong>
          </div>

          <div>
            <span>Fret</span>
            <strong>{selectedNoteInfo.fret}</strong>
          </div>

          <div>
            <span>Interval from root</span>
            <strong>{intervalInfo.longName}</strong>
          </div>

          <div>
            <span>Symbol</span>
            <strong>{intervalInfo.symbol}</strong>
          </div>

          <div>
            <span>Semitones</span>
            <strong>{intervalInfo.semitones}</strong>
          </div>
        </div>
      )}
    </section>
  );
}

export default SelectionPanel;
