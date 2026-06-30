import React from "react";

// ── BookingGraph (SVG Area / Line Chart) ──
interface BookingGraphPoint {
  month: string;
  Bookings: number;
  Revenue: number;
}
interface BookingGraphProps {
  data: BookingGraphPoint[];
}

export const BookingGraph: React.FC<BookingGraphProps> = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-center text-slate-400 py-10">No chart data available</div>;

  const width = 500;
  const height = 200;
  const padding = 35;

  const maxVal = Math.max(...data.map((d) => d.Bookings), 5); // default min max of 5
  
  // Calculate SVG points
  const points = data.map((d, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.Bookings * (height - padding * 2)) / maxVal;
    return { x, y, label: d.month, val: d.Bookings };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8B5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#14B8B5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#14B8B5" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>

        {/* Horizontal Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          const gridVal = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4,4"
                className="dark:stroke-slate-800"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] font-semibold fill-slate-400 dark:fill-slate-500"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaPath} fill="url(#chartGradient)" />

        {/* Smooth Line Path */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Circles & Labels */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="#14B8B5"
              strokeWidth="2.5"
              className="hover:r-6 hover:stroke-primary-dark transition-all"
            />
            {/* Value tooltip on hover */}
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="text-[10px] font-bold fill-primary hidden group-hover:block"
            >
              {p.val}
            </text>
            {/* X-axis Label */}
            <text
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── GenderDistributionChart (SVG Donut Chart) ──
interface GenderProps {
  male: number;
  female: number;
  other: number;
}

export const GenderDistributionChart: React.FC<GenderProps> = ({ male, female, other }) => {
  const total = male + female + other;
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <span className="text-[10px] text-slate-400">Empty</span>
        </div>
        <span className="text-xs text-slate-400 mt-2 font-medium">No demographics recorded</span>
      </div>
    );
  }

  // Percentages
  const malePct = Math.round((male / total) * 100);
  const femalePct = Math.round((female / total) * 100);
  const otherPct = 100 - malePct - femalePct;

  // Donut parameters
  const radius = 35;
  const strokeWidth = 10;
  const circ = 2 * Math.PI * radius;

  // Stroke offsets
  const maleOffset = circ;
  const femaleOffset = circ - (circ * malePct) / 100;
  const otherOffset = circ - (circ * (malePct + femalePct)) / 100;

  return (
    <div className="flex items-center gap-6 justify-center">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            className="dark:stroke-slate-800"
          />
          {/* Male Arc */}
          {malePct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#14B8B5"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * malePct) / 100}
              strokeLinecap="round"
            />
          )}
          {/* Female Arc */}
          {femalePct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * femalePct) / 100}
              transform={`rotate(${(malePct / 100) * 360} 50 50)`}
              strokeLinecap="round"
            />
          )}
          {/* Other Arc */}
          {otherPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#6366F1"
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * otherPct) / 100}
              transform={`rotate(${((malePct + femalePct) / 100) * 360} 50 50)`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{total}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Travelers</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
            Male: {male} ({malePct}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
            Female: {female} ({femalePct}%)
          </span>
        </div>
        {otherPct > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
              Other: {other} ({otherPct}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
