#!/usr/bin/env node

/**
 * Dopadaily Asset Generator
 * Generates logos, favicons, and OG images for the app
 * 
 * Usage: node scripts/generate-assets.js
 * 
 * Requirements: 
 *   npm install sharp (for PNG generation)
 * 
 * This script generates:
 *   - SVG logos (full logo, icon only, dark/light variants)
 *   - Favicons (16x16, 32x32, 48x48)
 *   - Apple touch icons (180x180)
 *   - Android icons (192x192, 512x512)
 *   - OG images (1200x630)
 *   - Twitter images (1200x600)
 */

const fs = require('fs');
const path = require('path');

// Brand colors from globals.css
const COLORS = {
  primary: '#b89c86',
  primaryLight: '#c9b09d',
  primaryDark: '#a68977',
  secondary: '#9c8776',
  accent: '#cbb7c9',
  surface: '#e9ddcf',
  surfaceElevated: '#f5efe7',
  onPrimary: '#ffffff',
  onSurface: '#2b231e',
  onSurfaceSecondary: '#5a4d45',
};

// Brain icon SVG path (inspired by lucide-react Brain icon)
const BRAIN_PATH = `
  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M6.401 6.5a3 3 0 0 1-.399-1.375" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 5.5v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
`;

// Simplified brain for smaller icons
const BRAIN_PATH_SIMPLE = `
  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 5.5v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
`;

// Dopadaily wordmark with custom styling
function generateWordmark(color = COLORS.onSurface) {
  return `
    <text x="44" y="28" font-family="Montserrat, system-ui, sans-serif" font-size="20" font-weight="700" fill="${color}">
      Dopadaily
    </text>
  `;
}

/**
 * Generate the main logo SVG (icon + wordmark)
 */
function generateFullLogoSVG(variant = 'default') {
  const bgColor = variant === 'dark' ? COLORS.onSurface : 'transparent';
  const iconBg = COLORS.primary;
  const iconColor = COLORS.onPrimary;
  const textColor = variant === 'dark' ? COLORS.surfaceElevated : COLORS.onSurface;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" width="160" height="40">
  ${variant === 'dark' ? `<rect width="160" height="40" fill="${bgColor}" rx="8"/>` : ''}
  <!-- Icon background -->
  <rect x="4" y="4" width="32" height="32" rx="8" fill="${iconBg}"/>
  <!-- Brain icon -->
  <g transform="translate(8, 8)" color="${iconColor}">
    ${BRAIN_PATH_SIMPLE}
  </g>
  <!-- Wordmark -->
  <text x="44" y="26" font-family="Montserrat, system-ui, sans-serif" font-size="18" font-weight="700" fill="${textColor}">
    Dopadaily
  </text>
</svg>`;
}

/**
 * Generate icon-only SVG (for favicon base)
 */
function generateIconSVG(size = 512, variant = 'default') {
  const padding = size * 0.1;
  const iconSize = size - (padding * 2);
  const cornerRadius = size * 0.2;

  const bgColor = variant === 'monochrome' ? COLORS.onSurface : COLORS.primary;
  const iconColor = COLORS.onPrimary;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="${bgColor}"/>
  <!-- Brain icon -->
  <g transform="translate(${padding}, ${padding}) scale(${iconSize / 24})" color="${iconColor}">
    ${BRAIN_PATH_SIMPLE}
  </g>
</svg>`;
}

/**
 * Generate OG image SVG (1200x630)
 */
function generateOGImageSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <!-- Gradient background -->
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.surface}"/>
      <stop offset="50%" style="stop-color:${COLORS.surfaceElevated}"/>
      <stop offset="100%" style="stop-color:${COLORS.surface}"/>
    </linearGradient>
    <!-- Decorative pattern -->
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="2" fill="${COLORS.primary}" opacity="0.15"/>
    </pattern>
    <!-- Glow effect -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  
  <!-- Decorative circles -->
  <circle cx="100" cy="530" r="200" fill="${COLORS.accent}" opacity="0.2"/>
  <circle cx="1100" cy="100" r="150" fill="${COLORS.primary}" opacity="0.15"/>
  
  <!-- Logo container -->
  <g transform="translate(500, 180)">
    <!-- Icon background with glow -->
    <rect x="0" y="0" width="200" height="200" rx="40" fill="${COLORS.primary}" filter="url(#glow)"/>
    <!-- Brain icon -->
    <g transform="translate(25, 25) scale(6.25)" color="${COLORS.onPrimary}">
      ${BRAIN_PATH_SIMPLE}
    </g>
  </g>
  
  <!-- Text -->
  <text x="600" y="450" text-anchor="middle" font-family="Montserrat, system-ui, sans-serif" font-size="72" font-weight="700" fill="${COLORS.onSurface}">
    Dopadaily
  </text>
  <text x="600" y="510" text-anchor="middle" font-family="DM Sans, system-ui, sans-serif" font-size="28" font-weight="400" fill="${COLORS.onSurfaceSecondary}">
    Focus • Wellness • Productivity
  </text>
  
  <!-- Bottom accent bar -->
  <rect x="0" y="610" width="1200" height="20" fill="${COLORS.primary}"/>
