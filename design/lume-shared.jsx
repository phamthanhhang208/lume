// lume-shared.jsx — Design tokens + decorative primitives for Lume

const LUME = {
  // surface — white paper (coquette/girlie reference set)
  cream: '#FFFFFF',       // page bg — pure paper white
  creamDeep: '#FBF6F4',   // alt warm cream
  paper: '#FFFFFF',       // card surface
  ink: '#1A1A1A',         // primary text
  inkSoft: '#6B6B70',     // secondary text
  inkFaint: '#B0B0B5',    // tertiary text

  // Coquette pink + coordinating pastel folders
  terracotta: '#FBC9A5',  // peach
  terracottaDeep: '#E37B8C',  // KEY TINT — dusty rose (interactive)
  sage: '#C5DDC9',        // mint
  sageDeep: '#7CB89C',
  rose: '#F8D5DC',        // soft baby pink (speech bubbles, accents)
  roseDeep: '#E37B8C',
  rosePale: '#FCE4E8',    // palest blush (chat bg, big surfaces)
  ochre: '#FCE3A4',       // butter
  ochreDeep: '#E5C56A',
  inkBlue: '#7AA8C8',

  lilac: '#D6BCE7',
  lilacDeep: '#9C72B5',
  sky: '#BFDAEF',
  skyDeep: '#7AA8C8',
  yellow: '#FFEC4D',
  yellowDeep: '#E5C800',

  // iMessage-native
  imSent: '#E37B8C',      // sent bubble (was iOS blue; use the brand pink)
  imReceived: '#E5E5EA',  // received bubble (iOS gray)
};

const PAPER_BG = {
  cream: LUME.cream,      // default — bright paper white
  kraft: '#E8D9BE',
  dotgrid: LUME.cream,
  notebook: '#FFFFFF',
  grid: '#FAFAF6',
};

