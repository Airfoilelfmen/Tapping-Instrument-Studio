import type { DisplayMode } from "../music/musicData";

type ExplorerMode =
  | "notes"
  | "intervals"
  | "chords"
  | "scales";

type LegendPanelProps = {
  displayMode: DisplayMode;
  explorerEnabled: boolean;
  explorerMode: ExplorerMode;
  analyzerEnabled: boolean;
};

function DegreeLegend() {
  return (
    <>
      <div>
        <span className="legendCircle degreeRootLegend" />
        Root
      </div>
      <div>
        <span className="legendCircle degreeSecondLegend" />
        2nd
      </div>
      <div>
        <span className="legendCircle degreeThirdLegend" />
        3rd
      </div>
      <div>
        <span className="legendCircle degreeFourthLegend" />
        4th
      </div>
      <div>
        <span className="legendCircle degreeFifthLegend" />
        5th
      </div>
      <div>
        <span className="legendCircle degreeSixthLegend" />
        6th
      </div>
      <div>
        <span className="legendCircle degreeSeventhLegend" />
        7th
      </div>
    </>
  );
}

function LegendPanel({
  displayMode,
  explorerEnabled,
  explorerMode,
  analyzerEnabled,
}: LegendPanelProps) {
  return (
    <div className="legend">
      <p className="legendTitle">
        {analyzerEnabled
          ? "Analyzer colors"
          : explorerEnabled
            ? "Fretboard colors"
            : "Colors"}
      </p>

      {analyzerEnabled ? (
        <>
          <div>
            <span className="legendCircle analyzerSelectedLegend" />
            Analyzer selected
          </div>
          <div>
            <span className="legendCircle analyzerBackgroundLegend" />
            Background selection
          </div>
        </>
      ) : explorerEnabled ? (
        explorerMode === "notes" || explorerMode === "intervals" ? (
          <div>
            <span className="legendCircle explorerLegend" />
            Highlighted note
          </div>
        ) : explorerMode === "chords" ? (
          <DegreeLegend />
        ) : (
          <DegreeLegend />
        )
      ) : (
        <>
          <div>
            <span className="legendCircle rootLegend" />
            {displayMode === "custom"
              ? "First selected note"
              : "Root note"}
          </div>

          {displayMode === "chord" ? (
            <>
              <div>
                <span className="legendCircle thirdLegend" />
                Third
              </div>

              <div>
                <span className="legendCircle fifthLegend" />
                Perfect fifth
              </div>

              <div>
                <span className="legendCircle chordLegend" />
                Other chord tone
              </div>
            </>
          ) : (
            <div>
              <span className="legendCircle scaleLegend" />
              Selected note
            </div>
          )}

          <div>
            <span className="legendCircle outsideLegend" />
            Outside selection
          </div>
        </>
      )}
    </div>
  );
}

export default LegendPanel;
