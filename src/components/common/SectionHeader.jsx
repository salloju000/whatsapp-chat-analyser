import PropTypes from 'prop-types';

const SectionHeader = ({ icon: Icon, title, subtitle, tint = 'from-indigo-500/20 to-pink-500/20', iconClass = 'text-indigo-400' }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${tint} rounded-xl flex items-center justify-center border border-edge`}>
      <Icon className={`w-6 h-6 ${iconClass}`} aria-hidden="true" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-content-primary">{title}</h3>
      {subtitle && <p className="text-sm text-content-muted">{subtitle}</p>}
    </div>
  </div>
);

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  tint: PropTypes.string,
  iconClass: PropTypes.string,
};

export default SectionHeader;