// Paper texture: clean white-ish base with optional grid/lines.
function PaperBg({ variant = 'cream', grid = true, children, style = {} }) {
  const base = PAPER_BG[variant] || LUME.cream;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: base,
      ...style,
    }}>
      {/* subtle paper grain */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 25% 30%, rgba(80,70,55,.025) 0, transparent 1px),
                          radial-gradient(circle at 75% 65%, rgba(80,70,55,.03) 0, transparent 1.5px)`,
        backgroundSize: '23px 23px, 31px 31px',
        opacity: .8,
        pointerEvents: 'none',
      }} />
      {/* default grid */}
      {grid && variant !== 'notebook' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(60,55,45,.045) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(60,55,45,.045) 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
        }} />
      )}
      {/* notebook ruled lines */}
      {variant === 'notebook' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(122,159,182,.22) 1px, transparent 1px)`,
          backgroundSize: '100% 28px',
          backgroundPosition: '0 56px',
          pointerEvents: 'none',
        }} />
      )}
      {variant === 'dotgrid' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(60,55,45,.16) 1px, transparent 1.5px)`,
          backgroundSize: '14px 14px',
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </div>
  );
}

// Washi tape — pastel-folder palette
function WashiTape({ color = 'sage', width = 90, rotate = -8, top, left, right, bottom, pattern = 'stripe', style = {} }) {
  const colors = {
    sage: ['#C0D2B8', '#9CB392'],
    rose: ['#F1C8CC', '#D89BA1'],
    terracotta: ['#F0BE8F', '#D89C68'],
    ochre: ['#F3D87E', '#D9B848'],
    cream: ['#F1EFE9', '#D9D6CD'],
    lilac: ['#E8C8DD', '#C397B5'],
    sky: ['#CADCE7', '#90B5C8'],
    yellow: ['#FFF06A', '#E5D03A'],
  }[color] || ['#C0D2B8', '#9CB392'];
  const patterns = {
    stripe: `repeating-linear-gradient(45deg, ${colors[0]} 0, ${colors[0]} 6px, ${colors[1]} 6px, ${colors[1]} 12px)`,
    dots: `radial-gradient(circle, ${colors[1]} 1.4px, ${colors[0]} 2px)`,
    solid: colors[0],
    grid: `linear-gradient(${colors[1]} 1px, transparent 1px),
           linear-gradient(90deg, ${colors[1]} 1px, transparent 1px),
           ${colors[0]}`,
  };
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom,
      width, height: 20,
      background: patterns[pattern] || patterns.stripe,
      backgroundSize: pattern === 'dots' ? '7px 7px' : pattern === 'grid' ? '8px 8px,8px 8px,100% 100%' : 'auto',
      transform: `rotate(${rotate}deg)`,
      opacity: .92,
      // Torn-ish edges via clip-path
      clipPath: 'polygon(2% 14%, 8% 6%, 16% 12%, 24% 4%, 33% 10%, 42% 4%, 51% 12%, 60% 4%, 69% 10%, 77% 4%, 86% 12%, 94% 6%, 99% 14%, 99% 86%, 92% 94%, 84% 88%, 76% 96%, 66% 90%, 56% 96%, 47% 90%, 38% 96%, 29% 90%, 20% 96%, 11% 88%, 4% 94%, 1% 86%)',
      boxShadow: '0 2px 4px rgba(40,35,28,.10)',
      pointerEvents: 'none',
      ...style,
    }} />
  );
}

// Sparkle / 4-point star — pink by default for coquette mood
function Sparkle({ size = 14, color = LUME.roseDeep, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', ...style }}>
      <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill={color} />
    </svg>
  );
}

// 5-point hand-drawn star
function Star({ size = 16, color = LUME.ochre, filled = true, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', ...style }}>
      <path d="M12 2.5 L14.6 9 L21.5 9.5 L16.3 14 L18 21 L12 17.2 L6 21 L7.7 14 L2.5 9.5 L9.4 9 Z"
        fill={filled ? color : 'none'} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// Hand-drawn underline — wavy, slight ink variation
function Underline({ width = 100, color = LUME.terracotta, strokeWidth = 2.5, style = {} }) {
  return (
    <svg width={width} height="8" viewBox={`0 0 ${width} 8`} style={{ display: 'block', ...style }}>
      <path
        d={`M2,5 Q${width*0.2},2 ${width*0.4},4.5 T${width*0.7},4 T${width-2},5`}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

// Doodle heart
function Heart({ size = 16, color = LUME.rose, filled = true, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 22" style={{ display: 'inline-block', ...style }}>
      <path d="M12 20 C12 20 2 13 2 7.5 C2 4.5 4.5 2 7.5 2 C9.5 2 11 3 12 4.5 C13 3 14.5 2 16.5 2 C19.5 2 22 4.5 22 7.5 C22 13 12 20 12 20 Z"
        fill={filled ? color : 'none'} stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

// Scribbled arrow — hand-drawn
function Arrow({ length = 60, angle = 0, color = LUME.ink, style = {} }) {
  return (
    <svg width={length} height="30" viewBox={`0 0 ${length} 30`}
      style={{ display: 'block', transform: `rotate(${angle}deg)`, ...style }}>
      <path d={`M3,15 Q${length*0.3},8 ${length*0.55},16 T${length-8},14`}
        fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d={`M${length-12},9 L${length-4},14 L${length-12},19`}
        fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Decorative circle squiggle (a flower-y scribble)
function Squiggle({ size = 30, color = LUME.sage, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'inline-block', ...style }}>
      <path d="M20 4 C24 4 28 8 28 12 C32 12 36 16 36 20 C36 24 32 28 28 28 C28 32 24 36 20 36 C16 36 12 32 12 28 C8 28 4 24 4 20 C4 16 8 12 12 12 C12 8 16 4 20 4 Z"
        fill={color} opacity=".85"/>
    </svg>
  );
}

// Polaroid / sticker frame — rounded square with shadow + tilt
function StickerCard({ rotate = -1.5, children, width, height, color = '#fff', shadow = true, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      width, height,
      background: color,
      borderRadius: 10,
      padding: 6,
      transform: `rotate(${rotate}deg)`,
      boxShadow: shadow ? '0 1px 2px rgba(60,40,20,.12), 0 4px 16px rgba(60,40,20,.10)' : 'none',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform .2s ease',
      ...style,
    }}>{children}</div>
  );
}

// ─────────── Product placeholder cutouts (SVG, characterful, not slop) ───────────
// Each is a roughly-extracted product silhouette with simple shading. They
// read as "real product photo cutouts" without committing to a brand.

function ProductBottleA({ size = 70, hue = '#E8DFC8', accent = '#8B7355' }) {
  // dropper serum bottle, dark
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84">
      <defs>
        <linearGradient id="pbA" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#A89A75"/>
          <stop offset=".4" stopColor="#C8BB95"/>
          <stop offset="1" stopColor="#7E714D"/>
        </linearGradient>
      </defs>
      <rect x="22" y="4" width="16" height="10" rx="2" fill={accent}/>
      <rect x="20" y="14" width="20" height="4" rx="1" fill="#5C4B36"/>
      <rect x="12" y="18" width="36" height="62" rx="6" fill="url(#pbA)"/>
      <rect x="18" y="38" width="24" height="22" fill="#fff" opacity=".7"/>
      <text x="30" y="50" fontSize="6" fontFamily="serif" fontWeight="700" fill="#3D2F26" textAnchor="middle">SERUM</text>
      <text x="30" y="56" fontSize="3.5" fontFamily="monospace" fill="#3D2F26" textAnchor="middle">30ml</text>
    </svg>
  );
}

function ProductTube({ size = 70, hue = '#E5C9BD' }) {
  // squeeze tube
  return (
    <svg width={size} height={size * 1.45} viewBox="0 0 60 86">
      <defs>
        <linearGradient id="ptT" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#C5A398"/>
          <stop offset=".4" stopColor={hue}/>
          <stop offset="1" stopColor="#A6877B"/>
        </linearGradient>
      </defs>
      <path d="M12 12 L48 12 L52 24 L52 76 Q52 82 46 82 L14 82 Q8 82 8 76 L8 24 Z" fill="url(#ptT)"/>
      <rect x="14" y="4" width="32" height="10" rx="3" fill="#9F7E72"/>
      <ellipse cx="30" cy="4" rx="16" ry="2.5" fill="#7A5D54"/>
      <rect x="16" y="32" width="28" height="36" rx="2" fill="#fff" opacity=".55"/>
      <text x="30" y="46" fontSize="4.5" fontFamily="serif" fontWeight="700" fill="#3D2F26" textAnchor="middle">CLEANSER</text>
      <text x="30" y="54" fontSize="3" fontFamily="monospace" fill="#6B5A4D" textAnchor="middle">gentle · daily</text>
      <line x1="20" y1="66" x2="40" y2="66" stroke="#3D2F26" strokeWidth=".4"/>
    </svg>
  );
}

function ProductCompact({ size = 70, hue = '#E0B49E' }) {
  // round compact (blush)
  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 80 68">
      <defs>
        <radialGradient id="pcC" cx=".4" cy=".35">
          <stop offset="0" stopColor="#fff" stopOpacity=".5"/>
          <stop offset="1" stopColor={hue} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="34" rx="36" ry="30" fill="#B47F73"/>
      <ellipse cx="40" cy="34" rx="32" ry="26" fill={hue}/>
      <ellipse cx="40" cy="34" rx="24" ry="19" fill="#C99080"/>
      <ellipse cx="40" cy="34" rx="24" ry="19" fill="url(#pcC)"/>
      <ellipse cx="32" cy="28" rx="6" ry="3" fill="#fff" opacity=".25"/>
    </svg>
  );
}

function ProductLipstick({ size = 70, hue = '#B33A3F' }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64">
      <path d="M14 4 L26 4 L26 18 L14 18 Z" fill={hue}/>
      <path d="M14 4 L26 4 L22 0 Z" fill="#7A2528"/>
      <rect x="10" y="18" width="20" height="6" rx="1" fill="#D4AF7A"/>
      <rect x="8" y="24" width="24" height="38" rx="3" fill="#1E1812"/>
      <rect x="10" y="34" width="20" height="20" fill="#2E2620"/>
      <text x="20" y="46" fontSize="3.5" fontFamily="serif" fontStyle="italic" fill="#D4AF7A" textAnchor="middle">rouge</text>
      <text x="20" y="51" fontSize="2.6" fontFamily="monospace" fill="#A88A5E" textAnchor="middle">02 · brick</text>
    </svg>
  );
}

function ProductJar({ size = 70, hue = '#E8DDC0' }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 70 78">
      <ellipse cx="35" cy="12" rx="22" ry="6" fill="#8B7355"/>
      <rect x="13" y="10" width="44" height="14" fill="#A48B66"/>
      <ellipse cx="35" cy="24" rx="22" ry="5" fill="#8B7355"/>
      <rect x="11" y="24" width="48" height="44" fill={hue}/>
      <ellipse cx="35" cy="68" rx="24" ry="6" fill="#C8BB95"/>
      <rect x="17" y="34" width="36" height="22" fill="#fff" opacity=".7"/>
      <text x="35" y="46" fontSize="6.5" fontFamily="serif" fontWeight="700" fill="#3D2F26" textAnchor="middle">MOIST.</text>
      <text x="35" y="52" fontSize="3.5" fontFamily="monospace" fill="#6B5A4D" textAnchor="middle">retinol · pm</text>
    </svg>
  );
}

function ProductMascara({ size = 70 }) {
  return (
    <svg width={size} height={size * 1.7} viewBox="0 0 30 50">
      <rect x="10" y="2" width="10" height="14" rx="1" fill="#D4AF7A"/>
      <rect x="9" y="16" width="12" height="3" fill="#7A6248"/>
      <rect x="8" y="19" width="14" height="28" rx="2" fill="#1A1410"/>
      <rect x="10" y="26" width="10" height="14" fill="#2A211C"/>
      <text x="15" y="34" fontSize="3" fontFamily="serif" fontWeight="700" fill="#D4AF7A" textAnchor="middle">lash</text>
      <text x="15" y="38" fontSize="2.2" fontFamily="monospace" fill="#A88A5E" textAnchor="middle">vol.</text>
    </svg>
  );
}

function ProductSpray({ size = 70, hue = '#C8D4C0' }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 40 60">
      <rect x="16" y="2" width="8" height="6" fill="#7E714D"/>
      <rect x="13" y="8" width="14" height="5" rx="1" fill="#A89A75"/>
      <rect x="8" y="13" width="24" height="42" rx="3" fill={hue}/>
      <rect x="11" y="22" width="18" height="22" fill="#fff" opacity=".65"/>
      <text x="20" y="32" fontSize="4.5" fontFamily="serif" fontWeight="700" fill="#3D2F26" textAnchor="middle">MIST</text>
      <text x="20" y="38" fontSize="2.8" fontFamily="monospace" fill="#6B5A4D" textAnchor="middle">rose · 100ml</text>
    </svg>
  );
}

function ProductSheet({ size = 70 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 80 96">
      <rect x="6" y="6" width="68" height="84" rx="4" fill="#F4EEDC" stroke="#A89683" strokeWidth=".8"/>
      <rect x="6" y="6" width="68" height="20" fill="#A8B89C"/>
      <text x="40" y="20" fontSize="8" fontFamily="serif" fontWeight="700" fill="#fff" textAnchor="middle">HYDRA</text>
      <text x="40" y="44" fontSize="6" fontFamily="serif" fill="#3D2F26" textAnchor="middle">SHEET MASK</text>
      <line x1="14" y1="52" x2="66" y2="52" stroke="#A89683" strokeWidth=".5"/>
      <text x="40" y="64" fontSize="4" fontFamily="monospace" fill="#6B5A4D" textAnchor="middle">hyaluronic acid</text>
      <text x="40" y="72" fontSize="4" fontFamily="monospace" fill="#6B5A4D" textAnchor="middle">+ niacinamide</text>
      <text x="40" y="84" fontSize="3.5" fontFamily="monospace" fill="#A89683" textAnchor="middle">1 sheet · 25ml</text>
    </svg>
  );
}

const PRODUCT_SVGS = {
  bottle: ProductBottleA,
  tube: ProductTube,
  compact: ProductCompact,
  lipstick: ProductLipstick,
  jar: ProductJar,
  mascara: ProductMascara,
  spray: ProductSpray,
  sheet: ProductSheet,
};

// Striped SVG placeholder (for grid filler / image slots)
function StripedSlot({ width = 80, height = 80, label = 'product shot', rotate = 0, style = {} }) {
  return (
    <div style={{
      width, height,
      background: `repeating-linear-gradient(45deg, #EDE3D0 0, #EDE3D0 4px, #DFD2B8 4px, #DFD2B8 8px)`,
      border: '1px dashed #B59B7C',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#8B7355',
      fontFamily: 'Courier Prime, monospace',
      fontSize: 9, textAlign: 'center', lineHeight: 1.2,
      padding: 6,
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}>{label}</div>
  );
}