</svg>`;
}

/**
 * Generate Twitter card image (1200x600 - slightly different ratio)
 */
function generateTwitterImageSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <linearGradient id="tw-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.surface}"/>
      <stop offset="100%" style="stop-color:${COLORS.surfaceElevated}"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="600" fill="url(#tw-bg-gradient)"/>
  
  <!-- Left side - Icon -->
  <g transform="translate(200, 150)">
    <rect width="180" height="180" rx="36" fill="${COLORS.primary}"/>
    <g transform="translate(22, 22) scale(5.67)" color="${COLORS.onPrimary}">
      ${BRAIN_PATH_SIMPLE}
    </g>
  </g>
  
  <!-- Right side - Text -->
  <text x="500" y="240" font-family="Montserrat, system-ui, sans-serif" font-size="64" font-weight="700" fill="${COLORS.onSurface}">
    Dopadaily
  </text>
  <text x="500" y="300" font-family="DM Sans, system-ui, sans-serif" font-size="24" font-weight="400" fill="${COLORS.onSurfaceSecondary}">
    A therapeutic productivity app for
  </text>
  <text x="500" y="340" font-family="DM Sans, system-ui, sans-serif" font-size="24" font-weight="400" fill="${COLORS.onSurfaceSecondary}">
    focus and mental wellness
  </text>
  
  <!-- Decorative elements -->
  <circle cx="1050" cy="450" r="100" fill="${COLORS.accent}" opacity="0.3"/>
  <rect x="0" y="580" width="1200" height="20" fill="${COLORS.primary}"/>
</svg>`;
}

/**
 * Generate Apple touch icon (with proper padding)
 */
function generateAppleTouchIconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="${COLORS.primary}"/>
  <g transform="translate(30, 30) scale(5)" color="${COLORS.onPrimary}">
    ${BRAIN_PATH_SIMPLE}
  </g>
</svg>`;
}

/**
 * Generate site.webmanifest content
 */
function generateWebManifest() {
  return JSON.stringify({
    name: 'Dopadaily',
    short_name: 'Dopadaily',
    description: 'A therapeutic productivity app for focus and mental wellness',
    start_url: '/',
    display: 'standalone',
    background_color: COLORS.surface,
    theme_color: COLORS.primary,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }, null, 2);
}

/**
 * Generate browserconfig.xml for Windows tiles
 */
function generateBrowserConfig() {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>${COLORS.primary}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

// Main execution
async function main() {
  const publicDir = path.join(__dirname, '..', 'public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('🎨 Generating Dopadaily assets...\n');

  // Generate SVG files
  const svgAssets = [
    { name: 'logo.svg', content: generateFullLogoSVG('default') },
    { name: 'logo-dark.svg', content: generateFullLogoSVG('dark') },
    { name: 'icon.svg', content: generateIconSVG(512, 'default') },
    { name: 'og-image.svg', content: generateOGImageSVG() },
    { name: 'twitter-image.svg', content: generateTwitterImageSVG() },
    { name: 'apple-touch-icon.svg', content: generateAppleTouchIconSVG() },
  ];

  for (const asset of svgAssets) {
    const filePath = path.join(publicDir, asset.name);
    fs.writeFileSync(filePath, asset.content.trim());
    console.log(`✅ Generated ${asset.name}`);
  }

  // Generate favicon.svg (browser-compatible)
  const faviconSVG = generateIconSVG(32, 'default');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG.trim());
  console.log('✅ Generated favicon.svg');

  // Generate site.webmanifest
  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    generateWebManifest()
  );
  console.log('✅ Generated site.webmanifest');

  // Generate browserconfig.xml
  fs.writeFileSync(
    path.join(publicDir, 'browserconfig.xml'),
    generateBrowserConfig()
  );
  console.log('✅ Generated browserconfig.xml');

  console.log('\n📁 SVG assets generated in /public\n');

  // Check if sharp is available for PNG generation
  try {
    const sharp = require('sharp');
    console.log('🖼️  Generating PNG assets with sharp...\n');

    const pngSizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'favicon-48x48.png', size: 48 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
      { name: 'mstile-150x150.png', size: 150 },
    ];

    for (const { name, size } of pngSizes) {
      const svgContent = generateIconSVG(size, 'default');
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      console.log(`✅ Generated ${name}`);
    }

    // Generate OG image PNG (1200x630)
    const ogSvg = generateOGImageSVG();
    await sharp(Buffer.from(ogSvg))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✅ Generated og-image.png');

    // Generate Twitter image PNG (1200x600)
    const twitterSvg = generateTwitterImageSVG();
    await sharp(Buffer.from(twitterSvg))
      .resize(1200, 600)
      .png()
      .toFile(path.join(publicDir, 'twitter-image.png'));
    console.log('✅ Generated twitter-image.png');

    // Generate favicon.ico (multi-size)
    const favicon16 = await sharp(Buffer.from(generateIconSVG(16)))
      .resize(16, 16)
      .png()
      .toBuffer();
    const favicon32 = await sharp(Buffer.from(generateIconSVG(32)))
      .resize(32, 32)
      .png()
      .toBuffer();
    const favicon48 = await sharp(Buffer.from(generateIconSVG(48)))
      .resize(48, 48)
      .png()
      .toBuffer();

    // For .ico, we'll just use the 32x32 PNG renamed
    // (proper .ico generation would require additional dependencies)
    await sharp(Buffer.from(generateIconSVG(32)))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✅ Generated favicon.ico (32x32)');

    console.log('\n🎉 All PNG assets generated!\n');

  } catch (err) {
    console.log('\n⚠️  sharp not installed. To generate PNG files, run:');
    console.log('   npm install sharp\n');
    console.log('Then run this script again.\n');
    console.log('For now, you can use the SVG files directly or convert them');
    console.log('using an online tool like https://realfavicongenerator.net\n');
  }

  console.log('📝 Next steps:');
  console.log('   1. Install sharp for PNG generation: npm install sharp');
  console.log('   2. Run this script again: node scripts/generate-assets.js');
  console.log('   3. Update layout.tsx with the new meta tags\n');
}

main().catch(console.error);
