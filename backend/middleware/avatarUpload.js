const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed image MIME types for avatars
const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

// Configure storage for avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
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
    cb(null, 'avatar-' + uniqueSuffix + extension);
  }
});

// File filter for avatars
const fileFilter = (req, file, cb) => {
  // Check MIME type first
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed for avatars!'), false);
  }

  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Invalid file extension. Only JPG, PNG, WEBP, and GIF are allowed.'), false);
  }

  cb(null, true);
};

// Create multer upload instance for avatars
const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for avatars
    files: 1 // Only one avatar per request
  },
  fileFilter: fileFilter
});

module.exports = {
  avatarUpload
};
