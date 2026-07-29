const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Local disk uploads are only supported during development. Vercel's function
// filesystem is read-only, so creating this directory at module-load time would
// crash every API route, even routes that do not upload a file.
const usesServerlessFilesystem = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const uploadDir = path.join(__dirname, '../uploads');
if (!usesServerlessFilesystem && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extensions = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
      'application/pdf': '.pdf', 'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt'
    };
    cb(null, `file-${uniqueSuffix}${extensions[file.mimetype]}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX and TXT files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 4 }, // 10MB, one file
  fileFilter: fileFilter
}).single('file');

exports.uploadFile = (req, res) => {
  if (usesServerlessFilesystem) {
    return res.status(503).json({ success: false, error: 'File uploads require a configured private object-storage provider in production.' });
  }
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(415).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    // Return the URL path
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        fileUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });
  });
};
