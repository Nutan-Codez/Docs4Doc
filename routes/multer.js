const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Directory to store files
    },
    filename: function (req, file, cb) {
        const unique = uuidv4();
        cb(null, unique + path.extname(file.originalname)); // File name with unique ID
    }
});

// File filter to accept only PDF files
const fileFilter = (req, file, cb) => {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Set up multer with storage and file filter
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;
