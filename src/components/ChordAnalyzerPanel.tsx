import { CHORDS } from "../music/musicData";
import { displayNote, displayNotes } from "../music/noteDisplay";

import {
  getChordInversionLabel,
  type ChordMatch,
  type NearChordMatch,
} from "../music/musicUtils";

type ChordAnalyzerPanelProps = {
  enabled: boolean;
  selectedNotes: readonly string[];
  matches: ChordMatch[];
  nearMatches: NearChordMatch[];
  bassNote: string | null;
  voicingNotes: readonly string[];
  doublings: readonly {
    note: string;
    count: number;
  }[];
  onEnabledChange: (enabled: boolean) => void;
  onClear: () => void;
  onUseMatch: (match: ChordMatch) => void;
};

function ChordAnalyzerPanel({
  enabled,
  selectedNotes,
  matches,
  nearMatches,
  bassNote,
  voicingNotes,
  doublings,
  onEnabledChange,
  onClear,
  onUseMatch,
}: ChordAnalyzerPanelProps) {
  return (
    <div className="scaleNotes">
      <div className="explorerHeading">
        <span>Chord analyzer</span>

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

      {enabled && selectedNotes.length > 0 && (
        <>
          <div className="analyzerVoicingInfo">
            <span className="analyzerSectionLabel">
              Voicing
            </span>

            <div className="analyzerInfoRow">
              <span>Selected</span>
              <strong>{displayNotes(selectedNotes).join(" · ")}</strong>
            </div>

            {bassNote && (
              <div className="analyzerInfoRow">
                <span>Bass</span>
                <strong>{displayNote(bassNote)}</strong>
              </div>
            )}

            {voicingNotes.length > 1 && (
              <div className="analyzerInfoRow">
                <span>Low → high</span>
                <strong>{displayNotes(voicingNotes).join(" · ")}</strong>
              </div>
            )}

            {doublings.length > 0 && (
              <div className="analyzerInfoRow">
                <span>Doublings</span>
                <strong>
                  {doublings
                    .map(
                      (doubling) =>
                        `${displayNote(doubling.note)} ×${doubling.count}`,
                    )
                    .join(" · ")}
                </strong>
              </div>
            )}
          </div>

          <button
            type="button"
            className="clearNotesButton"
            onClick={onClear}
          >
            Clear analyzer notes
          </button>
        </>
      )}

      <div className="scaleNoteList">
        {enabled && selectedNotes.length < 2 ? (
          <strong>Click notes on the fretboard</strong>
        ) : !enabled && selectedNotes.length < 2 ? (
          <strong>Select notes in Custom mode</strong>
        ) : matches.length > 0 ? (
          <>
            <span>Exact match</span>
            {matches.map((match) => (
              <button
                key={`${match.rootNote}-${match.chordName}`}
                type="button"
                className="customNoteButton"
                onClick={() => onUseMatch(match)}
                title="Use this chord as the main selection"
              >
                {(() => {
                  const inversion =
                    getChordInversionLabel(
                      match.rootNote,
                      bassNote,
                      CHORDS[
                        match.chordName as keyof typeof CHORDS
                      ],
                    );

                  const slashBass =
                    bassNote &&
                    bassNote !== match.rootNote
                      ? ` / ${displayNote(bassNote)}`
                      : "";

                  return `${displayNote(match.rootNote)} ${match.chordName}${slashBass}${
                    inversion ? ` · ${inversion}` : ""
                  }`;
                })()}
              </button>
            ))}
          </>
        ) : nearMatches.length > 0 ? (
          <>
            <span>Suggestions</span>
            {nearMatches.map((match) => (
              <button
                key={`${match.rootNote}-${match.chordName}`}
                type="button"
                className="customNoteButton"
                onClick={() => onUseMatch(match)}
                title="Use this chord as the main selection"
              >
                {match.rootNote} {match.chordName}
                {match.missingNotes.length > 0
                  ? ` · missing ${displayNotes(match.missingNotes).join(", ")}`
                  : ""}
                {match.extraNotes.length > 0
                  ? ` · extra ${displayNotes(match.extraNotes).join(", ")}`
                  : ""}
              </button>
            ))}
          </>
        ) : (
          <strong>No close chord match</strong>
        )}
      </div>
    </div>
  );
}

export default ChordAnalyzerPanel;