// Selfie placeholder — circle gradient with stylized face hint
function SelfiePlaceholder({ size = 120, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block', ...style }}>
      <defs>
        <radialGradient id="sfBg" cx=".5" cy=".4">
          <stop offset="0" stopColor="#F4DCC8"/>
          <stop offset="1" stopColor="#D4A89E"/>
        </radialGradient>
        <radialGradient id="sfHair" cx=".5" cy=".3">
          <stop offset="0" stopColor="#3D2618"/>
          <stop offset="1" stopColor="#1E120B"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#sfBg)"/>
      {/* hair */}
      <path d="M22 56 C22 30 38 16 60 16 C82 16 98 30 98 56 L98 50 Q98 42 92 38 Q88 30 78 28 Q60 22 42 28 Q32 30 28 38 Q22 42 22 50 Z" fill="url(#sfHair)"/>
      {/* face */}
      <ellipse cx="60" cy="68" rx="26" ry="32" fill="#E8C7B0"/>
      {/* cheek blush */}
      <ellipse cx="46" cy="75" rx="6" ry="4" fill="#D89589" opacity=".55"/>
      <ellipse cx="74" cy="75" rx="6" ry="4" fill="#D89589" opacity=".55"/>
      {/* eyes (closed in zen ^_^ style) */}
      <path d="M48 64 Q52 60 56 64" stroke="#3D2F26" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d="M64 64 Q68 60 72 64" stroke="#3D2F26" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      {/* lips */}
      <path d="M55 85 Q60 88 65 85" stroke="#B47269" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// Verdict tag chip — three styles
function VerdictTag({ verdict, style = 'chip', extraStyle = {} }) {
  const v = {
    works: { label: 'works ✓', bg: '#D6E4CC', fg: '#2F4823', border: '#7A9670' },
    neutral: { label: '? neutral', bg: '#FBE9B2', fg: '#7A5F1E', border: '#D9B848' },
    skip: { label: 'skip ✗', bg: '#F4C8B0', fg: '#7A381F', border: '#D89C68' },
  }[verdict] || { label: verdict, bg: '#EEE', fg: '#333', border: '#999' };

  if (style === 'stamp') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px 9px', minWidth: 64,
        border: `2px solid ${v.border}`, color: v.border,
        fontFamily: 'Courier Prime, monospace', fontWeight: 700,
        fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2,
        background: 'transparent',
        transform: 'rotate(-4deg)',
        opacity: .85,
        ...extraStyle,
      }}>{v.label}</div>
    );
  }
  if (style === 'sticky') {
    return (
      <div style={{
        display: 'inline-block', padding: '5px 9px 6px',
        background: v.bg, color: v.fg,
        fontFamily: 'Caveat, cursive', fontWeight: 600, fontSize: 16,
        boxShadow: '0 1px 3px rgba(40,35,28,.16)',
        transform: 'rotate(-2deg)',
        ...extraStyle,
      }}>{v.label}</div>
    );
  }
  // chip (default — clean pastel pill)
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px 4px',
      background: v.bg, color: v.fg,
      borderRadius: 999,
      border: `1px solid ${v.border}`,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 11.5,
      letterSpacing: 0.1, lineHeight: 1.2,
      ...extraStyle,
    }}>{v.label}</div>
  );
}

