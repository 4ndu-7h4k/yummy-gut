// Simple script to generate PWA icons from SVG
// Requires: npm install sharp --save-dev
// Run: node scripts/generate-icons.js

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const iconSvg = join(publicDir, 'icon.svg');

const sizes = [192, 512];

async function generateIcons() {
  try {
    const svgBuffer = readFileSync(iconSvg);
    
    for (const size of sizes) {
      const outputPath = join(publicDir, `pwa-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    }
    
    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error.message);
    console.log('\nNote: Install sharp first: npm install sharp --save-dev');
    process.exit(1);
  }
}

generateIcons();

