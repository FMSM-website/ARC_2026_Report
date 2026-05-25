import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const AlgerianLogo: React.FC<LogoProps> = ({ className = '', size = 70 }) => {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg/1280px-%D8%B4%D8%B9%D8%A7%D8%B1_%D9%88%D8%B2%D8%A7%D8%B1%D8%A9_%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%8A%D8%A9_%D8%A7%D9%84%D8%AC%D8%B2%D8%A7%D8%A6%D8%B1.svg.png"
        alt="وزارة المالية الجزائرية"
        width={size}
        height={size}
        className={`${className} object-contain transition-all duration-300`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Precise helper paths for curving the text around the seal */}
        <path id="text-path-top" d="M 39,37 A 26,26 0 0,1 101,37" fill="none" />
        <path id="text-path-bottom" d="M 101,37 A 26,26 0 0,1 39,37" fill="none" />
      </defs>

      {/* ------------------------------------------------------------- */}
      {/* TOP PART: OFFICIAL SEAL                                        */}
      {/* ------------------------------------------------------------- */}
      <g id="official-seal">
        {/* Outer Circle Ring */}
        <circle cx="70" cy="37" r="32" stroke="#116A71" strokeWidth="2.0" />
        <circle cx="70" cy="37" r="28" stroke="#116A71" strokeWidth="0.6" strokeDasharray="2 1.5" />

        {/* Circular Outer Ring Text "الجمهورية الجزائرية الديمقراطية الشعبية" */}
        <text font-family="'Amiri', 'Cairo', 'Noto Naskh Arabic', serif" font-size="4.5" fill="#116A71" font-weight="bold">
          <textPath href="#text-path-top" startOffset="50%" textAnchor="middle">
            الجمهورية الجزائرية
          </textPath>
        </text>
        <text font-family="'Amiri', 'Cairo', 'Noto Naskh Arabic', serif" font-size="4" fill="#116A71" font-weight="bold">
          <textPath href="#text-path-bottom" startOffset="50%" textAnchor="middle">
            الديمقراطية الشعبية
          </textPath>
        </text>

        {/* Inner Circle Content: Sun, Hand, Branches and Crescent/Star */}
        <circle cx="70" cy="37" r="22" fill="#F8FAFC" stroke="#116A71" strokeWidth="0.8" />
        
        {/* Rising Sun Rays in Center */}
        <g id="sun" transform="translate(70, 31)">
          <path d="M -6,0 L 6,0 C 6,-6 -6,-6 -6,0 Z" fill="#116A71" opacity="0.25" />
          <line x1="0" y1="-2" x2="0" y2="-9" stroke="#116A71" strokeWidth="0.8" />
          <line x1="-4" y1="-1" x2="-8" y2="-5" stroke="#116A71" strokeWidth="0.6" />
          <line x1="4" y1="-1" x2="8" y2="-5" stroke="#116A71" strokeWidth="0.6" />
          <line x1="-6" y1="0" x2="-9" y2="-2" stroke="#116A71" strokeWidth="0.6" />
          <line x1="6" y1="0" x2="9" y2="-2" stroke="#116A71" strokeWidth="0.6" />
        </g>

        {/* Minimalist Mountains / Buildings inside seal */}
        <path d="M 54,34 C 58,30 62,35 66,32 C 70,29 74,33 78,31 L 86,34" stroke="#116A71" strokeWidth="0.6" fill="none" />

        {/* Detailed Hand in Center */}
        <path d="M 67,42 L 73,42 L 71,46 L 69,46 Z" fill="#116A71" stroke="#116A71" strokeWidth="0.4" />

        {/* Traditional Laurel Olive/Oak Leaves flanking the sides */}
        <path d="M 51,38 Q 50,28 56,25" stroke="#116A71" strokeWidth="0.6" fill="none" opacity="0.8" />
        <path d="M 89,38 Q 90,28 84,25" stroke="#116A71" strokeWidth="0.6" fill="none" opacity="0.8" />

        {/* Algerian Flag Crescent & Star at the bottom */}
        <path
          d="M 70,55 C 75.5,55 80,51 80,45.5 C 80,41.2 76.8,37.5 72.3,36.5 C 75.2,37.8 77.1,41 77.1,44.5 C 77.1,49.5 73,53 68.5,53 C 66.2,53 64,52 62.6,50.4 C 63.8,53.2 66.7,55 70,55 Z"
          fill="#D21034"
        />
        <polygon points="71.5,39.5 73,42 76,42 73.5,43.5 74.5,46.5 71.5,44.8 68.5,46.5 69.5,43.5 67,42 70,42" fill="#D21034" />
      </g>

      {/* ------------------------------------------------------------- */}
      {/* MIDDLE PART: MINISTRY OF FINANCE BRAND TYPOGRAPHY             */}
      {/* ------------------------------------------------------------- */}
      <text
        x="70"
        y="86"
        font-family="'Amiri', 'Cairo', 'Noto Naskh Arabic', serif"
        font-size="16"
        font-weight="900"
        fill="#116A71"
        text-anchor="middle"
        className="select-none"
      >
        وزارة الماليَّة
      </text>

      {/* Underline Sub-separator to separate Arabic and English cleanly */}
      <line x1="18" y1="94" x2="122" y2="94" stroke="#116A71" strokeWidth="0.8" opacity="0.35" />

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM PART: ENGLISH "MINISTRY OF FINANCE"                     */}
      {/* ------------------------------------------------------------- */}
      <text
        x="70"
        y="105"
        font-family="'Inter', 'Space Grotesk', 'Segoe UI', sans-serif"
        font-size="6.8"
        font-weight="700"
        fill="#116A71"
        letter-spacing="0.8"
        text-anchor="middle"
        className="select-none"
        opacity="0.95"
      >
        MINISTRY OF FINANCE
      </text>
    </svg>
  );
};

export default AlgerianLogo;
