"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
const adapter = new adapter_pg_1.PrismaPg({ pool });
const prisma = new client_1.PrismaClient({ adapter });
async function connectDB() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully");
    }
    catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
}
exports.default = prisma;
//# sourceMappingURL=prisma.js.map