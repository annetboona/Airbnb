"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = exports.createUserScema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserScema = zod_1.default.object({
    name: zod_1.default.string().min(2, "Name must be at least 2 characters long"),
    email: zod_1.default.string().email("Invalid email format"),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters long"),
    phone: zod_1.default.string().min(10, "Phone number must be at least 10 digits long"),
});
exports.createUserSchema = exports.createUserScema.partial();
//# sourceMappingURL=validator.user.js.map