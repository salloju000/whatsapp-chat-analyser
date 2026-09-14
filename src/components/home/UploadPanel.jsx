import { FileText, Lock, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import PropTypes from 'prop-types';

const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const ProgressRing = ({ percent }) => (
  <div className="relative h-28 w-28">
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
      <defs>
        <linearGradient id="ring-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r={RING_RADIUS} className="stroke-content-primary/10" strokeWidth="6" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={RING_RADIUS}
        stroke="url(#ring-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
        className="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-content-primary tabular-nums">
      {percent}%
    </span>
  </div>
);

ProgressRing.propTypes = { percent: PropTypes.number.isRequired };

const UploadPanel = ({ onFile, onBrowse, isWorking, percent }) => {
  const [isDragging, setIsDragging] = useState(false);

  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative rounded-3xl p-px bg-gradient-to-br from-blue-500/60 via-violet-500/40 to-fuchsia-500/60 shadow-[0_30px_80px_-30px_rgb(99_102_241_/_0.45)]">
      <div className="rounded-[calc(1.5rem-1px)] bg-surface-card/85 backdrop-blur-xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-medium text-content-secondary">
            <FileText className="h-4 w-4 text-violet-500" aria-hidden="true" />
            Your chat export
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Lock className="h-3 w-3" aria-hidden="true" />
            Stays on device
          </span>
        </div>

        {/* Pointer convenience only — the keyboard path is the "Analyze a
            chat" button, so this region is deliberately not focusable. */}
        <div
          onClick={isWorking ? undefined : onBrowse}
          onDragEnter={(e) => {
            stop(e);
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            stop(e);
            if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
          }}
          onDragOver={stop}
          onDrop={(e) => {
            stop(e);
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !isWorking) onFile(file);
          }}
          className={`flex min-h-[15rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
            isDragging
              ? 'border-violet-500 bg-violet-500/10'
              : 'border-edge bg-content-primary/[0.02] hover:border-violet-400/60'
          } ${isWorking ? 'cursor-wait' : 'cursor-pointer'}`}
        >
          {isWorking ? (
            <>
              <ProgressRing percent={percent} />
              <p className="mt-4 font-semibold text-content-primary">Analyzing locally…</p>
              <p className="mt-1 text-sm text-content-muted">Nothing is being uploaded.</p>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-violet-500/30">
                <UploadCloud className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <p className="font-semibold text-content-primary">
                {isDragging ? 'Release to analyze' : 'Drop your .txt export here'}
              </p>
              <p className="mt-1 text-sm text-content-muted">or click to browse</p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-content-muted">
          iOS &amp; Android exports · Large chats supported
        </p>
      </div>
    </div>
  );
};

UploadPanel.propTypes = {
  onFile: PropTypes.func.isRequired,
  onBrowse: PropTypes.func.isRequired,
  isWorking: PropTypes.bool.isRequired,
  percent: PropTypes.number.isRequired,
};

export default UploadPanel;
