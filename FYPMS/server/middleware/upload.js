const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

// 1. Storage for Profile Pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || 'unknown';
    cb(null, `profile_${userId}_${uniqueSuffix}${ext}`);
  }
});

// 2. Storage for CSV files (Bulk User Import)
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const adminId = req.user?.id || 'unknown';
    cb(null, `bulk_users_${adminId}_${uniqueSuffix}.csv`);
  }
});

// 3. Storage for PDF files (Milestone Templates and Submissions)
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user?.id || 'unknown';
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `pdf_${userId}_${uniqueSuffix}_${originalName}`);
  }
});

// 4. Storage for Proposal PDFs (Specific directory)
const proposalPdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const propUploadDir = path.join(uploadDir, 'proposals');
    if (!fs.existsSync(propUploadDir)) {
      fs.mkdirSync(propUploadDir, { recursive: true });
    }
    cb(null, propUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `proposal-${uniqueSuffix}.pdf`);
  }
});

// 5. Storage for Defense Submissions (PDF & PPTX)
const defenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const defenseUploadDir = path.join(uploadDir, 'defense');
    if (!fs.existsSync(defenseUploadDir)) {
      fs.mkdirSync(defenseUploadDir, { recursive: true });
    }
    cb(null, defenseUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const proposalId = req.body.proposal_id || 'unknown';
    cb(null, `defense_${proposalId}_${uniqueSuffix}${ext}`);
  }
});

// --- FILE FILTERS ---

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed.'), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'), false);
  }
};

// --- MULTER INSTANCES ---

const upload = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadProposalPDF = multer({
  storage: proposalPdfStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadDefense = multer({
  storage: defenseStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

const deleteOldProfilePicture = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting old profile picture:', err);
    });
  }
};

module.exports = {
  upload,
  uploadCSV,
  uploadPDF,
  uploadProposalPDF,
  uploadDefense,
  handleUploadError,
  deleteOldProfilePicture
};
