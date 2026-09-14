import { AlertCircle, ArrowRight, Lock } from 'lucide-react';
import { useRef } from 'react';
import PropTypes from 'prop-types';
import ThemeToggle from '../ThemeToggle';
import LogoMark from '../common/LogoMark';
import HeroBackground from './HeroBackground';
import { Features, FinalCta, HowItWorks, Privacy, SectionIntro } from './HomeSections';
import InsightPreview from './InsightPreview';
import UploadPanel from './UploadPanel';

// Decorative hints of what the analysis produces, floating around the upload
// panel on wide screens only.
const HINTS = [
  { text: 'Peak hour · 10 PM', className: '-left-12 top-28', dot: 'bg-violet-500', delay: '0s' },
  { text: '3 participants', className: '-right-6 top-[46%]', dot: 'bg-cyan-500', delay: '-2.5s' },
  { text: '612 active days', className: '-left-8 bottom-20', dot: 'bg-fuchsia-500', delay: '-4.5s' },
];

const HomePage = ({ onFile, status, progress, error }) => {
  const inputRef = useRef(null);
  const isWorking = status === 'working';
  const percent = Math.round(progress * 100);

  const openPicker = () => {
    if (!isWorking) inputRef.current?.click();
  };

  // Progress and errors render in the hero, and the dashboard replaces this
  // page on success — start from the top so neither appears off-screen.
  const handleFile = (file) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onFile(file);
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-surface-base">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      <div className="relative">
        <HeroBackground />

        <header className="relative z-10">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8" aria-label="Main">
            <a href="#top" className="flex items-center gap-2.5 rounded-lg">
              <LogoMark />
              <span className="font-semibold tracking-tight text-content-primary">
                WhatsApp Chat <span className="text-content-muted font-normal">Analyzer</span>
              </span>
            </a>
            <div className="flex items-center gap-1 sm:gap-2">
              <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-content-secondary hover:text-content-primary md:inline-block">
                How it works
              </a>
              <a href="#privacy" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-content-secondary hover:text-content-primary md:inline-block">
                Privacy
              </a>
              <ThemeToggle floating={false} />
            </div>
          </nav>
        </header>

        <main id="top">
          <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface-card/70 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-content-secondary backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Private by design — analyzed on your device
              </p>

              <h1 className="mt-6 text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[3.5rem] xl:text-[4.25rem] font-bold tracking-tight text-content-primary">
                Understand every{' '}
                <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  conversation
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-content-muted lg:mx-0">
                Turn a WhatsApp chat export into clear insights — who talks most, when you’re most
                active, your favorite emoji and words.
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button type="button" onClick={openPicker} disabled={isWorking} className="btn-primary text-base">
                  {isWorking ? `Analyzing… ${percent}%` : 'Analyze a chat'}
                  {!isWorking && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
                </button>
                <a href="#how-it-works" className="btn-secondary text-base">
                  How it works
                </a>
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-content-muted lg:justify-start">
                <Lock className="h-4 w-4" aria-hidden="true" />
                No sign-up. Nothing is uploaded.
              </p>

              <div aria-live="polite" className="mx-auto max-w-xl lg:mx-0">
                {isWorking && <span className="sr-only">Analyzing your chat on this device…</span>}
                {error && (
                  <div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-content-primary">{error.title}</p>
                      <p className="mt-1 text-sm text-content-muted">{error.detail}</p>
                      {error.samples?.length > 0 && (
                        <pre className="mt-3 overflow-x-auto rounded-lg border border-edge bg-surface-raised p-3 text-xs text-content-muted">
                          {error.samples.join('\n')}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-lg">
              {HINTS.map((hint) => (
                <span
                  key={hint.text}
                  aria-hidden="true"
                  className={`absolute z-10 hidden items-center gap-2 rounded-full border border-edge bg-surface-card/90 px-3 py-1.5 text-xs font-medium text-content-secondary shadow-lg backdrop-blur xl:inline-flex animate-float ${hint.className}`}
                  style={{ animationDelay: hint.delay }}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${hint.dot}`} />
                  {hint.text}
                </span>
              ))}
              <UploadPanel onFile={handleFile} onBrowse={openPicker} isWorking={isWorking} percent={percent} />
            </div>
          </section>
        </main>
      </div>

      <section className="relative isolate px-5 py-16 sm:py-20">
        <div
          aria-hidden="true"
          className="aurora-orb pointer-events-none absolute -z-10 left-1/2 top-1/2 h-[36rem] w-[min(60rem,120vw)] -translate-x-1/2 -translate-y-1/3"
          style={{ background: 'radial-gradient(closest-side, rgb(99 102 241 / calc(var(--orb-alpha) * 0.6)), transparent)' }}
        />
        <SectionIntro eyebrow="Preview" title="A clear picture of any chat">
          Every export becomes a dashboard like this one, built from your own messages.
        </SectionIntro>
        <InsightPreview />
      </section>

      <Features />
      <HowItWorks />
      <Privacy />
      <FinalCta onBrowse={openPicker} isWorking={isWorking} />

      <footer className="border-t border-edge px-5 py-8 text-center text-sm text-content-muted">
        WhatsApp Chat Analyzer · Runs entirely in your browser · Not affiliated with WhatsApp or Meta
      </footer>
    </div>
  );
};

HomePage.propTypes = {
  onFile: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  progress: PropTypes.number,
  error: PropTypes.object,
};

export default HomePage;
