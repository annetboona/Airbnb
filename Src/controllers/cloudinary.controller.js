"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = uploadAvatar;
const cloudinary_js_1 = require("../config/cloudinary.js");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
// POST /users/:id/avatar
// Uploads a profile picture for a user
// Multer middleware runs first and puts the file on req.file
// Then we upload the buffer to Cloudinary and save the URL to the database
async function uploadAvatar(req, res) {
    const id = parseInt(req.params["id"]);
    // req.file is set by Multer — if it's missing, no file was sent
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const user = await prisma_js_1.default.user.findUnique({ where: { id } });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    // Upload the buffer to Cloudinary under the "airbnb/avatars" folder
    const { url, publicId } = await (0, cloudinary_js_1.uploadToCloudinary)(req.file.buffer, "airbnb/avatars");
    // Save the Cloudinary URL to the user's record in the database
    const updated = await prisma_js_1.default.user.update({
        where: { id },
        data: { avatar: url },
    });
    res.json({ message: "Avatar uploaded successfully", avatar: url });
}
//# sourceMappingURL=cloudinary.controller.js.map