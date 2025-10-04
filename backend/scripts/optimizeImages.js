#!/usr/bin/env node

const imageOptimizer = require('../utils/imageOptimizer');
const path = require('path');

/**
 * Script to optimize all existing images in uploads directory
 * Run with: node scripts/optimizeImages.js
 */

async function main() {
  console.log('🚀 Starting image optimization...\n');

  const directories = [
    path.join(__dirname, '../uploads/ads'),
    path.join(__dirname, '../uploads/avatars'),
    path.join(__dirname, '../uploads/business-licenses')
  ];

  let totalOptimized = 0;

  for (const dir of directories) {
    console.log(`📁 Processing directory: ${path.basename(dir)}`);
    try {
      const count = await imageOptimizer.batchOptimize(dir);
      totalOptimized += count;
      console.log(`✅ Optimized ${count} images in ${path.basename(dir)}\n`);
    } catch (error) {
      console.error(`❌ Error processing ${dir}:`, error.message, '\n');
    }
  }

  console.log(`🎉 Complete! Total images optimized: ${totalOptimized}`);
}

main().catch(console.error);