// Lume wordmark — editorial italic serif (scrapbook+Apple aesthetic)
function LumeMark({ size = 32, color = LUME.ink, style = {} }) {
  return (
    <div style={{
      fontFamily: 'Instrument Serif, serif', fontWeight: 400, fontStyle: 'italic',
      fontSize: size, color, letterSpacing: '-0.01em', lineHeight: 1,
      ...style,
    }}>Lume</div>
  );
}

// EditorialTitle — big serif headline with the option to italicize specific
// words. Pass children as JSX with `<i>` around emphasized words.
//   <EditorialTitle size={48}>The <i>Lume</i> prototype</EditorialTitle>
function EditorialTitle({ size = 36, children, color = LUME.ink, style = {} }) {
  return (
    <div style={{
      fontFamily: 'Instrument Serif, serif', fontWeight: 400,
      fontSize: size, color, lineHeight: 1.05, letterSpacing: '-0.01em',
      ...style,
    }}>{children}</div>
  );
}

// NumberTag — tiny corner badge "01", "02" (top-left of sticker cards)
function NumberTag({ n, color = LUME.ink, style = {} }) {
  return (
    <div style={{
      fontFamily: 'Courier Prime, monospace',
      fontSize: 10, fontWeight: 700, color, letterSpacing: 1.2,
      ...style,
    }}>{String(n).padStart(2, '0')}</div>
  );
}

