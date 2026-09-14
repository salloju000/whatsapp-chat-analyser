import PropTypes from 'prop-types';

// Same geometry as public/logo.svg (scripts/generate-logo.mjs). Drawn inline so
// the ink follows the app's theme toggle rather than the OS color scheme.
const NODES = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 - Math.PI / 2;
  return { ux: Math.cos(a), uy: Math.sin(a), cardinal: i % 2 === 0 };
});

const LogoMark = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 32 32" className={`shrink-0 text-content-primary ${className}`} fill="none" aria-hidden="true">
    <g strokeLinecap="round" strokeWidth="2">
      {NODES.map(({ ux, uy, cardinal }, i) => (
        <line
          key={i}
          x1={16 + ux * 3.75}
          y1={16 + uy * 3.75}
          x2={16 + ux * 9.35}
          y2={16 + uy * 9.35}
          stroke="currentColor"
          className={cardinal ? 'text-teal-600 dark:text-teal-400' : undefined}
        />
      ))}
    </g>
    <g stroke="currentColor" strokeWidth="1.9">
      <circle cx="16" cy="16" r="3.75" strokeWidth="2.1" />
      {NODES.map(({ ux, uy }, i) => (
        <circle key={i} cx={16 + ux * 11.75} cy={16 + uy * 11.75} r="2.4" />
      ))}
    </g>
  </svg>
);

LogoMark.propTypes = {
  className: PropTypes.string,
};

export default LogoMark;
