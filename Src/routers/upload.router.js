"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const Auth_middleware_1 = require("../middleware/Auth.middleware");
const multer_config_1 = __importDefault(require("../config/multer.config"));
const router = express_1.default.Router();
// Avatar routes
router.post('/users/:id/avatar', Auth_middleware_1.authenticate, multer_config_1.default.single('avatar'), user_controller_1.uploadAvatar);
router.delete('/users/:id/avatar', Auth_middleware_1.authenticate, user_controller_1.deleteAvatar);
exports.default = router;
//# sourceMappingURL=upload.router.js.map