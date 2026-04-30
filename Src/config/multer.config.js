"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
function fileFilter(req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed (jpeg, png, webp, gif)"));
    }
}
const upload = (0, multer_1.default)({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
exports.default = upload;
//# sourceMappingURL=multer.config.js.map