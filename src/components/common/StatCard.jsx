import PropTypes from 'prop-types';
import AnimatedCounter from '../AnimatedCounter';

const StatCard = ({ icon: Icon, label, value, animate = true, iconClass = 'text-indigo-400', tint = 'from-indigo-500/20 to-pink-500/20', footer }) => (
  <div className="bg-surface-card rounded-2xl p-6 border border-edge hover:border-indigo-500/40 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${tint} rounded-xl flex items-center justify-center border border-edge`}>
        <Icon className={`w-6 h-6 ${iconClass}`} strokeWidth={2.5} aria-hidden="true" />
      </div>
      <h4 className="text-sm font-medium text-content-muted">{label}</h4>
    </div>

    <div className="text-4xl font-bold text-content-primary break-words">
      {animate && typeof value === 'number' ? <AnimatedCounter end={value} /> : value}
    </div>

    {footer && <p className="text-sm text-content-muted mt-2">{footer}</p>}
  </div>
);

StatCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  animate: PropTypes.bool,
  iconClass: PropTypes.string,
  tint: PropTypes.string,
  footer: PropTypes.string,
};

export default StatCard;