// HighlighterMark — yellow marker swipe behind text
function HighlighterMark({ children, color = LUME.yellow, style = {} }) {
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      padding: '0 4px',
      backgroundImage: `linear-gradient(180deg, transparent 30%, ${color} 30%, ${color} 88%, transparent 88%)`,
      ...style,
    }}>{children}</span>
  );
}

// SpeechBubble — soft round pink annotation bubble (coquette reference)
// `tail` accepts 'tl' | 'tr' | 'bl' | 'br' (corner the tail sticks out of)
function SpeechBubble({ children, tone = 'rose', tail = 'bl', style = {} }) {
  const tones = {
    rose:    { bg: LUME.rose,      fg: '#5A2F35' },
    pink:    { bg: LUME.rosePale,  fg: '#7A3E48' },
    deep:    { bg: LUME.roseDeep,  fg: '#FFFFFF' },
    ink:     { bg: LUME.ink,       fg: '#FFFFFF' },
    cream:   { bg: LUME.creamDeep, fg: LUME.ink },
    sage:    { bg: LUME.sage,      fg: '#2F4823' },
  };
  const t = tones[tone] || tones.rose;
  const isTop = tail.startsWith('t');
  const isLeft = tail.endsWith('l');
  return (
    <div style={{
      position: 'relative', display: 'inline-block',
      padding: '7px 14px 8px',
      background: t.bg, color: t.fg,
      borderRadius: 999,
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, lineHeight: 1.25,
      boxShadow: '0 1px 3px rgba(40,35,28,.10)',
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}
      {/* trailing two dots — the coquette "chat bubble" tail */}
      <div style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: -3,
        [isLeft ? 'left' : 'right']: 10,
        width: 9, height: 9, borderRadius: 999,
        background: t.bg,
      }} />
      <div style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: -10,
        [isLeft ? 'left' : 'right']: 4,
        width: 5, height: 5, borderRadius: 999,
        background: t.bg,
      }} />
    </div>
  );
}

