const orb = (rgb) => ({
  background: `radial-gradient(closest-side, rgb(${rgb} / var(--orb-alpha)), transparent)`,
});

// Curves read as conversation threads crossing the page. Each is drawn twice:
// a faint static line, and a short dash that travels along it like a message.
const FLOWS = [
  { d: 'M-80 430 C 260 300, 520 540, 820 390 S 1260 230, 1520 330', stroke: 'url(#flow-violet)', delay: '0s', duration: '9s' },
  { d: 'M-80 520 C 300 460, 560 360, 860 470 S 1240 600, 1520 470', stroke: 'url(#flow-cyan)', delay: '-3s', duration: '11s' },
  { d: 'M-80 300 C 340 380, 600 180, 900 260 S 1300 420, 1520 220', stroke: 'url(#flow-magenta)', delay: '-6s', duration: '13s' },
];

const PARTICLES = [
  { left: '8%', top: '30%', size: 6, color: 'bg-cyan-400', delay: '0s' },
  { left: '18%', top: '72%', size: 4, color: 'bg-violet-400', delay: '-2s' },
  { left: '34%', top: '14%', size: 5, color: 'bg-blue-400', delay: '-4s' },
  { left: '52%', top: '84%', size: 4, color: 'bg-fuchsia-400', delay: '-1s' },
  { left: '66%', top: '10%', size: 6, color: 'bg-teal-400', delay: '-5s' },
  { left: '82%', top: '62%', size: 5, color: 'bg-violet-400', delay: '-3s' },
  { left: '92%', top: '24%', size: 4, color: 'bg-cyan-400', delay: '-6s' },
];

const HeroBackground = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="home-grid absolute inset-0" />

    <div className="aurora-orb absolute -top-48 -left-40 h-[34rem] w-[34rem] sm:h-[44rem] sm:w-[44rem] animate-aurora-a" style={orb('59 130 246')} />
    <div className="aurora-orb absolute -top-24 right-[-12rem] h-[30rem] w-[30rem] sm:h-[40rem] sm:w-[40rem] animate-aurora-b" style={orb('139 92 246')} />
    <div className="aurora-orb absolute top-[40%] left-[20%] h-[26rem] w-[26rem] sm:h-[34rem] sm:w-[34rem] animate-aurora-b" style={{ ...orb('6 182 212'), animationDelay: '-8s' }} />
    <div className="aurora-orb absolute top-[55%] right-[5%] h-[22rem] w-[22rem] sm:h-[30rem] sm:w-[30rem] animate-aurora-a" style={{ ...orb('217 70 239'), animationDelay: '-12s' }} />

    <svg
      className="absolute inset-x-0 top-[8%] h-[85%] w-full opacity-60 dark:opacity-80 [mask-image:linear-gradient(to_bottom,transparent_40%,#000_70%)] lg:[mask-image:linear-gradient(to_right,transparent_42%,#000_72%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_40%,#000_70%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_42%,#000_72%)]"
      viewBox="0 0 1440 700"
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="flow-violet" x1="0" x2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flow-cyan" x1="0" x2="1">
          <stop offset="0" stopColor="#14b8a6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="flow-magenta" x1="0" x2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {FLOWS.map((flow) => (
        <g key={flow.d}>
          <path d={flow.d} stroke={flow.stroke} strokeWidth="1" opacity="0.45" vectorEffect="non-scaling-stroke" />
          <path
            d={flow.d}
            stroke={flow.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="10 216"
            vectorEffect="non-scaling-stroke"
            className="animate-flow"
            style={{ animationDelay: flow.delay, animationDuration: flow.duration }}
          />
        </g>
      ))}
    </svg>

    {PARTICLES.map((p) => (
      <span
        key={`${p.left}-${p.top}`}
        className={`absolute rounded-full ${p.color} opacity-60 animate-float hidden sm:block`}
        style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }}
      />
    ))}

    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface-base" />
  </div>
);

export default HeroBackground;
