// Generate favicon and PWA icons from yummy_icon.jpg
// Requires: npm install sharp --save-dev
// Run: node scripts/generate-icons.js

import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");
const scriptsDir = join(rootDir, "scripts");
const iconSource = join(scriptsDir, "yummy_icon.jpg");

// Icon sizes to generate
const iconSizes = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 192, name: "pwa-192x192.png" },
  { size: 512, name: "pwa-512x512.png" },
  { size: 180, name: "apple-touch-icon.png" }, // For iOS
];

async function generateIcons() {
  try {
    console.log("Generating icons from yummy_icon.jpg...\n");

    // Generate all PNG icons
    for (const { size, name } of iconSizes) {
      const outputPath = join(publicDir, name);
      await sharp(iconSource)
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    // Generate favicon.ico (using 32x32 as base)
    // Note: sharp doesn't create true ICO files, but modern browsers accept PNG as favicon.ico
    const faviconPath = join(publicDir, "favicon.ico");
    await sharp(iconSource)
      .resize(32, 32, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toFile(faviconPath);
    console.log(`✓ Generated favicon.ico (32x32)`);

    console.log("\n✓ All icons generated successfully!");
    console.log("\nIcons generated:");
    console.log("  - favicon.ico (browser favicon)");
    console.log("  - favicon-16x16.png");
    console.log("  - favicon-32x32.png");
    console.log("  - pwa-192x192.png (PWA icon)");
    console.log("  - pwa-512x512.png (PWA icon)");
    console.log("  - apple-touch-icon.png (iOS home screen)");
  } catch (error) {
    console.error("Error generating icons:", error.message);
    console.log("\nNote: Install sharp first: npm install sharp --save-dev");
    process.exit(1);
  }
}

generateIcons();
