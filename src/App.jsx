import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './components/home/HomePage';
import ThemeToggle from './components/ThemeToggle';
import { useChatAnalysis } from './hooks/useChatAnalysis';

function App() {
  const { status, progress, analytics, meta, error, analyze, reset } = useChatAnalysis();

  return (
    <div className="relative w-full min-h-screen">
      {analytics ? (
        <>
          <ThemeToggle />
          <ErrorBoundary onReset={reset}>
            <Dashboard analytics={analytics} meta={meta} onReset={reset} />
          </ErrorBoundary>
        </>
      ) : (
        <HomePage onFile={analyze} status={status} progress={progress} error={error} />
      )}
    </div>
  );
}

export default App;
