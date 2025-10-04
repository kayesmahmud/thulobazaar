const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageOptimizer {
  constructor() {
    this.sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 800, height: 800 },
      large: { width: 1200, height: 1200 }
    };

    this.quality = {
      jpeg: 80,
      webp: 80,
      png: 80
    };
  }

  /**
   * Optimize and resize image to multiple sizes
   * @param {string} inputPath - Path to original image
   * @param {string} outputDir - Directory to save optimized images
   * @param {string} filename - Base filename without extension
   * @returns {Promise<Object>} - Object with paths to all generated images
   */
  async optimizeImage(inputPath, outputDir, filename) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      const ext = path.extname(inputPath).toLowerCase();

      // Create output directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });

      const results = {
        original: inputPath,
        sizes: {}
      };

      // Generate optimized versions for each size
      for (const [sizeName, dimensions] of Object.entries(this.sizes)) {
        const outputFilename = `${filename}-${sizeName}${ext}`;
        const outputPath = path.join(outputDir, outputFilename);

        await image
          .clone()
          .resize(dimensions.width, dimensions.height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: this.quality.jpeg, progressive: true })
          .png({ quality: this.quality.png, compressionLevel: 9 })
          .toFile(outputPath);

        results.sizes[sizeName] = outputFilename;
      }

      // Also create WebP versions for better compression
      const webpFilename = `${filename}.webp`;
      const webpPath = path.join(outputDir, webpFilename);

      await image
        .clone()
        .resize(this.sizes.medium.width, this.sizes.medium.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: this.quality.webp })
        .toFile(webpPath);

      results.webp = webpFilename;

      return results;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      throw new Error(`Image optimization failed: ${error.message}`);
    }
  }

  /**
   * Optimize existing image in place
   * @param {string} imagePath - Path to image to optimize
   * @returns {Promise<void>}
   */
  async optimizeInPlace(imagePath) {
    try {
      const tempPath = `${imagePath}.temp`;
      const ext = path.extname(imagePath).toLowerCase();

      const image = sharp(imagePath);

      if (ext === '.jpg' || ext === '.jpeg') {
        await image
          .jpeg({ quality: this.quality.jpeg, progressive: true })
          .toFile(tempPath);
      } else if (ext === '.png') {
        await image
          .png({ quality: this.quality.png, compressionLevel: 9 })
          .toFile(tempPath);
      } else if (ext === '.webp') {
        await image
          .webp({ quality: this.quality.webp })
          .toFile(tempPath);
      }

      // Replace original with optimized version
      await fs.rename(tempPath, imagePath);

      console.log(`✅ Optimized image: ${path.basename(imagePath)}`);
    } catch (error) {
      console.error('❌ Error optimizing image in place:', error);
      throw error;
    }
  }

  /**
   * Batch optimize all images in a directory
   * @param {string} directory - Directory containing images to optimize
   * @returns {Promise<number>} - Number of images optimized
   */
  async batchOptimize(directory) {
    try {
      const files = await fs.readdir(directory);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      });

      let count = 0;
      for (const file of imageFiles) {
        const filePath = path.join(directory, file);
        try {
          await this.optimizeInPlace(filePath);
          count++;
        } catch (error) {
          console.error(`Failed to optimize ${file}:`, error.message);
        }
      }

      return count;
    } catch (error) {
      console.error('❌ Batch optimization error:', error);
      throw error;
    }
  }

  /**
   * Get image dimensions
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} - Image metadata
   */
  async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('❌ Error getting image info:', error);
      throw error;
    }
  }
}

module.exports = new ImageOptimizer();
