import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 18.0;
const TOTAL_FRAMES = Math.floor(FPS * DURATION); // 540 frames

// Easing functions
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeOutElastic(x) {
  if (x === 0) return 0;
  if (x === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

// Logo blob paths from oddly_logo.svg (1024x1024 base)
const BLOB_CORAL = `M164 112 C205 67 274 58 354 63 C430 66 476 98 472 167 C469 230 447 305 409 357 C372 408 307 431 222 427 C149 424 111 392 112 326 C113 248 127 156 164 112 Z`;
const BLOB_GOLD  = `M566 91 C618 58 703 61 770 72 C837 84 874 124 870 194 C866 269 846 344 806 386 C768 427 701 433 627 423 C558 414 525 376 528 309 C531 224 530 125 566 91 Z`;
const BLOB_BLUE  = `M112 572 C151 522 219 507 292 511 C365 515 414 545 416 611 C418 680 397 760 359 812 C322 863 255 886 180 880 C109 875 72 840 75 773 C78 692 80 613 112 572 Z`;
const BLOB_PURPLE= `M565 561 C613 520 683 509 757 514 C832 519 868 557 864 626 C860 704 837 781 797 831 C758 881 691 900 617 891 C548 883 513 845 516 779 C520 696 527 594 565 561 Z`;

// Render Oddly Logo centered at (cx, cy) with given scale and individual blob offsets
function renderLogo(cx, cy, scale, blobSpread = 0, rot = 0, opacity = 1) {
  // Center of the 1024x1024 logo is ~ (490, 480)
  const ox = 490;
  const oy = 480;
  return `
    <g transform="translate(${cx}, ${cy}) rotate(${rot}) scale(${scale}) translate(${-ox}, ${-oy})" opacity="${opacity}">
      <path fill="#FF756D" d="${BLOB_CORAL}" transform="translate(${-blobSpread}, ${-blobSpread})"/>
      <path fill="#FFC936" d="${BLOB_GOLD}" transform="translate(${blobSpread}, ${-blobSpread})"/>
      <path fill="#4389F5" d="${BLOB_BLUE}" transform="translate(${-blobSpread}, ${blobSpread})"/>
      <path fill="#A982F5" d="${BLOB_PURPLE}" transform="translate(${blobSpread}, ${blobSpread})"/>
    </g>
  `;
}

// Generate background grid pattern
function renderBackgroundGrid(opacity = 0.08) {
  return `
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-opacity="${opacity}"/>
      <circle cx="0" cy="0" r="2" fill="#FFFFFF" fill-opacity="${opacity * 2}"/>
    </pattern>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  `;
}

// Frame Generator
function generateSVGFrame(frame) {
  const t = frame / FPS; // Time in seconds

  let content = '';
  let bg = '#121118';

  // -------------------------------------------------------------
  // SCENE 1: THE HOOK (0.0s – 3.2s | Frames 0 – 95)
  // -------------------------------------------------------------
  if (t < 3.2) {
    bg = '#121118';
    
    // Logo assembly (0.0s - 1.4s)
    const assembleProgress = Math.min(1, t / 1.2);
    const easeAssemble = easeOutElastic(assembleProgress);
    const spread = (1 - easeAssemble) * 220;
    const logoScale = 0.22 + 0.12 * easeAssemble;
    const logoRot = (1 - easeAssemble) * -45;

    // Pulse wave at 1.4s
    let pulseWave = '';
    if (t > 1.3) {
      const pt = (t - 1.3) / 0.8;
      if (pt <= 1) {
        const pr = 100 + pt * 600;
        const popacity = Math.max(0, 1 - pt);
        pulseWave = `
          <circle cx="960" cy="380" r="${pr}" fill="none" stroke="#FF756D" stroke-width="3" opacity="${popacity * 0.6}"/>
          <circle cx="960" cy="380" r="${pr * 0.85}" fill="none" stroke="#FFC936" stroke-width="2" opacity="${popacity * 0.5}"/>
          <circle cx="960" cy="380" r="${pr * 0.7}" fill="none" stroke="#4389F5" stroke-width="2" opacity="${popacity * 0.4}"/>
        `;
      }
    }

    // Typography
    let textSVG = '';
    if (t < 2.2) {
      // "TIRED OF THE SAME 5-LETTER WORD?"
      const textProgress = Math.max(0, Math.min(1, (t - 0.7) / 0.4));
      const textY = 700 + (1 - easeOutBack(textProgress)) * 80;
      const textAlpha = textProgress;
      textSVG = `
        <g transform="translate(960, ${textY})" opacity="${textAlpha}" text-anchor="middle">
          <rect x="-480" y="-45" width="960" height="90" rx="16" fill="#1E1C27" stroke="#2E2B3D" stroke-width="2"/>
          <text y="14" fill="#F7F4EC" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="36" letter-spacing="2">
            TIRED OF THE SAME 5-LETTER WORD?
          </text>
        </g>
      `;
    } else {
      // "MEET ODDLY."
      const meetProgress = Math.min(1, (t - 2.2) / 0.35);
      const mScale = 0.7 + 0.3 * easeOutElastic(meetProgress);
      const mAlpha = meetProgress;
      textSVG = `
        <g transform="translate(960, 720) scale(${mScale})" opacity="${mAlpha}" text-anchor="middle">
          <text y="-20" fill="#FFC936" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" letter-spacing="6">
            DAILY BRAIN GAMES FOR GEEKS
          </text>
          <text y="70" fill="#F7F4EC" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="96" letter-spacing="8">
            MEET ODDLY.
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      ${pulseWave}
      ${renderLogo(960, 380, logoScale, spread, logoRot)}
      ${textSVG}
    `;
  }

  // -------------------------------------------------------------
  // SCENE 2A: FIBBER (3.2s – 4.7s | Frames 96 – 140)
  // -------------------------------------------------------------
  else if (t >= 3.2 && t < 4.7) {
    bg = '#14131A';
    const st = t - 3.2; // 0.0 to 1.5s
    const cardProgress = Math.min(1, st / 0.4);
    const cardScale = 0.8 + 0.2 * easeOutBack(cardProgress);
    const cardRot = -2 + Math.sin(st * 4) * 0.5;

    // Rubber stamp slam at 0.7s
    let stampSVG = '';
    let screenShake = 0;
    if (st > 0.7) {
      const stampP = Math.min(1, (st - 0.7) / 0.25);
      const stampScale = 2.5 - 1.5 * easeOutElastic(stampP);
      const stampRot = -12;
      const stampAlpha = Math.min(1, stampP * 1.5);
      screenShake = Math.max(0, Math.sin((st - 0.7) * 40) * 8 * Math.exp(-(st - 0.7) * 8));

      stampSVG = `
        <g transform="translate(960, 560) scale(${stampScale}) rotate(${stampRot})" opacity="${stampAlpha}">
          <rect x="-240" y="-70" width="480" height="140" rx="14" fill="none" stroke="#FF3366" stroke-width="10"/>
          <rect x="-225" y="-55" width="450" height="110" rx="8" fill="none" stroke="#FF3366" stroke-width="3" stroke-dasharray="12 8"/>
          <text y="22" fill="#FF3366" font-family="Impact, system-ui, sans-serif" font-weight="900" font-size="82" text-anchor="middle" letter-spacing="6">
            FAKE NEWS!
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      <g transform="translate(${screenShake}, 0)">
        <!-- Top Pill Badge -->
        <g transform="translate(960, 180)" text-anchor="middle">
          <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#FFC936" stroke="#121118" stroke-width="4"/>
          <text y="10" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
            GAME 01 · FIBBER
          </text>
        </g>

        <!-- News Card -->
        <g transform="translate(960, 520) scale(${cardScale}) rotate(${cardRot})">
          <!-- Card Shadow -->
          <rect x="-460" y="-220" width="920" height="440" rx="20" fill="#0A090F" transform="translate(14, 14)"/>
          <!-- Card Body -->
          <rect x="-460" y="-220" width="920" height="440" rx="20" fill="#F7F4EC" stroke="#121118" stroke-width="6"/>
          
          <!-- Card Content -->
          <rect x="-420" y="-180" width="180" height="34" rx="6" fill="#121118"/>
          <text x="-410" y="-157" fill="#FFC936" font-family="monospace" font-weight="800" font-size="16">BREAKING NEWS</text>
          
          <text x="-420" y="-90" fill="#121118" font-family="Georgia, serif" font-weight="900" font-size="44" width="840">
            Scientists discover Antarctic penguins
          </text>
          <text x="-420" y="-40" fill="#121118" font-family="Georgia, serif" font-weight="900" font-size="44">
            have mastered quantum computing.
          </text>
          
          <line x1="-420" y1="20" x2="420" y2="20" stroke="#E2DED4" stroke-width="2"/>
          <text x="-420" y="80" fill="#666" font-family="system-ui, sans-serif" font-size="22">
            Can you spot the one completely fabricated headline?
          </text>
          
          <rect x="-420" y="110" width="260" height="50" rx="25" fill="#121118"/>
          <text x="-290" y="142" fill="#F7F4EC" font-family="system-ui, sans-serif" font-weight="800" font-size="18" text-anchor="middle">
            CALL THE LIE ➔
          </text>
        </g>

        ${stampSVG}

        <!-- Bottom Tagline -->
        <g transform="translate(960, 930)" text-anchor="middle">
          <text fill="#A982F5" font-family="system-ui, sans-serif" font-weight="800" font-size="32" letter-spacing="3">
            "Fooled by a goose. Pity."
          </text>
        </g>
      </g>
    `;
  }

  // -------------------------------------------------------------
  // SCENE 2B: STRATA (4.7s – 6.1s | Frames 141 – 182)
  // -------------------------------------------------------------
  else if (t >= 4.7 && t < 6.1) {
    bg = '#14131A';
    const st = t - 4.7; // 0.0 to 1.4s
    
    // 4 Historical strata tiles snapping in
    const tiles = [
      { year: '1969', name: 'Apollo 11 Moon Landing', col: '#FF756D', y: 350 },
      { year: '1903', name: 'Wright Brothers Flyer at Kitty Hawk', col: '#FFC936', y: 460 },
      { year: '1789', name: 'Storming of the Bastille', col: '#4389F5', y: 570 },
      { year: '79 AD', name: 'Eruption of Mount Vesuvius', col: '#A982F5', y: 680 }
    ];

    let tilesSVG = '';
    tiles.forEach((item, idx) => {
      const delay = idx * 0.12;
      const p = Math.max(0, Math.min(1, (st - delay) / 0.3));
      const tileX = 960 + (1 - easeOutBack(p)) * (idx % 2 === 0 ? -400 : 400);
      const alpha = p;
      tilesSVG += `
        <g transform="translate(${tileX}, ${item.y})" opacity="${alpha}">
          <rect x="-420" y="-40" width="840" height="80" rx="12" fill="#1E1C27" stroke="${item.col}" stroke-width="3"/>
          <rect x="-400" y="-24" width="120" height="48" rx="8" fill="${item.col}"/>
          <text x="-340" y="8" fill="#121118" font-family="monospace" font-weight="900" font-size="24" text-anchor="middle">${item.year}</text>
          <text x="-250" y="8" fill="#F7F4EC" font-family="system-ui, sans-serif" font-weight="800" font-size="26">${item.name}</text>
          <circle cx="380" cy="0" r="14" fill="${item.col}" opacity="0.2"/>
          <circle cx="380" cy="0" r="6" fill="${item.col}"/>
        </g>
      `;
    });

    // Padlock lock stamp at 0.9s
    let lockSVG = '';
    if (st > 0.8) {
      const lp = Math.min(1, (st - 0.8) / 0.25);
      const lScale = 1.6 - 0.6 * easeOutBack(lp);
      lockSVG = `
        <g transform="translate(960, 520) scale(${lScale})">
          <rect x="-240" y="-55" width="480" height="110" rx="20" fill="#2EC4A0" stroke="#121118" stroke-width="6"/>
          <text y="14" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="34" text-anchor="middle" letter-spacing="3">
            🔒 CHRONOLOGY LOCKED!
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      <!-- Top Pill Badge -->
      <g transform="translate(960, 180)" text-anchor="middle">
        <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#FF756D" stroke="#121118" stroke-width="4"/>
        <text y="10" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
          GAME 02 · STRATA
        </text>
      </g>
      <text x="960" y="270" fill="#F7F4EC" font-family="system-ui, sans-serif" font-weight="900" font-size="44" text-anchor="middle" letter-spacing="1">
        Order history from prehistoric to present.
      </text>

      ${tilesSVG}
      ${lockSVG}
    `;
  }

  // -------------------------------------------------------------
  // SCENE 2C: PINPOINT (6.1s – 7.6s | Frames 183 – 227)
  // -------------------------------------------------------------
  else if (t >= 6.1 && t < 7.6) {
    bg = '#0D111A';
    const st = t - 6.1; // 0.0 to 1.5s
    const sweepAngle = (st * 360 * 1.5) % 360;

    // Reticle & target drop
    const lockP = Math.max(0, Math.min(1, (st - 0.6) / 0.4));
    const reticleScale = 2.0 - 1.0 * easeOutElastic(lockP);

    content = `
      <!-- Radar Circles -->
      <circle cx="960" cy="540" r="420" fill="none" stroke="#25354A" stroke-width="2"/>
      <circle cx="960" cy="540" r="300" fill="none" stroke="#25354A" stroke-width="2"/>
      <circle cx="960" cy="540" r="180" fill="none" stroke="#25354A" stroke-width="2"/>
      <circle cx="960" cy="540" r="60" fill="none" stroke="#25354A" stroke-width="2"/>
      <line x1="540" y1="540" x2="1380" y2="540" stroke="#25354A" stroke-width="1"/>
      <line x1="960" y1="120" x2="960" y2="960" stroke="#25354A" stroke-width="1"/>

      <!-- Coastline Shapes (Strait of Gibraltar silhouette) -->
      <path d="M 680 440 Q 820 480 940 430 Q 1060 410 1200 450 L 1220 380 L 660 380 Z" fill="#2E435E" opacity="0.7"/>
      <path d="M 680 620 Q 820 580 940 610 Q 1080 640 1220 590 L 1220 680 L 660 680 Z" fill="#2E435E" opacity="0.7"/>

      <!-- Rotating Radar Beam -->
      <g transform="translate(960, 540) rotate(${sweepAngle})">
        <line x1="0" y1="0" x2="420" y2="0" stroke="#4389F5" stroke-width="3"/>
        <path d="M 0 0 L 420 -60 A 420 420 0 0 1 420 0 Z" fill="#4389F5" opacity="0.25"/>
      </g>

      <!-- Target Pinpoint -->
      <g transform="translate(970, 510) scale(${reticleScale})" opacity="${lockP}">
        <circle cx="0" cy="0" r="40" fill="none" stroke="#FF756D" stroke-width="4"/>
        <circle cx="0" cy="0" r="8" fill="#FF756D"/>
        <line x1="-60" y1="0" x2="-40" y2="0" stroke="#FF756D" stroke-width="3"/>
        <line x1="40" y1="0" x2="60" y2="0" stroke="#FF756D" stroke-width="3"/>
        <line x1="0" y1="-60" x2="0" y2="-40" stroke="#FF756D" stroke-width="3"/>
        <line x1="0" y1="40" x2="0" y2="60" stroke="#FF756D" stroke-width="3"/>
      </g>

      <!-- Top Pill -->
      <g transform="translate(960, 140)" text-anchor="middle">
        <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#4389F5" stroke="#121118" stroke-width="4"/>
        <text y="10" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
          GAME 03 · PINPOINT
        </text>
      </g>

      <!-- Telemetry Badge -->
      <g transform="translate(960, 880)" text-anchor="middle" opacity="${lockP}">
        <rect x="-260" y="-35" width="520" height="70" rx="16" fill="#141E2B" stroke="#2EC4A0" stroke-width="3"/>
        <text y="10" fill="#2EC4A0" font-family="monospace" font-weight="900" font-size="28" letter-spacing="2">
          📍 12 KM OFF! · 4,890 PTS
        </text>
      </g>
    `;
  }

  // -------------------------------------------------------------
  // SCENE 2D: BALLPARK (7.6s – 9.1s | Frames 228 – 272)
  // -------------------------------------------------------------
  else if (t >= 7.6 && t < 9.1) {
    bg = '#14131A';
    const st = t - 7.6; // 0.0 to 1.5s
    
    // Slider cursor whip: fast motion from 10^3 to 10^13
    const whipP = Math.min(1, st / 0.8);
    const sliderX = 400 + easeInOutCubic(whipP) * 1120;
    const curExp = (3 + easeInOutCubic(whipP) * 10).toFixed(1);

    // Score reveal at 0.9s
    let scorePop = '';
    if (st > 0.8) {
      const sp = Math.min(1, (st - 0.8) / 0.3);
      const scScale = 0.5 + 0.5 * easeOutElastic(sp);
      scorePop = `
        <g transform="translate(960, 840) scale(${scScale})" text-anchor="middle">
          <rect x="-260" y="-40" width="520" height="80" rx="20" fill="#2EC4A0" stroke="#121118" stroke-width="4"/>
          <text y="12" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="32" letter-spacing="2">
            SPOT ON! +980 PTS
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      <!-- Top Pill -->
      <g transform="translate(960, 160)" text-anchor="middle">
        <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#FFC936" stroke="#121118" stroke-width="4"/>
        <text y="10" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
          GAME 04 · BALLPARK
        </text>
      </g>

      <!-- Question Card -->
      <g transform="translate(960, 310)" text-anchor="middle">
        <text fill="#F7F4EC" font-family="Georgia, serif" font-weight="900" font-size="44">
          "Total red blood cells in all living humans?"
        </text>
        <text y="50" fill="#A982F5" font-family="monospace" font-weight="700" font-size="22">
          Scale: 10^0 to 10^24 (One to Septillions)
        </text>
      </g>

      <!-- Logarithmic Scale Track -->
      <g transform="translate(0, 560)">
        <rect x="200" y="-12" width="1520" height="24" rx="12" fill="#242230"/>
        <!-- Scale Ticks -->
        ${Array.from({ length: 9 }).map((_, i) => {
          const tx = 200 + i * (1520 / 8);
          const exp = i * 3;
          return `
            <line x1="${tx}" y1="-30" x2="${tx}" y2="30" stroke="#F7F4EC" stroke-width="3"/>
            <text x="${tx}" y="65" fill="#8E8B99" font-family="monospace" font-weight="800" font-size="22" text-anchor="middle">10^${exp}</text>
          `;
        }).join('')}

        <!-- Cursor -->
        <g transform="translate(${sliderX}, 0)">
          <line x1="0" y1="-80" x2="0" y2="80" stroke="#FF756D" stroke-width="5"/>
          <circle cx="0" cy="0" r="32" fill="#FF756D" stroke="#FFFFFF" stroke-width="4"/>
          <!-- Tooltip -->
          <rect x="-80" y="-140" width="160" height="50" rx="10" fill="#FF756D"/>
          <text y="-108" fill="#FFFFFF" font-family="monospace" font-weight="900" font-size="24" text-anchor="middle">
            10^${curExp}
          </text>
        </g>
      </g>

      ${scorePop}
    `;
  }

  // -------------------------------------------------------------
  // SCENE 3A: QUIPHER (9.1s – 11.0s | Frames 273 – 329)
  // -------------------------------------------------------------
  else if (t >= 9.1 && t < 11.0) {
    bg = '#121118';
    const st = t - 9.1; // 0.0 to 1.9s

    // Substitution Cipher flip animation
    const cipherText = 'XZ VJ QKKW, DKO TJ XZ BZVV';
    const plainText  = 'TO BE WISE, ONE MUST BE KIND';
    const flipP = Math.min(1, Math.max(0, (st - 0.4) / 0.8));
    const charsFlipped = Math.floor(flipP * plainText.length);

    let blocksSVG = '';
    const startX = 960 - (plainText.length * 52) / 2;
    for (let i = 0; i < plainText.length; i++) {
      const isSpace = plainText[i] === ' ' || plainText[i] === ',';
      const bx = startX + i * 52;
      const isRevealed = i <= charsFlipped;
      const char = isSpace ? plainText[i] : (isRevealed ? plainText[i] : (cipherText[i] || 'X'));
      const col = isRevealed ? '#2EC4A0' : '#FFC936';

      blocksSVG += `
        <g transform="translate(${bx}, 520)">
          ${!isSpace ? `
            <rect x="-22" y="-32" width="44" height="64" rx="8" fill="#1E1C27" stroke="${col}" stroke-width="2.5"/>
          ` : ''}
          <text y="14" fill="${isSpace ? '#8E8B99' : col}" font-family="monospace" font-weight="900" font-size="34" text-anchor="middle">
            ${char}
          </text>
        </g>
      `;
    }

    // Rank Badge
    let rankSVG = '';
    if (st > 1.0) {
      const rp = Math.min(1, (st - 1.0) / 0.3);
      const rScale = 0.6 + 0.4 * easeOutElastic(rp);
      rankSVG = `
        <g transform="translate(960, 750) scale(${rScale})" text-anchor="middle">
          <rect x="-240" y="-35" width="480" height="70" rx="35" fill="#4389F5" stroke="#FFFFFF" stroke-width="3"/>
          <text y="12" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="900" font-size="28" letter-spacing="3">
            🏆 RANK: CODEBREAKER
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      <!-- Top Pill -->
      <g transform="translate(960, 160)" text-anchor="middle">
        <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#A982F5" stroke="#121118" stroke-width="4"/>
        <text y="10" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
          GAME 05 · QUIPHER
        </text>
      </g>

      <text x="960" y="270" fill="#F7F4EC" font-family="system-ui, sans-serif" font-weight="900" font-size="44" text-anchor="middle" letter-spacing="1">
        Daily substitution cryptogram puzzle.
      </text>

      ${blocksSVG}
      ${rankSVG}
    `;
  }

  // -------------------------------------------------------------
  // SCENE 3B: BLACKOUT (11.0s – 12.8s | Frames 330 – 383)
  // -------------------------------------------------------------
  else if (t >= 11.0 && t < 12.8) {
    bg = '#14131A';
    const st = t - 11.0; // 0.0 to 1.8s

    // Dossier Card
    const dScale = 0.9 + 0.1 * easeOutBack(Math.min(1, st / 0.4));
    
    // Tape Peel at 0.6s
    const tapeP = Math.min(1, Math.max(0, (st - 0.6) / 0.5));
    const tapeWidth = (1 - tapeP) * 580;

    // Declassified Stamp at 1.0s
    let declassSVG = '';
    if (st > 0.9) {
      const dp = Math.min(1, (st - 0.9) / 0.25);
      const dsScale = 2.2 - 1.2 * easeOutElastic(dp);
      declassSVG = `
        <g transform="translate(960, 540) scale(${dsScale}) rotate(-14)">
          <rect x="-240" y="-60" width="480" height="120" rx="12" fill="none" stroke="#FF3366" stroke-width="8"/>
          <text y="18" fill="#FF3366" font-family="Impact, sans-serif" font-weight="900" font-size="64" text-anchor="middle" letter-spacing="6">
            DECLASSIFIED
          </text>
        </g>
      `;
    }

    content = `
      ${renderBackgroundGrid(0.06)}
      <!-- Top Pill -->
      <g transform="translate(960, 150)" text-anchor="middle">
        <rect x="-220" y="-30" width="440" height="60" rx="30" fill="#FF756D" stroke="#121118" stroke-width="4"/>
        <text y="10" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="24" letter-spacing="2">
          GAME 06 · BLACKOUT
        </text>
      </g>

      <!-- Manila Folder -->
      <g transform="translate(960, 520) scale(${dScale})">
        <rect x="-440" y="-200" width="880" height="400" rx="16" fill="#09080E" transform="translate(14, 14)"/>
        <rect x="-440" y="-200" width="880" height="400" rx="16" fill="#E8D8B8" stroke="#121118" stroke-width="6"/>
        
        <!-- Dossier Header -->
        <rect x="-400" y="-160" width="280" height="36" rx="6" fill="#121118"/>
        <text x="-260" y="-136" fill="#FF756D" font-family="monospace" font-weight="900" font-size="16" text-anchor="middle">
          TOP SECRET // CIA EYES ONLY
        </text>

        <!-- Redacted Text Lines -->
        <text x="-400" y="-60" fill="#2C2820" font-family="Courier, monospace" font-size="30" font-weight="700">
          SUBJECT: 1962 CARIBBEAN CRISIS RECONNAISSANCE
        </text>
        
        <text x="-400" y="20" fill="#2C2820" font-family="Courier, monospace" font-size="30" font-weight="700">
          CODE NAME: OPERATION CHESSBOARD
        </text>
        
        <!-- Censor Tape Bar -->
        ${tapeWidth > 0 ? `
          <rect x="-200" y="-10" width="${tapeWidth}" height="42" fill="#121118"/>
        ` : ''}

        <text x="-400" y="100" fill="#5A5242" font-family="Courier, monospace" font-size="24">
          Status: Unredact the dossier before 5 strikes.
        </text>
      </g>

      ${declassSVG}
    `;
  }

  // -------------------------------------------------------------
  // SCENE 4: HOST ATTITUDE & SARCASM (12.8s – 15.0s | Frames 384 – 449)
  // -------------------------------------------------------------
  else if (t >= 12.8 && t < 15.0) {
    bg = '#121118';
    const st = t - 12.8; // 0.0 to 2.2s

    const stickers = [
      { text: 'Reality is rude.', col: '#FF756D', x: 480, y: 320, rot: -8, delay: 0.1 },
      { text: 'Fermi would weep.', col: '#FFC936', x: 1440, y: 300, rot: 10, delay: 0.35 },
      { text: "Don't get cocky.", col: '#4389F5', x: 520, y: 640, rot: 6, delay: 0.6 },
      { text: 'One away. Pity.', col: '#A982F5', x: 1400, y: 660, rot: -9, delay: 0.85 }
    ];

    let stickersSVG = '';
    stickers.forEach((s) => {
      const p = Math.max(0, Math.min(1, (st - s.delay) / 0.3));
      if (p > 0) {
        const sc = 0.4 + 0.6 * easeOutBack(p);
        stickersSVG += `
          <g transform="translate(${s.x}, ${s.y}) scale(${sc}) rotate(${s.rot})">
            <rect x="-220" y="-45" width="440" height="90" rx="45" fill="#08070D" transform="translate(8, 8)"/>
            <rect x="-220" y="-45" width="440" height="90" rx="45" fill="${s.col}" stroke="#121118" stroke-width="5"/>
            <text y="14" fill="#121118" font-family="system-ui, sans-serif" font-weight="900" font-size="34" text-anchor="middle">
              ${s.text}
            </text>
          </g>
        `;
      }
    });

    content = `
      ${renderBackgroundGrid(0.06)}
      ${stickersSVG}

      <!-- Center Countdown Dial -->
      <g transform="translate(960, 480)" text-anchor="middle">
        <text y="-50" fill="#8E8B99" font-family="monospace" font-weight="700" font-size="24" letter-spacing="4">
          RESETTING DAILY AT MIDNIGHT
        </text>
        <text y="50" fill="#F7F4EC" font-family="monospace" font-weight="900" font-size="88" letter-spacing="6">
          00:00:00
        </text>
      </g>
    `;
  }

  // -------------------------------------------------------------
  // SCENE 5: FINALE & CALL TO ACTION (15.0s – 18.0s | Frames 450 – 540)
  // -------------------------------------------------------------
  else {
    bg = '#F6F3EC'; // Cream paper background
    const st = t - 15.0; // 0.0 to 3.0s

    // Confetti shower
    const confettiColors = ['#FF756D', '#FFC936', '#4389F5', '#A982F5', '#2EC4A0'];
    let confettiSVG = '';
    for (let i = 0; i < 40; i++) {
      const cx = (i * 137.5) % WIDTH;
      const speed = 250 + (i % 5) * 60;
      const cy = ((st * speed + i * 40) % (HEIGHT + 100)) - 50;
      const cRot = (st * 180 + i * 45) % 360;
      const cCol = confettiColors[i % confettiColors.length];
      const w = 14 + (i % 3) * 6;
      const h = 8 + (i % 2) * 4;
      confettiSVG += `
        <rect x="${cx}" y="${cy}" width="${w}" height="${h}" rx="3" fill="${cCol}" transform="rotate(${cRot}, ${cx}, ${cy})" opacity="0.85"/>
      `;
    }

    // Logo bounce in
    const logoP = Math.min(1, st / 0.6);
    const lScale = 0.28 * easeOutElastic(logoP);
    const breathe = Math.sin(st * 4) * 0.01;

    // Badges slide in at 0.5s
    const badgeP = Math.max(0, Math.min(1, (st - 0.5) / 0.4));
    const badgeAlpha = badgeP;
    const badgeY = 660 + (1 - easeOutBack(badgeP)) * 40;

    // CTA Button bounce at 0.8s
    const ctaP = Math.max(0, Math.min(1, (st - 0.8) / 0.4));
    const ctaScale = 0.5 + 0.5 * easeOutElastic(ctaP);

    content = `
      ${confettiSVG}

      <!-- Center Logo -->
      ${renderLogo(960, 260, lScale + breathe, 0, 0)}

      <!-- Giant Oddly Typography -->
      <g transform="translate(960, 470)" text-anchor="middle">
        <text fill="#121118" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="110" letter-spacing="8">
          ODDLY
        </text>
        <text y="60" fill="#585466" font-family="Georgia, serif" font-weight="700" font-size="34" font-style="italic">
          Daily dose of nerd. 9 games every midnight.
        </text>
      </g>

      <!-- 3 Feature Badges -->
      <g transform="translate(960, ${badgeY})" opacity="${badgeAlpha}">
        <g transform="translate(-320, 0)">
          <rect x="-140" y="-24" width="280" height="48" rx="24" fill="#121118"/>
          <text y="8" fill="#F7F4EC" font-family="system-ui, sans-serif" font-weight="800" font-size="18" text-anchor="middle">
            ✦ 9 GAMES DAILY
          </text>
        </g>
        <g transform="translate(0, 0)">
          <rect x="-140" y="-24" width="280" height="48" rx="24" fill="#121118"/>
          <text y="8" fill="#FFC936" font-family="system-ui, sans-serif" font-weight="800" font-size="18" text-anchor="middle">
            ✦ 100% FREE
          </text>
        </g>
        <g transform="translate(320, 0)">
          <rect x="-140" y="-24" width="280" height="48" rx="24" fill="#121118"/>
          <text y="8" fill="#FF756D" font-family="system-ui, sans-serif" font-weight="800" font-size="18" text-anchor="middle">
            ✦ NO ACCOUNTS · NO ADS
          </text>
        </g>
      </g>

      <!-- Big Call to Action Pill Button -->
      <g transform="translate(960, 830) scale(${ctaScale})" text-anchor="middle">
        <rect x="-340" y="-55" width="680" height="110" rx="55" fill="#0A090F" transform="translate(10, 10)"/>
        <rect x="-340" y="-55" width="680" height="110" rx="55" fill="#FF756D" stroke="#121118" stroke-width="6"/>
        <text y="14" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" letter-spacing="2">
          PLAY FREE ➔ fibber.singulr.tech
        </text>
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${bg}"/>
      ${content}
    </svg>
  `;
}

// Main execution pipeline: render frames and pipe directly into ffmpeg
async function main() {
  console.log(`[MOTION AD] Rendering ${TOTAL_FRAMES} frames (18.0s @ ${FPS} FPS, 1920x1080)...`);
  const startTime = Date.now();

  const outputPath = path.resolve(process.cwd(), 'oddly_motion_ad.mp4');
  const audioPath = path.resolve(process.cwd(), 'soundtrack.wav');

  // Spawn ffmpeg with rawvideo pipe input and audio muxing
  const ffmpegArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-r', String(FPS),
    '-i', 'pipe:0',
    '-i', audioPath,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outputPath
  ];

  const ffmpeg = spawn('/opt/homebrew/bin/ffmpeg', ffmpegArgs);

  ffmpeg.stderr.on('data', (d) => {
    const str = d.toString();
    if (str.includes('frame=') || str.includes('Error')) {
      process.stdout.write(`\r${str.trim().slice(0, 80)}`);
    }
  });

  ffmpeg.on('error', (err) => {
    console.error('\n[FFMPEG ERROR]', err);
    process.exit(1);
  });

  const renderPromise = new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  // Render and feed frames sequentially
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const svg = generateSVGFrame(f);
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: WIDTH }
    });
    const pngBuffer = resvg.render().asPng();
    ffmpeg.stdin.write(pngBuffer);

    if (f % 30 === 0 || f === TOTAL_FRAMES - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = Math.round((f / TOTAL_FRAMES) * 100);
      console.log(`[FRAME] ${f}/${TOTAL_FRAMES} (${pct}%) · elapsed: ${elapsed}s`);
    }
  }

  ffmpeg.stdin.end();
  await renderPromise;

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✓ Successfully rendered and encoded video: ${outputPath} in ${totalTime}s!`);

  // Copy to public/oddly_motion_ad.mp4 as well
  fs.copyFileSync(outputPath, path.resolve(process.cwd(), 'public/oddly_motion_ad.mp4'));
  console.log(`✓ Copied to public/oddly_motion_ad.mp4`);
}

main().catch((err) => {
  console.error('\n[RENDER ERROR]', err);
  process.exit(1);
});
