type AppHeaderProps = {
  description: string;
  tuning: string[];
};

function AppHeader(_props: AppHeaderProps) {
  return (
    <header className="appHeader">
      <div>
        <p className="eyebrow">
          Interactive instrument map
        </p>

        <h1>Tapping Instrument Studio</h1>
      </div>
    </header>
  );
}

export default AppHeader;
