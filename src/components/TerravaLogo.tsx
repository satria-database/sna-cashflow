import React from 'react';

interface TerramoraLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showTagline?: boolean;
  inverted?: boolean;
  width?: number | string;
  height?: number | string;
}

export const TerravaLogo: React.FC<TerramoraLogoProps> = ({
  className = '',
  size = 'md',
  inverted = false,
  width,
  height,
}) => {
  const dimensions = {
    xs: { width: 110, height: 24, text: 'text-base' },
    sm: { width: 140, height: 30, text: 'text-lg' },
    md: { width: 190, height: 40, text: 'text-2xl' },
    lg: { width: 240, height: 50, text: 'text-3xl' },
    xl: { width: 300, height: 62, text: 'text-4xl' },
    custom: { width: width || 190, height: height || 40, text: 'text-2xl' },
  }[size];

  const foreground = inverted ? '#ffffff' : '#0f172a';
  const mark = inverted ? '#34d399' : '#007a52';

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      style={{ width: width || dimensions.width, height: height || dimensions.height }}
      aria-label="Terramora logo"
      role="img"
    >
      <svg viewBox="0 0 40 40" aria-hidden="true" className="size-[1.35em] shrink-0">
        <path d="M20 3 34 10v10c0 8.5-5.7 14.1-14 17C11.7 34.1 6 28.5 6 20V10L20 3Z" fill={mark} />
        <path d="m13 20 4.5 4.5L27 15" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`${dimensions.text} font-black tracking-[-0.045em]`} style={{ color: foreground }}>
        Terramora
      </span>
    </div>
  );
};

export const TerramoraLogo = TerravaLogo;
