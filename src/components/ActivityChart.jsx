import PropTypes from 'prop-types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatHour } from '../utils/format';

// Hoisted so recharts' prop comparison isn't defeated by a fresh object
// literal on every render.
const GRID = { strokeDasharray: '3 3', stroke: 'currentColor', opacity: 0.12 };
const AXIS = { stroke: 'currentColor', tick: { fontSize: 12, fill: 'currentColor' } };
const TOOLTIP_STYLE = {
  backgroundColor: 'rgb(var(--surface-card))',
  border: '1px solid rgb(var(--edge))',
  borderRadius: '8px',
  color: 'rgb(var(--content-primary))',
};

const ChartPanel = ({ dot, title, summary, children }) => (
  <div className="glass-card p-6 text-content-muted">
    <h3 className="text-xl font-semibold mb-4 text-content-primary flex items-center">
      <span className={`w-2 h-2 ${dot} rounded-full mr-3`} aria-hidden="true" />
      {title}
    </h3>
    <div role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

ChartPanel.propTypes = {
  dot: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
};

const ActivityChart = ({ analytics }) => {
  const hourlyData = analytics.activityByHour.map((count, hour) => ({
    hour: `${String(hour).padStart(2, '0')}:00`,
    messages: count,
  }));

  const weeklyData = analytics.activityByDay.map((d) => ({ ...d, short: d.day.slice(0, 3) }));

  const busiestDay = weeklyData.reduce((a, b) => (b.messages > a.messages ? b : a), weeklyData[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartPanel
        dot="bg-purple-500"
        title="Activity by Hour"
        summary={`Messages by hour of day. Busiest hour is ${formatHour(analytics.mostActiveHour)}.`}
      >
        <LineChart data={hourlyData}>
          <defs>
            <linearGradient id="hourGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="hour" interval={3} {...AXIS} />
          <YAxis allowDecimals={false} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'currentColor', opacity: 0.2 }} />
          <Line
            type="monotone"
            dataKey="messages"
            stroke="url(#hourGradient)"
            strokeWidth={3}
            dot={{ fill: '#EC4899', r: 3 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartPanel>

      <ChartPanel
        dot="bg-pink-500"
        title="Activity by Day"
        summary={`Messages by day of week. Busiest day is ${busiestDay?.day ?? 'unknown'}.`}
      >
        <BarChart data={weeklyData}>
          <defs>
            <linearGradient id="dayGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          {/* Abbreviated so seven labels fit a single-column mobile chart
              without rotating them into each other. */}
          <XAxis dataKey="short" {...AXIS} />
          <YAxis allowDecimals={false} {...AXIS} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: 'currentColor', opacity: 0.08 }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.day ?? ''}
          />
          <Bar dataKey="messages" fill="url(#dayGradient)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartPanel>
    </div>
  );
};

ActivityChart.propTypes = {
  analytics: PropTypes.shape({
    activityByHour: PropTypes.arrayOf(PropTypes.number).isRequired,
    activityByDay: PropTypes.arrayOf(
      PropTypes.shape({
        day: PropTypes.string.isRequired,
        messages: PropTypes.number.isRequired,
      })
    ).isRequired,
    mostActiveHour: PropTypes.number,
  }).isRequired,
};

export default ActivityChart;
