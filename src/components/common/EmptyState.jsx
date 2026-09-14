import PropTypes from 'prop-types';

const EmptyState = ({ emoji, message }) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4 opacity-50" aria-hidden="true">
      {emoji}
    </div>
    <p className="text-content-muted">{message}</p>
  </div>
);

EmptyState.propTypes = {
  emoji: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

export default EmptyState;
