// Illustrative only. Fixed sample numbers, clearly labelled — the real
// dashboard is computed from the user's own file.
const HOURLY = [3, 2, 1, 1, 1, 2, 5, 12, 22, 26, 24, 28, 31, 27, 24, 26, 30, 36, 42, 50, 58, 64, 46, 18];
const PEAK = Math.max(...HOURLY);

const STATS = [
  { label: 'Messages', value: '48,219' },
  { label: 'Active days', value: '612' },
  { label: 'Peak hour', value: '9 PM' },
];

const WORDS = ['tonight', 'dinner', 'haha', 'weekend', 'call', 'tomorrow'];

const InsightPreview = () => (
  <figure className="relative mx-auto max-w-5xl">
    <div className="rounded-3xl p-px bg-gradient-to-br from-blue-500/40 via-violet-500/25 to-cyan-500/40">
      <div className="rounded-[calc(1.5rem-1px)] bg-surface-card p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold text-white">
              AS
            </span>
            <div>
              <p className="font-semibold text-content-primary">Aisha &amp; Sam</p>
              <p className="text-xs text-content-muted">Android export · 2 participants</p>
            </div>
          </div>
          <span className="rounded-full border border-edge px-3 py-1 text-xs font-medium text-content-muted">
            Sample data
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-content-primary/[0.03] border border-edge p-3 sm:p-5">
              <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-content-muted">{stat.label}</p>
              <p className="mt-1 text-lg sm:text-3xl font-bold text-content-primary tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-3 text-sm font-medium text-content-secondary">Activity by hour</p>
            <div className="flex h-36 items-end gap-[3px] sm:gap-1.5" aria-hidden="true">
              {HOURLY.map((value, hour) => (
                <div
                  key={hour}
                  className={`flex-1 rounded-t-md bg-gradient-to-t ${
                    value === PEAK ? 'from-violet-600 to-fuchsia-400' : 'from-blue-500/70 to-cyan-400/70'
                  }`}
                  style={{ height: `${Math.max((value / PEAK) * 100, 4)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-content-muted" aria-hidden="true">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="mb-3 text-sm font-medium text-content-secondary">Who talks more</p>
              <div className="flex h-3 overflow-hidden rounded-full" aria-hidden="true">
                <div className="bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: '54%' }} />
                <div className="bg-gradient-to-r from-cyan-400 to-teal-400" style={{ width: '46%' }} />
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-content-secondary">Aisha <span className="text-content-muted">54%</span></span>
                <span className="text-content-secondary">Sam <span className="text-content-muted">46%</span></span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-content-secondary">Most used words</p>
              <ul className="flex flex-wrap gap-2">
                {WORDS.map((word, i) => (
                  <li
                    key={word}
                    className={`rounded-lg border border-edge px-2.5 py-1 text-sm ${
                      i === 0 ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold' : 'text-content-secondary'
                    }`}
                  >
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <figcaption className="sr-only">
      Example dashboard with sample data: 48,219 messages over 612 active days, busiest at 9 PM,
      split 54% to 46% between two participants.
    </figcaption>
  </figure>
);

export default InsightPreview;
