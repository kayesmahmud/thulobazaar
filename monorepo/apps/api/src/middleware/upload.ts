import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

// Ensure upload directories exist
const uploadsDir = path.resolve(config.UPLOAD_DIR);
const avatarsDir = path.join(uploadsDir, 'avatars');
const coversDir = path.join(uploadsDir, 'covers');
const adsDir = path.join(uploadsDir, 'ads');
const documentsDir = path.join(uploadsDir, 'documents');
const messagesDir = path.join(uploadsDir, 'messages');
const businessVerificationDir = path.join(uploadsDir, 'business_verification');
const individualVerificationDir = path.join(uploadsDir, 'individual_verification');

[avatarsDir, coversDir, adsDir, documentsDir, messagesDir, businessVerificationDir, individualVerificationDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter for images only
const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

// Avatar upload configuration
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Cover photo upload configuration
const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `cover-${uniqueSuffix}${ext}`);
  },
});

export const uploadCover = multer({
  storage: coverStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for cover photos
  },
  fileFilter: imageFilter,
});

// Ad images upload configuration
const adImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, adsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
  },
});

export const uploadAdImages = multer({
  storage: adImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
  },
  fileFilter: imageFilter,
});

// Document upload configuration
const documentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, documentsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  },
});

// Message image upload configuration
const messageImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, messagesDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || 'unknown';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `msg_${userId}_${timestamp}_${randomStr}${ext}`);
  },
});

export const uploadMessageImage = multer({
  storage: messageImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFilter,
});

// Business verification document upload configuration
const businessVerificationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, businessVerificationDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `biz-${timestamp}-${random}${ext}`);
  },
});

export const uploadBusinessVerification = multer({
  storage: businessVerificationStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      // Also check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WEBP, HEIC) and PDF files are allowed'));
      }
    }
  },
});

// Individual verification document upload configuration
const individualVerificationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, individualVerificationDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Determine file type based on field name
    const fieldName = file.fieldname;
    let prefix = 'id';
    if (fieldName === 'id_document_front') prefix = 'id-front';
    else if (fieldName === 'id_document_back') prefix = 'id-back';
    else if (fieldName === 'selfie_with_id') prefix = 'selfie';
    cb(null, `${prefix}-${timestamp}-${random}${ext}`);
  },
});

export const uploadIndividualVerification = multer({
  storage: individualVerificationStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      // Also check file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf'];
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, WEBP, HEIC) and PDF files are allowed'));
      }
    }
  },
});
