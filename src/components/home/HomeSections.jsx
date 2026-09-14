import {
  ArrowRight,
  CalendarRange,
  Clock,
  Cpu,
  Download,
  EyeOff,
  Image,
  Languages,
  MousePointerClick,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
} from 'lucide-react';
import PropTypes from 'prop-types';

export const SectionIntro = ({ eyebrow, title, children }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
      {eyebrow}
    </p>
    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance text-content-primary">{title}</h2>
    {children && <p className="mt-4 text-lg text-content-muted">{children}</p>}
  </div>
);

SectionIntro.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const FEATURES = [
  { icon: Users, title: 'Who carries the conversation', body: 'Message share for every participant, from one-on-one chats to large groups.', tint: 'text-blue-500 bg-blue-500/10' },
  { icon: Clock, title: 'Your daily rhythm', body: 'The hours and weekdays you actually talk, down to the busiest hour.', tint: 'text-violet-500 bg-violet-500/10' },
  { icon: Smile, title: 'Emoji and words', body: 'Top emoji counted correctly — including skin tones, flags and families.', tint: 'text-fuchsia-500 bg-fuchsia-500/10' },
  { icon: CalendarRange, title: 'The full timeline', body: 'First and latest message, days together and your single busiest day.', tint: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' },
  { icon: Image, title: 'Media, links, deletions', body: 'Shared photos, links and deleted messages, kept out of your word stats.', tint: 'text-teal-600 dark:text-teal-400 bg-teal-500/10' },
  { icon: Languages, title: 'Any language', body: 'Hindi, Arabic, Cyrillic, accented and right-to-left text all count.', tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
];

export const Features = () => (
  <section id="features" className="scroll-mt-8 px-5 py-16 sm:py-20">
    <SectionIntro eyebrow="What you get" title="Insights that go beyond message counts" />
    <ul className="mx-auto grid max-w-6xl gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, body, tint }) => (
        <li key={title} className="flex gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold text-content-primary">{title}</h3>
            <p className="mt-1.5 text-content-muted leading-relaxed">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

const STEPS = [
  { icon: Download, title: 'Export the chat', body: 'In WhatsApp, open the chat → Export chat → Without media. Unzip it if needed.' },
  { icon: MousePointerClick, title: 'Drop in the .txt', body: 'Choose the file or drag it onto the page. Format and date order are detected for you.' },
  { icon: Sparkles, title: 'Explore the results', body: 'A full dashboard appears in seconds, even for chats with hundreds of thousands of messages.' },
];

const FORMATS = ['iOS', 'Android', '12h & 24h clocks', 'DD/MM and MM/DD', 'One-on-one & groups', 'Multi-line messages'];

export const HowItWorks = () => (
  <section id="how-it-works" className="scroll-mt-8 px-5 py-16 sm:py-20">
    <SectionIntro eyebrow="How it works" title="Three steps, no sign-up" />

    <ol className="relative mx-auto grid max-w-5xl gap-10 md:grid-cols-3 md:gap-8">
      <div
        aria-hidden="true"
        className="absolute left-[16.7%] right-[16.7%] top-6 hidden h-px bg-gradient-to-r from-blue-500/50 via-violet-500/50 to-cyan-500/50 md:block"
      />
      {STEPS.map(({ icon: Icon, title, body }, index) => (
        <li key={title} className="relative text-center">
          <span className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-base">
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600" />
            <Icon className="relative h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-content-muted">Step {index + 1}</p>
          <h3 className="mt-1 text-lg font-semibold text-content-primary">{title}</h3>
          <p className="mx-auto mt-2 max-w-xs text-content-muted leading-relaxed">{body}</p>
        </li>
      ))}
    </ol>

    <div className="mx-auto mt-16 max-w-4xl text-center">
      <p className="mb-4 text-sm font-medium text-content-secondary">Works with</p>
      <ul className="flex flex-wrap justify-center gap-2">
        {FORMATS.map((format) => (
          <li key={format} className="rounded-full border border-edge bg-surface-card/60 px-3.5 py-1.5 text-sm text-content-secondary">
            {format}
          </li>
        ))}
      </ul>
    </div>
  </section>
);

const PRIVACY_POINTS = [
  { icon: Cpu, title: 'Processed in your browser', body: 'Parsing runs in a background worker inside this tab. There is no server.' },
  { icon: EyeOff, title: 'No accounts, no tracking', body: 'No sign-up, no analytics and nothing saved. Close the tab and it is gone.' },
  { icon: ShieldCheck, title: 'Locked down by design', body: 'The published app’s security policy blocks network requests entirely.' },
];

export const Privacy = () => (
  <section id="privacy" className="scroll-mt-8 px-5 py-16 sm:py-20">
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-edge bg-surface-card px-6 py-14 sm:px-12 sm:py-16">
      <div
        aria-hidden="true"
        className="aurora-orb absolute -right-32 -top-32 h-96 w-96"
        style={{ background: 'radial-gradient(closest-side, rgb(16 185 129 / var(--orb-alpha)), transparent)' }}
      />
      <div
        aria-hidden="true"
        className="aurora-orb absolute -bottom-40 -left-24 h-96 w-96"
        style={{ background: 'radial-gradient(closest-side, rgb(59 130 246 / var(--orb-alpha)), transparent)' }}
      />

      <div className="relative grid gap-12 lg:grid-cols-5 lg:items-center">
        <div className="lg:col-span-2">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            Privacy first
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-content-primary">
            Your chats never leave your device.
          </h2>
          <p className="mt-4 text-lg text-content-muted">
            Conversations are some of the most personal data you have. This analyzer was built so
            it never needs to see them.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-1">
          {PRIVACY_POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-content-primary">{title}</h3>
                <p className="mt-1 text-content-muted leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export const FinalCta = ({ onBrowse, isWorking }) => (
  <section className="px-5 pb-20 pt-8 sm:pb-24">
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-content-primary">
        See the story in your{' '}
        <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 dark:from-blue-400 dark:via-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
          conversations
        </span>
      </h2>
      <p className="mt-4 text-lg text-content-muted">Takes seconds. Nothing is uploaded.</p>
      <button type="button" onClick={onBrowse} disabled={isWorking} className="btn-primary mt-8 text-base">
        {isWorking ? 'Analyzing…' : 'Analyze a chat'}
        {!isWorking && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  </section>
);

FinalCta.propTypes = {
  onBrowse: PropTypes.func.isRequired,
  isWorking: PropTypes.bool.isRequired,
};
