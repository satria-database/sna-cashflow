import React from 'react';

interface TerravaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showTagline?: boolean;
  inverted?: boolean;
  width?: number | string;
  height?: number | string;
}

export const TerravaLogo: React.FC<TerravaLogoProps> = ({
  className = '',
  size = 'md',
  inverted = false,
  width,
  height,
}) => {
  // Dimension presets
  const dimensions = {
    xs: { width: 110, height: 22, text: 'text-[9px]' },
    sm: { width: 140, height: 28, text: 'text-[10px]' },
    md: { width: 190, height: 38, text: 'text-xs' },
    lg: { width: 240, height: 48, text: 'text-sm' },
    xl: { width: 300, height: 60, text: 'text-base' },
    custom: { width: width || 190, height: height || 38, text: 'text-xs' },
  }[size];

  // Inverted = true for dark sidebar / dark surfaces (#FFFFFF or #F8FAFC for primary letters)
  // Inverted = false for light background (#022731 or #072635)
  const primaryLetterColor = inverted ? '#FFFFFF' : '#012834';

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <svg
        viewBox="0 0 680 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: width || dimensions.width,
          height: height || dimensions.height,
          maxWidth: '100%',
        }}
        className="overflow-visible"
        aria-label="Terrava Logo"
      >
        <defs>
          <linearGradient id="terravaTealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5A3" />
            <stop offset="60%" stopColor="#00BFA5" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {inverted && (
            <filter id="emeraldGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00E5A3" floodOpacity="0.4" />
            </filter>
          )}
        </defs>

        {/* ============================================================ */}
        {/* LETTER 1: T (Primary Color) */}
        {/* ============================================================ */}
        <g fill={primaryLetterColor}>
          {/* Top horizontal crossbar */}
          <rect x="20" y="26" width="76" height="18" rx="1.5" />
          {/* Vertical stem */}
          <rect x="49" y="26" width="18" height="78" rx="1.5" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 2: E (Primary Color) */}
        {/* ============================================================ */}
        <g fill={primaryLetterColor}>
          {/* Vertical stem */}
          <rect x="114" y="26" width="18" height="78" rx="1.5" />
          {/* Top arm */}
          <rect x="114" y="26" width="68" height="18" rx="1.5" />
          {/* Middle arm (slightly inset for optical balance) */}
          <rect x="114" y="56" width="58" height="18" rx="1.5" />
          {/* Bottom arm */}
          <rect x="114" y="86" width="68" height="18" rx="1.5" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 3: R (First R - Primary Color) */}
        {/* ============================================================ */}
        <g fill={primaryLetterColor}>
          {/* Vertical stem */}
          <rect x="200" y="26" width="18" height="78" rx="1.5" />
          {/* Curved top bowl */}
          <path
            d="M200 26 H248 C266 26 276 35 276 50 C276 65 266 74 248 74 H200 V26 Z M218 44 V56 H245 C251 56 256 53 256 50 C256 47 251 44 245 44 H218 Z"
            fillRule="evenodd"
          />
          {/* Diagonal leg */}
          <polygon points="234,68 276,104 252,104 216,70" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 4: R (Second R - Primary Color) */}
        {/* ============================================================ */}
        <g fill={primaryLetterColor}>
          {/* Vertical stem */}
          <rect x="294" y="26" width="18" height="78" rx="1.5" />
          {/* Curved top bowl */}
          <path
            d="M294 26 H342 C360 26 370 35 370 50 C370 65 360 74 342 74 H294 V26 Z M312 44 V56 H339 C345 56 350 53 350 50 C350 47 345 44 339 44 H312 Z"
            fillRule="evenodd"
          />
          {/* Diagonal leg */}
          <polygon points="328,68 370,104 346,104 310,70" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 5: A (First A - Inverted Chevron '∧' in Primary Color) */}
        {/* ============================================================ */}
        <g fill={primaryLetterColor}>
          <polygon points="426,26 445,26 478,104 458,104 435.5,50 413,104 393,104" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 6: V (Chevron 'V' in Vibrant Emerald Teal) */}
        {/* ============================================================ */}
        <g fill="url(#terravaTealGradient)" filter={inverted ? 'url(#emeraldGlow)' : undefined}>
          <polygon points="488,26 508,26 531.5,80 555,26 575,26 541,104 522,104" />
        </g>

        {/* ============================================================ */}
        {/* LETTER 7: A (Second A - Inverted Chevron '∧' in Emerald Teal) */}
        {/* ============================================================ */}
        <g fill="url(#terravaTealGradient)" filter={inverted ? 'url(#emeraldGlow)' : undefined}>
          <polygon points="616,26 635,26 668,104 648,104 625.5,50 603,104 583,104" />
        </g>
      </svg>
    </div>
  );
};
