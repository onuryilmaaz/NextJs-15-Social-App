#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Next.js bundle...\n');

// Install bundle analyzer if not present
try {
  require('@next/bundle-analyzer');
} catch (e) {
  console.log('📦 Installing bundle analyzer...');
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Create temporary next.config for analysis
const originalConfig = path.join(process.cwd(), 'next.config.mjs');
const tempConfig = path.join(process.cwd(), 'next.config.analyze.mjs');

const analyzeConfig = `
import { withBundleAnalyzer } from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: true,
});

const nextConfig = {
  // Your existing config
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: \`/f/\${process.env.UPLOADTHING_APP_ID}/*\`,
      },
    ],
  },
  // Bundle analysis optimizations
  webpack: (config, { isServer }) => {
    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve('./src'),
    };

    // Tree shaking for lodash
    if (!isServer) {
      config.resolve.alias['lodash'] = 'lodash-es';
    }

    return config;
  },
};

export default bundleAnalyzer(nextConfig);
`;

// Write temporary config
fs.writeFileSync(tempConfig, analyzeConfig);

try {
  console.log('🏗️  Building with analysis...');
  
  // Run build with analysis
  execSync(\`NEXT_CONFIG_FILE=\${tempConfig} npm run build\`, { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('📊 Check the opened browser tabs for detailed analysis');
  
  // Generate size report
  const buildDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(buildDir, 'static');
  
  if (fs.existsSync(staticDir)) {
    console.log('\n📈 Bundle Size Summary:');
    
    const getDirectorySize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      }
      
      return size;
    };
    
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const totalSize = getDirectorySize(staticDir);
    console.log(\`Total static assets: \${formatBytes(totalSize)}\`);
    
    // Check for large files
    const checkLargeFiles = (dir, threshold = 500 * 1024) => { // 500KB threshold
      const files = fs.readdirSync(dir);
      const largeFiles = [];
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          largeFiles.push(...checkLargeFiles(filePath, threshold));
        } else if (stats.size > threshold) {
          largeFiles.push({
            path: path.relative(process.cwd(), filePath),
            size: stats.size
          });
        }
      }
      
      return largeFiles;
    };
    
    const largeFiles = checkLargeFiles(staticDir);
    if (largeFiles.length > 0) {
      console.log('\n⚠️  Large files detected (>500KB):');
      largeFiles.forEach(file => {
        console.log(\`  \${file.path}: \${formatBytes(file.size)}\`);
      });
    }
  }
  
  // Optimization recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('  • Use dynamic imports for heavy components');
  console.log('  • Implement code splitting for routes');
  console.log('  • Optimize images with WebP format');
  console.log('  • Consider removing unused dependencies');
  console.log('  • Use tree shaking for large libraries');
  
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
} finally {
  // Clean up temporary config
  if (fs.existsSync(tempConfig)) {
    fs.unlinkSync(tempConfig);
  }
}

console.log('\n🎉 Analysis complete!'); 