export interface AssetMetadata {
  id: string;
  name: string;
  category: string;
  tags: string[];
  generateSVG: (primary: string, secondary?: string) => string;
}

// Generate an Islamic Star pattern border
function getIslamicBorder(w: number, h: number, primary: string): string {
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect x="15" y="15" width="${w - 30}" height="${h - 30}" fill="none" stroke="${primary}" stroke-width="2" />
      <rect x="25" y="25" width="${w - 50}" height="${h - 50}" fill="none" stroke="${primary}" stroke-dasharray="10 5" stroke-width="1.5" />
      <!-- Corner Stars (8-point star) -->
      ${[
        [20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]
      ].map(([cx, cy]) => `
        <g transform="translate(${cx}, ${cy})">
          <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="${primary}" stroke-width="1.5" transform="rotate(0)" />
          <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="${primary}" stroke-width="1.5" transform="rotate(45)" />
        </g>
      `).join("")}
    </svg>
  `;
}

// Generate a luxury border with offset double lines
function getLuxuryBorder(w: number, h: number, primary: string, secondary: string): string {
  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect x="10" y="10" width="${w - 20}" height="${h - 20}" fill="none" stroke="${secondary}" stroke-width="6" rx="4" />
      <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="${primary}" stroke-width="1.5" rx="2" />
      <rect x="26" y="26" width="${w - 52}" height="${h - 52}" fill="none" stroke="${primary}" stroke-width="1" rx="2" />
      <!-- Corner Blocks -->
      <path d="M 8 8 L 48 8 L 48 24 L 24 24 L 24 48 L 8 48 Z" fill="${primary}" />
      <path d="M ${w - 8} 8 L ${w - 48} 8 L ${w - 48} 24 L ${w - 24} 24 L ${w - 24} 48 L ${w - 8} 48 Z" fill="${primary}" />
      <path d="M 8 ${h - 8} L 48 ${h - 8} L 48 ${h - 24} L 24 ${h - 24} L 24 ${h - 48} L 8 ${h - 48} Z" fill="${primary}" />
      <path d="M ${w - 8} ${h - 8} L ${w - 48} ${h - 8} L ${w - 48} ${h - 24} L ${w - 24} ${h - 24} L ${w - 24} ${h - 48} L ${w - 8} ${h - 48} Z" fill="${primary}" />
    </svg>
  `;
}

// Parametric Serrated Starburst Seal Generator
function getSealSVG(primary: string, points: number, innerText: string): string {
  const cx = 50;
  const cy = 50;
  const rOuter = 45;
  const rInner = 38;
  let pathPoints = "";

  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pathPoints += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  pathPoints += "Z";

  return `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <!-- Starburst -->
      <path d="${pathPoints}" fill="${primary}" stroke="#fff" stroke-width="1.5" />
      <!-- Inner Ring -->
      <circle cx="50" cy="50" r="32" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 2" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="1" />
      <!-- Center text/icon symbol -->
      <text x="50" y="54" font-family="Montserrat" font-size="7" font-weight="bold" fill="#fff" text-anchor="middle">${innerText}</text>
    </svg>
  `;
}

// Parametric Laurel Wreath Generator
function getWreathSVG(primary: string, leafCount: number): string {
  const leavesLeft = [];
  const leavesRight = [];
  
  for (let i = 0; i < leafCount; i++) {
    const progress = i / (leafCount - 1);
    const angle = -10 - progress * 140; // Curve angle
    const rad = (angle * Math.PI) / 180;
    const r = 35;
    const x = 50 + r * Math.cos(rad);
    const y = 55 + r * Math.sin(rad);
    
    leavesLeft.push(`
      <g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${(angle + 90).toFixed(1)})">
        <path d="M 0 0 C -4 -6 -10 -4 0 -15 C 10 -4 4 -6 0 0 Z" fill="${primary}" />
      </g>
    `);
    
    // Right leaf mirror
    const xMirror = 50 - r * Math.cos(rad);
    leavesRight.push(`
      <g transform="translate(${xMirror.toFixed(1)}, ${y.toFixed(1)}) rotate(${(-angle - 90).toFixed(1)})">
        <path d="M 0 0 C -4 -6 -10 -4 0 -15 C 10 -4 4 -6 0 0 Z" fill="${primary}" />
      </g>
    `);
  }

  return `
    <svg width="100" height="100" viewBox="0 0 100 100">
      <path d="M 15 55 A 35 35 0 0 1 85 55" fill="none" stroke="${primary}" stroke-width="1.5" />
      ${leavesLeft.join("")}
      ${leavesRight.join("")}
      <!-- Bow at the bottom -->
      <circle cx="50" cy="90" r="4" fill="${primary}" />
      <path d="M 50 90 Q 40 98 42 102 Q 50 92 50 90 Q 50 92 58 102 Q 60 98 50 90 Z" fill="${primary}" />
    </svg>
  `;
}

