import multer from 'multer';
const storage = multer.memoryStorage();
function fileFilter(req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed (jpeg, png, webp, gif)"));
    }
}
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
export default upload;
//# sourceMappingURL=multer.config.js.map