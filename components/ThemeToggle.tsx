import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * P2.11 — Dark/light mode toggle button.
 * Mounted in the top bar.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-slate-400 hover:text-gold-400 transition-colors border border-navy-700 rounded"
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
      <span className="hidden md:inline">{theme === 'dark' ? 'Clair' : 'Sombre'}</span>
    </button>
  );
}
