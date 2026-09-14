import { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Stays local — nothing is reported anywhere.
    console.error('Dashboard render failed:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-surface-base">
        <div className="max-w-md w-full text-center bg-surface-card rounded-2xl p-8 border border-edge">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <AlertTriangle className="w-8 h-8 text-amber-500" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-content-primary mb-2">
            Something broke while drawing your results
          </h2>
          <p className="text-content-muted mb-6">
            Your chat was never uploaded anywhere, and nothing was saved. You can start over with
            the same file or a different one.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Start over
          </button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  onReset: PropTypes.func,
};

export default ErrorBoundary;
