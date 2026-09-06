"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfig = void 0;
const config_1 = require("@nestjs/config");
exports.aiConfig = (0, config_1.registerAs)('ai', () => ({
    provider: process.env.AI_PROVIDER ?? 'gemini',
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL ?? 'gemini-3.6-flash',
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
    },
}));
//# sourceMappingURL=ai.config.js.map