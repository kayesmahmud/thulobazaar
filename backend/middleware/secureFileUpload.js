const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');
const { FILE_LIMITS } = require('../config/constants');

// Allowed image MIME types (based on magic numbers)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/ads';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'ad-' + uniqueSuffix + extension);
  }
});

// Basic file filter (first line of defense - fast check)
const fileFilter = (req, file, cb) => {
  // Check MIME type first (fast check)
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only JPG, PNG, WEBP, and GIF are allowed.'), false);
  }

  cb(null, true);
};

// Magic number validation middleware (second line of defense - thorough check)
// This runs AFTER the file is uploaded to temp storage
const validateFileType = async (req, res, next) => {
  try {
    // If no files uploaded, skip validation
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Validate each uploaded file
    for (const file of req.files) {
      try {
        // Read the first 4100 bytes to determine file type
        const buffer = await fs.promises.readFile(file.path);
        const fileType = await fileTypeFromBuffer(buffer);

        // If we can't detect the file type, reject it
        if (!fileType) {
          // Delete the uploaded file
          await fs.promises.unlink(file.path);
          return res.status(400).json({
            success: false,
            message: `Unable to determine file type for ${file.originalname}. File rejected for security.`
          });
        }

        // Check if the detected MIME type is allowed
        if (!ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
          // Delete the uploaded file
          await fs.promises.unlink(file.path);
          return res.status(400).json({
            success: false,
            message: `File type ${fileType.mime} is not allowed. Only images (JPEG, PNG, WEBP, GIF) are permitted.`,
            detectedType: fileType.mime,
            fileName: file.originalname
          });
        }

        // Verify the extension matches the actual file type
        const expectedExtensions = {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/webp': ['.webp'],
          'image/gif': ['.gif']
        };

        const actualExtension = path.extname(file.originalname).toLowerCase();
        const validExtensions = expectedExtensions[fileType.mime] || [];

        if (!validExtensions.includes(actualExtension)) {
          // Delete the uploaded file
          await fs.promises.unlink(file.path);
          return res.status(400).json({
            success: false,
            message: `File extension mismatch. File claims to be ${actualExtension} but is actually ${fileType.ext}`,
            detectedType: fileType.mime,
            fileName: file.originalname
          });
        }

        console.log(`✅ File validated: ${file.originalname} (${fileType.mime})`);
      } catch (fileError) {
        console.error(`❌ Error validating file ${file.originalname}:`, fileError);
        // Delete the file if it exists
        try {
          await fs.promises.unlink(file.path);
        } catch (unlinkError) {
          // File might already be deleted
        }
        return res.status(400).json({
          success: false,
          message: `Error validating file: ${file.originalname}`
        });
      }
    }

    // All files are valid
    next();
  } catch (error) {
    console.error('❌ File validation error:', error);

    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.promises.unlink(file.path);
        } catch (unlinkError) {
          // Ignore cleanup errors
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: 'File validation failed'
    });
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_LIMITS.MAX_FILE_SIZE,
    files: FILE_LIMITS.MAX_FILES_PER_AD
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  validateFileType
};
