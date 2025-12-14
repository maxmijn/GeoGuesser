import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <div className="theme-selector">
      <button
        id="theme-toggle"
        className="theme-toggle"
        title="Wissel thema"
        onClick={toggleTheme}
      >
        <span className="theme-icon default-icon">🎄</span>
        <span className="theme-icon christmas-icon">☀️</span>
      </button>
    </div>
  );
}
