const fs = require("fs");
const path = require("path");

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG content for each size
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000000"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 6}" fill="none" stroke="#ffffff" stroke-width="${Math.max(2, size / 64)}" opacity="1"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, size / 96)}" opacity="0.7"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, size / 128)}" opacity="0.5"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${Math.max(3, size / 40)}" fill="#ffffff"/>
</svg>`;
}

// Create directories
const iconsDir = path.join(__dirname, "..", "public", "icons");
const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

console.log("📱 Generating PWA icons...\n");

// Create icon files
sizes.forEach((size) => {
  const svgContent = createIconSVG(size);

  // Save as PNG (SVG content with PNG extension for PWA compatibility)
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(pngPath, svgContent);
  console.log(`✓ Created icon-${size}x${size}.png`);
});

// Create app icon for Next.js
const appIconPath = path.join(__dirname, "..", "src", "app", "icon.svg");
fs.writeFileSync(appIconPath, createIconSVG(32));
console.log("✓ Created src/app/icon.svg");

// Create og-image
const ogImageContent = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <circle cx="600" cy="315" r="80" fill="none" stroke="#ffffff" stroke-width="8" opacity="1"/>
  <circle cx="600" cy="315" r="120" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.7"/>
  <circle cx="600" cy="315" r="160" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5"/>
  <circle cx="600" cy="315" r="12" fill="#ffffff"/>
  <text x="600" y="150" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="48" font-weight="bold">EchoVerse</text>
  <text x="600" y="480" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" opacity="0.8">Connect and share in the digital echo chamber</text>
</svg>`;

fs.writeFileSync(
  path.join(__dirname, "..", "public", "og-image.png"),
  ogImageContent,
);
console.log("✓ Created og-image.png");

// Create screenshots
const desktopScreenshot = `<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1280" height="720" fill="#f8f9fa"/>
  <rect width="1280" height="80" fill="#000000"/>
  <text x="640" y="50" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="bold">EchoVerse</text>
  <rect x="100" y="120" width="400" height="500" fill="#ffffff" stroke="#e5e7eb" rx="16"/>
  <rect x="780" y="120" width="400" height="500" fill="#ffffff" stroke="#e5e7eb" rx="16"/>
  <text x="640" y="400" text-anchor="middle" fill="#6b7280" font-family="system-ui, sans-serif" font-size="16">EchoVerse Desktop</text>
</svg>`;

const mobileScreenshot = `<svg width="390" height="844" viewBox="0 0 390 844" xmlns="http://www.w3.org/2000/svg">
  <rect width="390" height="844" fill="#f8f9fa"/>
  <rect width="390" height="100" fill="#000000"/>
  <text x="195" y="65" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="18" font-weight="bold">EchoVerse</text>
  <rect x="20" y="130" width="350" height="600" fill="#ffffff" stroke="#e5e7eb" rx="16"/>
  <text x="195" y="420" text-anchor="middle" fill="#6b7280" font-family="system-ui, sans-serif" font-size="14">EchoVerse Mobile</text>
</svg>`;

fs.writeFileSync(
  path.join(screenshotsDir, "desktop-home.png"),
  desktopScreenshot,
);
fs.writeFileSync(
  path.join(screenshotsDir, "mobile-home.png"),
  mobileScreenshot,
);
console.log("✓ Created PWA screenshots");

console.log("\n🎉 All PWA assets generated!");
console.log(`✓ ${sizes.length} icon files created`);
console.log("✓ App icon for Next.js created");
console.log("✓ OpenGraph image created");
console.log("✓ PWA screenshots created");
console.log("\n💡 Note: Icons contain SVG content for compatibility");
