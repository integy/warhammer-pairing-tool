export function Header({ onSettings }: { onSettings: () => void }) {
  return (
    <header className="header">
      <h1>🏆 WTC Team Pairing Tool</h1>
      <p className="subtitle">Hong Kong Team · Official Helper</p>
      <button className="settings-btn" onClick={onSettings} title="Settings">⚙️</button>
    </header>
  );
}
