import multer from 'multer';

export const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
