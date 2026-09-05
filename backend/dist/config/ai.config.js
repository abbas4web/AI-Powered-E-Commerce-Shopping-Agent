"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfig = void 0;
const config_1 = require("@nestjs/config");
exports.aiConfig = (0, config_1.registerAs)('ai', () => ({
    provider: process.env.AI_PROVIDER ?? 'gemini',
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL ?? 'gemini-1.5-pro',
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL ?? 'llama3-70b-8192',
    },
}));
//# sourceMappingURL=ai.config.js.map