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

  const foreground = inverted ? '#ffffff' : '#005b45';

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ width: width || dimensions.width, height: height || dimensions.height }}
      aria-label="Terramora logo"
      role="img"
    >
      <span
        className={`${dimensions.text} font-bold tracking-[-0.055em] leading-none`}
        style={{ color: foreground }}
      >
        Terramora
      </span>
    </div>
  );
};

export const TerramoraLogo = TerravaLogo;
