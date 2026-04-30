import express from 'express';
import { uploadAvatar, deleteAvatar } from '../controllers/user.controller';
import { authenticate } from '../middleware/Auth.middleware';
import upload from "../config/multer.config"

const router = express.Router();

// Avatar routes
router.post('/users/:id/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.delete('/users/:id/avatar', authenticate, deleteAvatar);

export default router;