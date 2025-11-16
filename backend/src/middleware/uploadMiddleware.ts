/**
 * Upload Middleware - Phase 3.1
 * Multer 檔案上傳中介軟體配置
 */

import multer from 'multer';
import { Request } from 'express';

/**
 * Multer 記憶體儲存配置
 * 檔案會先儲存在記憶體中，由 ImageService 處理後再寫入磁碟
 */
const storage = multer.memoryStorage();

/**
 * 檔案過濾器：僅允許圖片
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  // 允許的 MIME 類型
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/bmp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // 接受檔案
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`));
  }
}

/**
 * Multer 上傳配置
 */
export const uploadImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 2, // RGB + Thermal = 2 files
  },
}).fields([
  { name: 'rgbImage', maxCount: 1 },
  { name: 'thermalImage', maxCount: 1 },
]);

/**
 * 錯誤處理中介軟體
 * 處理 Multer 上傳錯誤
 */
export function handleUploadError(
  error: any,
  _req: Request,
  res: any,
  next: any
): void {
  if (error instanceof multer.MulterError) {
    // Multer 特定錯誤
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 10MB per file.',
      });
      return;
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 2 files (RGB + Thermal).',
      });
      return;
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "rgbImage" and "thermalImage".',
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
    return;
  }

  // 自定義檔案過濾錯誤
  if (error.message && error.message.includes('Invalid file type')) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
    return;
  }

  // 其他錯誤傳遞給下一個中介軟體
  next(error);
}
