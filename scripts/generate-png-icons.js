const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG content for each size
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000000"/>
  
  <!-- Main echo circles -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 6}" fill="none" stroke="#ffffff" stroke-width="${Math.max(2, size / 64)}" opacity="1"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, size / 96)}" opacity="0.7"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="none" stroke="#ffffff" stroke-width="${Math.max(1, size / 128)}" opacity="0.5"/>
  
  <!-- Central dot -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${Math.max(3, size / 40)}" fill="#ffffff"/>
  
  <!-- Corner echo dots for larger icons -->
  ${
    size >= 144
      ? `
  <circle cx="${size / 4}" cy="${size / 4}" r="${Math.max(1, size / 64)}" fill="#ffffff" opacity="0.6"/>
  <circle cx="${(3 * size) / 4}" cy="${size / 4}" r="${Math.max(1, size / 64)}" fill="#ffffff" opacity="0.6"/>
  <circle cx="${size / 4}" cy="${(3 * size) / 4}" r="${Math.max(1, size / 64)}" fill="#ffffff" opacity="0.6"/>
  <circle cx="${(3 * size) / 4}" cy="${(3 * size) / 4}" r="${Math.max(1, size / 64)}" fill="#ffffff" opacity="0.6"/>
  `
      : ""
  }
</svg>`;
}

async function generatePNGIcons() {
  const iconsDir = path.join(__dirname, "..", "public", "icons");

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log("🖼️  Generating PNG icons with Sharp...\n");

  for (const size of sizes) {
    try {
      const svgContent = createIconSVG(size);
      const svgBuffer = Buffer.from(svgContent);

      // Convert SVG to PNG using Sharp
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png({
          quality: 100,
          compressionLevel: 6,
        })
        .toBuffer();

      // Save PNG file
      const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      fs.writeFileSync(pngPath, pngBuffer);

      console.log(
        `✅ Created icon-${size}x${size}.png (${Math.round(pngBuffer.length / 1024)}KB)`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to create icon-${size}x${size}.png:`,
        error.message,
      );
    }
  }

  // Create Apple touch icon (special 180x180 size)
  try {
    const svgContent = createIconSVG(180);
    const svgBuffer = Buffer.from(svgContent);

    const pngBuffer = await sharp(svgBuffer)
      .resize(180, 180)
      .png({ quality: 100 })
      .toBuffer();

    const appleTouchPath = path.join(iconsDir, "apple-touch-icon.png");
    fs.writeFileSync(appleTouchPath, pngBuffer);

    console.log(
      `✅ Created apple-touch-icon.png (${Math.round(pngBuffer.length / 1024)}KB)`,
    );
  } catch (error) {
    console.error("❌ Failed to create apple-touch-icon.png:", error.message);
  }

  // Create favicon.ico (16x16 and 32x32 combined)
  try {
    const favicon16 = await sharp(Buffer.from(createIconSVG(16)))
      .resize(16, 16)
      .png()
      .toBuffer();

    const favicon32 = await sharp(Buffer.from(createIconSVG(32)))
      .resize(32, 32)
      .png()
      .toBuffer();

    // For now, just save the 32x32 as favicon.png
    // Creating proper ICO requires additional libraries
    const faviconPath = path.join(__dirname, "..", "public", "favicon.png");
    fs.writeFileSync(faviconPath, favicon32);

    console.log(
      `✅ Created favicon.png (${Math.round(favicon32.length / 1024)}KB)`,
    );
  } catch (error) {
    console.error("❌ Failed to create favicon:", error.message);
  }

  // Create OG image
  try {
    const ogSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="630" fill="#000000"/>
      
      <!-- Main echo circles centered -->
      <circle cx="600" cy="315" r="80" fill="none" stroke="#ffffff" stroke-width="8" opacity="1"/>
      <circle cx="600" cy="315" r="120" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.7"/>
      <circle cx="600" cy="315" r="160" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.5"/>
      <circle cx="600" cy="315" r="200" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3"/>
      
      <!-- Central dot -->
      <circle cx="600" cy="315" r="12" fill="#ffffff"/>
      
      <!-- Text -->
      <text x="600" y="150" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold">EchoVerse</text>
      <text x="600" y="480" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" opacity="0.8">Connect and share in the digital echo chamber</text>
    </svg>`;

    const ogBuffer = await sharp(Buffer.from(ogSvg))
      .png({ quality: 90 })
      .toBuffer();

    const ogPath = path.join(__dirname, "..", "public", "og-image.png");
    fs.writeFileSync(ogPath, ogBuffer);

    console.log(
      `✅ Created og-image.png (${Math.round(ogBuffer.length / 1024)}KB)`,
    );
  } catch (error) {
    console.error("❌ Failed to create OG image:", error.message);
  }

  // Update Next.js app icon
  try {
    const appIconPath = path.join(__dirname, "..", "src", "app", "icon.png");
    const svgContent = createIconSVG(32);
    const svgBuffer = Buffer.from(svgContent);

    const pngBuffer = await sharp(svgBuffer)
      .resize(32, 32)
      .png({ quality: 100 })
      .toBuffer();

    fs.writeFileSync(appIconPath, pngBuffer);
    console.log(
      `✅ Created src/app/icon.png (${Math.round(pngBuffer.length / 1024)}KB)`,
    );
  } catch (error) {
    console.error("❌ Failed to create app icon:", error.message);
  }

  console.log("\n🎉 PNG icon generation completed!");
  console.log(
    "\n📱 All icons are now proper PNG files that work with PWA manifest",
  );
  console.log("💡 You can now test the PWA installation on mobile devices");
}

// Run the generation
generatePNGIcons().catch(console.error);
