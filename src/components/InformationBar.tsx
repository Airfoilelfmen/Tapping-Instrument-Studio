type InformationBarProps = {
  instrumentName: string;
  frets: number;
  strings: number;
  explorerText: string;
  selectionText: string;
};

function InformationBar({
  instrumentName,
  frets,
  strings,
  explorerText,
  selectionText,
}: InformationBarProps) {
  return (
    <div className="informationBar">
      <div>
        <span className="informationLabel">Instrument</span>
        <strong>{instrumentName}</strong>
      </div>

      <div>
        <span className="informationLabel">Frets</span>
        <strong>{frets}</strong>
      </div>

      <div>
        <span className="informationLabel">Strings</span>
        <strong>{strings}</strong>
      </div>

      <div>
        <span className="informationLabel">Fretboard Explorer</span>
        <strong>{explorerText}</strong>
      </div>

      <div>
        <span className="informationLabel">Selection</span>
        <strong>{selectionText}</strong>
      </div>
    </div>
  );
}

export default InformationBar;
