import { displayNote } from "../music/noteDisplay";

type SelectedNotesPanelProps = {
  activeNoteIndexes: number[];
  noteNames: readonly string[];
};

function SelectedNotesPanel({
  activeNoteIndexes,
  noteNames,
}: SelectedNotesPanelProps) {
  return (
    <div className="scaleNotes">
      <span>Selected notes</span>

      <div className="scaleNoteList">
        {activeNoteIndexes.map((noteIndex, index) => {
          const note = noteNames[noteIndex];

          return (
            <strong
              key={`${note}-${index}`}
              className={
                index === 0 ? "selectedRootNote" : ""
              }
            >
              {displayNote(note)}
            </strong>
          );
        })}
      </div>
    </div>
  );
}

export default SelectedNotesPanel;
