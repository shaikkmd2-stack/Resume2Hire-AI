import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  color?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  className = '',
  color = '#4f46e5', // Primary container indigo
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eaedff"
          strokeWidth={strokeWidth}
        />
        {/* Active Value Progress Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-on-surface font-bold leading-none tracking-tight" style={{ fontSize: `${size * 0.28}px` }}>
          {score}
          <span className="text-xs font-normal text-on-surface-variant">%</span>
        </span>
        {label && (
          <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-outline mt-0.5">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-on-surface-variant">{sublabel}</span>
        )}
      </div>
    </div>
  );
};
