const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Use memory storage for serverless environments (e.g. Vercel)
const storage = multer.memoryStorage();

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
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(415).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    try {
      const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extensions = {
        'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
        'application/pdf': '.pdf', 'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'text/plain': '.txt'
      };
      
      const ext = extensions[req.file.mimetype] || '';
      const filename = `file-${uniqueSuffix}${ext}`;
      
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: req.file.mimetype,
        metadata: {
          originalName: req.file.originalname,
          contentType: req.file.mimetype,
          uploadedBy: req.user._id,
          institution: req.user.institution || null
        }
      });
      
      uploadStream.end(req.file.buffer);
      
      uploadStream.on('finish', () => {
        const fileUrl = `/api/upload/file/${filename}`;
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
      
      uploadStream.on('error', (uploadErr) => {
        console.error('GridFS Upload Error:', uploadErr);
        res.status(500).json({ success: false, error: 'Failed to upload file to database' });
      });
    } catch (dbError) {
      console.error('Database Error:', dbError);
      res.status(500).json({ success: false, error: 'Database connection error during upload' });
    }
  });
};

exports.getFile = async (req, res) => {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    const files = await bucket.find({ filename: req.params.filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    const file = files[0];
    const fileInstitution = file.metadata?.institution?.toString();
    const userInstitution = req.user.institution?.toString();
    const isOwner = file.metadata?.uploadedBy?.toString() === req.user.id;
    const sameInstitution = Boolean(fileInstitution && userInstitution && fileInstitution === userInstitution);
    if (!isOwner && req.user.role !== 'admin' && !sameInstitution) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this file' });
    }
    const downloadName = path.basename(file.metadata?.originalName || file.filename).replace(/[^\w .()-]/g, '_');
    res.setHeader('Content-Type', file.contentType || file.metadata?.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    bucket.openDownloadStreamByName(req.params.filename).pipe(res);
  } catch (err) {
    console.error('File Download Error:', err);
    res.status(500).json({ success: false, error: 'Error downloading file' });
  }
};