// Dynamic elements list
export const ASSETS_CATALOG: AssetMetadata[] = [
  // ─── PREMIUM BORDERS ───────────────────────────────────────────────────
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: `border_${i + 1}`,
    name: `Premium Border style ${i + 1}`,
    category: "Premium Borders",
    tags: ["border", "frame", "premium", "classic", "gold", "royal"],
    generateSVG: (primary: string, secondary?: string) => {
      const w = 842;
      const h = 595;
      const sec = secondary || "#ffe875";
      if (i % 3 === 0) return getLuxuryBorder(w, h, primary, sec);
      if (i % 3 === 1) return getIslamicBorder(w, h, primary);
      
      // Classic Double Line
      return `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <rect x="15" y="15" width="${w - 30}" height="${h - 30}" fill="none" stroke="${primary}" stroke-width="4" rx="10" />
          <rect x="25" y="25" width="${w - 50}" height="${h - 50}" fill="none" stroke="${primary}" stroke-width="1" rx="8" />
          <circle cx="20" cy="20" r="4" fill="${primary}" />
          <circle cx="${w - 20}" cy="20" r="4" fill="${primary}" />
          <circle cx="20" cy="${h - 20}" r="4" fill="${primary}" />
          <circle cx="${w - 20}" cy="${h - 20}" r="4" fill="${primary}" />
        </svg>
      `;
    }
  })),

  // ─── SEALS ─────────────────────────────────────────────────────────────
  ...Array.from({ length: 8 }).map((_, i) => {
    const titles = ["APPROVED", "OFFICIAL", "EXCELLENCE", "VALUED", "MERIT", "CERTIFIED", "HONOR", "GOLD MEDAL"];
    return {
      id: `seal_${i + 1}`,
      name: `Excellence Seal - ${titles[i]}`,
      category: "Certificate Seals",
      tags: ["seal", "gold", "achievement", "stamp"],
      generateSVG: (primary: string) => getSealSVG(primary, 36 + (i * 4), titles[i])
    };
  }),

  // ─── RIBBONS ───────────────────────────────────────────────────────────
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `ribbon_${i + 1}`,
    name: `Award Ribbon style ${i + 1}`,
    category: "Award Ribbons",
    tags: ["ribbon", "achievement", "gold", "red", "blue"],
    generateSVG: (primary: string, secondary?: string) => {
      const color1 = primary;
      const color2 = secondary || "#ef4444";
      return `
        <svg width="100" height="100" viewBox="0 0 100 100">
          <g transform="translate(50, 45)">
            <!-- Left tail -->
            <path d="M -8 0 L -18 45 L -8 40 L 2 45 Z" fill="${color2}" transform="rotate(15)" />
            <!-- Right tail -->
            <path d="M 8 0 L 18 45 L 8 40 L -2 45 Z" fill="${color2}" transform="rotate(-15)" />
            <!-- Ribbon Fold details -->
            <path d="M -15 0 L 15 0 L 10 15 L -10 15 Z" fill="${color1}" />
          </g>
          <!-- Small badge seal at core center -->
          <circle cx="50" cy="40" r="16" fill="${color1}" stroke="#fff" stroke-width="1.5" />
          <circle cx="50" cy="40" r="12" fill="none" stroke="#fff" stroke-width="0.5" stroke-dasharray="2 1" />
        </svg>
      `;
    }
  })),

  // ─── DECORATIVE CORNERS ────────────────────────────────────────────────
  ...Array.from({ length: 8 }).map((_, i) => ({
    id: `corner_${i + 1}`,
    name: `Ornate Corner flourish ${i + 1}`,
    category: "Decorative Corners",
    tags: ["corner", "luxury", "scroll", "floral"],
    generateSVG: (primary: string) => {
      return `
        <svg width="100" height="100" viewBox="0 0 100 100">
          <path d="M 10 10 L 80 10 M 10 10 L 10 80" stroke="${primary}" stroke-width="3" fill="none" />
          <!-- Swirl patterns -->
          <path d="M 10 10 C 25 25 35 15 30 35 C 25 45 40 40 40 20 C 40 10 20 20 10 10 Z" fill="${primary}" />
          <path d="M 10 10 C 15 35 25 25 35 30" fill="none" stroke="${primary}" stroke-width="1.5" />
        </svg>
      `;
    }
  })),

  // ─── LAUREL WREATHS ────────────────────────────────────────────────────
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `wreath_${i + 1}`,
    name: `Royal Wreath design ${i + 1}`,
    category: "Laurel Wreath Collection",
    tags: ["wreath", "laurel", "gold", "royal"],
    generateSVG: (primary: string) => getWreathSVG(primary, 8 + i * 2)
  })),

  // ─── SIGNATURE ELEMENTS ────────────────────────────────────────────────
  {
    id: "sig_1",
    name: "Standard Sign Line",
    category: "Signature Elements",
    tags: ["signature", "line", "principal"],
    generateSVG: (primary: string) => `
      <svg width="150" height="40" viewBox="0 0 150 40">
        <line x1="10" y1="20" x2="140" y2="20" stroke="${primary}" stroke-width="1.5" />
        <text x="75" y="34" font-family="Inter" font-size="10" fill="#64748b" text-anchor="middle">Authorized Signature</text>
      </svg>
    `
  },
  {
    id: "sig_2",
    name: "Principal Double Block",
    category: "Signature Elements",
    tags: ["signature", "principal", "block"],
    generateSVG: (primary: string) => `
      <svg width="150" height="50" viewBox="0 0 150 50">
        <rect x="5" y="5" width="140" height="40" fill="none" stroke="${primary}30" rx="4" />
        <line x1="20" y1="28" x2="130" y2="28" stroke="${primary}" stroke-width="1" />
        <text x="75" y="40" font-family="Inter" font-size="9" font-weight="bold" fill="${primary}" text-anchor="middle">PRINCIPAL SIGN</text>
      </svg>
    `
  },

  // ─── WATERMARKS ────────────────────────────────────────────────────────
  {
    id: "watermark_1",
    name: "Achievement Star Crest",
    category: "Watermarks",
    tags: ["watermark", "crest", "faded"],
    generateSVG: (primary: string) => `
      <svg width="200" height="200" viewBox="0 0 100 100" opacity="0.12">
        <circle cx="50" cy="50" r="45" fill="none" stroke="${primary}" stroke-width="1.5" />
        <path d="M 50 15 L 60 40 L 85 40 L 65 55 L 75 80 L 50 65 L 25 80 L 35 55 L 15 40 L 40 40 Z" fill="${primary}" />
      </svg>
    `
  },

  // ─── DECORATIVE LINES ──────────────────────────────────────────────────
  {
    id: "line_dec_1",
    name: "Luxury Separator",
    category: "Decorative Lines",
    tags: ["line", "separator", "luxury"],
    generateSVG: (primary: string) => `
      <svg width="200" height="20" viewBox="0 0 200 20">
        <line x1="10" y1="10" x2="190" y2="10" stroke="${primary}" stroke-width="1" />
        <!-- Center diamond -->
        <polygon points="100,5 105,10 100,15 95,10" fill="${primary}" />
        <circle cx="85" cy="10" r="2.5" fill="${primary}" />
        <circle cx="115" cy="10" r="2.5" fill="${primary}" />
      </svg>
    `
  },

  // ─── BADGES ────────────────────────────────────────────────────────────
  {
    id: "badge_1",
    name: "Completion Honor Badge",
    category: "Badges",
    tags: ["badge", "excellence", "medal"],
    generateSVG: (primary: string, secondary?: string) => {
      const sec = secondary || "#ef4444";
      return `
        <svg width="100" height="120" viewBox="0 0 100 120">
          <g transform="translate(50, 80)">
            <path d="M -10 0 L -20 35 L -10 30 L 0 35 Z" fill="${sec}" />
            <path d="M 10 0 L 20 35 L 10 30 L 0 35 Z" fill="${sec}" />
          </g>
          <circle cx="50" cy="50" r="30" fill="${primary}" stroke="#fff" stroke-width="2" />
          <path d="M 50 32 L 55 45 L 68 45 L 58 53 L 62 66 L 50 58 L 38 66 L 42 53 L 32 45 L 45 45 Z" fill="#fff" />
        </svg>
      `;
    }
  },

  // ─── AWARD ICONS ───────────────────────────────────────────────────────
  {
    id: "icon_trophy",
    name: "Award Trophy Icon",
    category: "Award Icons",
    tags: ["icon", "trophy", "cup"],
    generateSVG: (primary: string) => `
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
      </svg>
    `
  },
  {
    id: "icon_cap",
    name: "Graduation Cap Icon",
    category: "Award Icons",
    tags: ["icon", "cap", "graduation"],
    generateSVG: (primary: string) => `
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    `
  }
];
