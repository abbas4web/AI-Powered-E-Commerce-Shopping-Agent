"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
const config_1 = require("@nestjs/config");
exports.storageConfig = (0, config_1.registerAs)('storage', () => ({
    provider: process.env.STORAGE_PROVIDER ?? 'cloudinary',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    s3: {
        endpoint: process.env.S3_ENDPOINT,
        bucket: process.env.S3_BUCKET ?? 'smartshop-assets',
        region: process.env.S3_REGION ?? 'ap-south-1',
        accessKey: process.env.S3_ACCESS_KEY,
        secretKey: process.env.S3_SECRET_KEY,
    },
}));
//# sourceMappingURL=storage.config.js.map