// iMessage-style chat bubble. side='sent' (right, brand-pink) | 'received' (left, gray)
function ChatBubble({ side = 'received', children, tail = true, style = {} }) {
  const sent = side === 'sent';
  return (
    <div style={{
      maxWidth: '78%',
      alignSelf: sent ? 'flex-end' : 'flex-start',
      padding: '8px 14px 9px',
      background: sent ? LUME.imSent : LUME.imReceived,
      color: sent ? '#FFFFFF' : LUME.ink,
      borderRadius: 20,
      // Asymmetric corner for tail effect
      borderBottomRightRadius: sent && tail ? 4 : 20,
      borderBottomLeftRadius: !sent && tail ? 4 : 20,
      fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.3,
      letterSpacing: -0.2,
      position: 'relative',
      ...style,
    }}>{children}</div>
  );
}

// PenArrow — thin black hand-drawn arrow (replaces the older scribbled)
function PenArrow({ length = 60, angle = 0, color = LUME.ink, strokeWidth = 1.2, style = {} }) {
  return (
    <svg width={length} height="26" viewBox={`0 0 ${length} 26`}
      style={{ display: 'block', transform: `rotate(${angle}deg)`, overflow: 'visible', ...style }}>
      <path d={`M2,18 Q${length*0.35},4 ${length*0.7},14 T${length-6},10`}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d={`M${length-12},4 L${length-4},10 L${length-13},14`}
        fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Sticker — a complete product card you can scatter on a page
function ProductSticker({ product, rotate, size = 92, onClick, showName = true, badge, intensity = 'medium' }) {
  const Svg = PRODUCT_SVGS[product.kind] || ProductBottleA;
  const r = rotate ?? product.rotate ?? -1.5;
  return (
    <div onClick={onClick} style={{
      position: 'relative',
      width: size + 16, padding: '8px 8px 10px',
      background: LUME.paper,
      borderRadius: 8,
      boxShadow: '0 1px 2px rgba(60,40,20,.12), 0 4px 14px rgba(60,40,20,.09)',
      transform: `rotate(${r}deg)`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform .2s ease, box-shadow .2s ease',
      flex: '0 0 auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: size }}>
        <Svg size={size * 0.78} hue={product.hue} />
      </div>
      {showName && (
        <div style={{
          fontFamily: 'Courier Prime, monospace', fontSize: 8.5, color: LUME.ink,
          textAlign: 'center', marginTop: 4,
          textTransform: 'uppercase', letterSpacing: .4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{product.brand}</div>
      )}
      {showName && (
        <div style={{
          fontFamily: 'Caveat, cursive', fontSize: 14, color: LUME.inkSoft,
          textAlign: 'center', lineHeight: 1, marginTop: -1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{product.name}</div>
      )}
      {badge && (
        <div style={{ position: 'absolute', top: -8, right: -6, transform: 'rotate(8deg)' }}>{badge}</div>
      )}
    </div>
  );
}

// Sample product catalogue (used across screens)
const PRODUCTS = [
  { id: 'p1', name: 'Glow Drops', brand: 'Lume Botanica', kind: 'bottle', hue: '#C8BB95', category: 'skincare', subcat: 'serum', rotate: -2, ingredients: ['Niacinamide', 'Zinc PCA', 'Hyaluronic Acid', 'Glycerin', 'Aqua'] },
  { id: 'p2', name: 'Daily Wash', brand: 'Petal & Co.', kind: 'tube', hue: '#E5C9BD', category: 'skincare', subcat: 'cleanser', rotate: 1.5, ingredients: ['Cocamidopropyl Betaine', 'Glycerin', 'Centella Asiatica', 'Panthenol'] },
  { id: 'p3', name: 'Cream Blush', brand: 'Halfmoon', kind: 'compact', hue: '#E0B49E', category: 'makeup', subcat: 'blush', rotate: -3, ingredients: ['Caprylic/Capric Triglyceride', 'Mica', 'Iron Oxides', 'Squalane'] },
  { id: 'p4', name: 'Brick Lip', brand: 'Halfmoon', kind: 'lipstick', hue: '#B33A3F', category: 'makeup', subcat: 'lipstick', rotate: 2, ingredients: ['Ricinus Communis Oil', 'Beeswax', 'Iron Oxides', 'Tocopherol'] },
  { id: 'p5', name: 'Night Cream', brand: 'Mossroot', kind: 'jar', hue: '#E8DDC0', category: 'skincare', subcat: 'moisturizer', rotate: -1.5, ingredients: ['Retinol 0.3%', 'Squalane', 'Ceramide NP', 'Bakuchiol', 'Fragrance'] },
  { id: 'p6', name: 'Lash Vol.', brand: 'Halfmoon', kind: 'mascara', hue: '#1A1410', category: 'makeup', subcat: 'mascara', rotate: 3, ingredients: ['Aqua', 'Beeswax', 'Carnauba Wax', 'Iron Oxides'] },
  { id: 'p7', name: 'Rose Mist', brand: 'Petal & Co.', kind: 'spray', hue: '#E6BFB5', category: 'skincare', subcat: 'toner', rotate: -2, ingredients: ['Rosa Damascena', 'Glycerin', 'Panthenol'] },
  { id: 'p8', name: 'Hydra Sheet', brand: 'Lume Botanica', kind: 'sheet', hue: '#F4EEDC', category: 'skincare', subcat: 'mask', rotate: 1, ingredients: ['Hyaluronic Acid', 'Niacinamide', 'Centella', 'Allantoin'] },
];

// Skin metrics (Perfect Corp Skin Analysis V2.1 has 14 — we mock them)
const SKIN_METRICS = [
  { id: 'wrinkles', label: 'Wrinkles', score: 88, color: LUME.sage },
  { id: 'texture', label: 'Texture', score: 74, color: LUME.sage },
  { id: 'firmness', label: 'Firmness', score: 81, color: LUME.sage },
  { id: 'dark_circles', label: 'Dark circles', score: 62, color: LUME.ochre },
  { id: 'eye_bags', label: 'Eye bags', score: 70, color: LUME.ochre },
  { id: 'pores', label: 'Pores', score: 58, color: LUME.terracotta },
  { id: 'redness', label: 'Redness', score: 65, color: LUME.ochre },
  { id: 'oiliness', label: 'Oiliness', score: 54, color: LUME.terracotta },
  { id: 'moisture', label: 'Moisture', score: 78, color: LUME.sage },
  { id: 'radiance', label: 'Radiance', score: 82, color: LUME.sage },
  { id: 'dark_spots', label: 'Dark spots', score: 71, color: LUME.ochre },
  { id: 'evenness', label: 'Evenness', score: 76, color: LUME.sage },
  { id: 'acne', label: 'Blemishes', score: 89, color: LUME.sage },
  { id: 'eye_radiance', label: 'Eye area', score: 66, color: LUME.ochre },
];

// Verdict data per product (mocked)
const VERDICTS = {
  p1: { v: 'works', reason: 'Niacinamide is helping your texture & redness. Keep going.', delta: '+12 radiance over 3 wks' },
  p2: { v: 'works', reason: 'Gentle surfactants, no stripping. Good fit for your barrier.', delta: 'no irritation flags' },
  p3: { v: 'works', reason: 'Skin-friendly emollients. Adds dimension without clogging.', delta: '— makeup category —' },
  p4: { v: 'neutral', reason: 'Wax base is fine but fragrance could nudge your redness.', delta: 'watch the perimeter' },
  p5: { v: 'skip', reason: 'Retinol + fragrance is fighting your barrier. Pause for 2 wks.', delta: '-8 firmness flagged' },
  p6: { v: 'works', reason: 'No reactive pigments. Easy to remove with your cleanser.', delta: '— makeup category —' },
  p7: { v: 'neutral', reason: 'Pleasant but not doing much heavy lifting. Optional.', delta: 'no measurable change' },
  p8: { v: 'works', reason: 'Hyaluronic + niacinamide combo is a friend to your skin type.', delta: '+9 moisture (used 4×)' },
};

Object.assign(window, {
  LUME, PaperBg, WashiTape, Sparkle, Star, Underline, Heart, Arrow, Squiggle,
  StickerCard, ProductSticker, StripedSlot, SelfiePlaceholder, VerdictTag, LumeMark,
  EditorialTitle, NumberTag, HighlighterMark, SpeechBubble, ChatBubble, PenArrow,
  PRODUCT_SVGS, PRODUCTS, SKIN_METRICS, VERDICTS,
});
