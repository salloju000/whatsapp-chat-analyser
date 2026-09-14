import { Moon, Sun } from 'lucide-react';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ floating = true }) => {
  const { isDark, toggleTheme } = useTheme();

  const position = floating
    ? 'fixed top-6 right-6 z-50 p-3 glass-card hover:scale-110'
    : 'p-2.5 rounded-xl border border-edge bg-surface-card/60 backdrop-blur hover:bg-content-primary/5';

  return (
    <button
      onClick={toggleTheme}
      className={`${position} transition-transform`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun className={floating ? 'w-6 h-6 text-amber-400' : 'w-5 h-5 text-amber-400'} aria-hidden="true" />
      ) : (
        <Moon className={floating ? 'w-6 h-6 text-indigo-600' : 'w-5 h-5 text-indigo-600'} aria-hidden="true" />
      )}
    </button>
  );
};

ThemeToggle.propTypes = { floating: PropTypes.bool };

export default ThemeToggle;
