const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"), // Adjusted path to be relative to this file
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume-${req.userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
