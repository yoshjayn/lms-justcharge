// import multer from "multer";

// const storage = multer.diskStorage({})

// const upload = multer({ storage })

// export default upload

// --------------------------------------------------------------

import multer from "multer";
import path from "path";

// Configure storage
const storage = multer.diskStorage({
  // You can specify destination if needed
  // destination: function (req, file, cb) {
  //   cb(null, 'uploads/') // Make sure this directory exists
  // },
  filename: function (req, file, cb) {
    // Generate unique filename
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance with enhanced config
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export default upload;