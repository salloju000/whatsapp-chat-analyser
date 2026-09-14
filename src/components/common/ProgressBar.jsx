import PropTypes from 'prop-types';

const ProgressBar = ({ value, gradient = 'from-indigo-500 to-indigo-600', label, height = 'h-2' }) => {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`${height} bg-content-primary/5 rounded-full overflow-hidden`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-[width] duration-700`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  gradient: PropTypes.string,
  label: PropTypes.string,
  height: PropTypes.string,
};

export default ProgressBar;
