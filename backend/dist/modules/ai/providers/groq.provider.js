"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../common/logger/logger.service");
let GroqProvider = class GroqProvider {
    constructor() {
        this.logger = new logger_service_1.AppLogger('GroqProvider');
    }
    getProviderName() {
        return 'groq';
    }
    async generate(_options) {
        this.logger.warn('GroqProvider is not yet implemented. Set AI_PROVIDER=gemini.');
        return {
            content: 'Groq provider is not yet configured.',
            toolCalls: [],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            finishReason: 'error',
        };
    }
};
exports.GroqProvider = GroqProvider;
exports.GroqProvider = GroqProvider = __decorate([
    (0, common_1.Injectable)()
], GroqProvider);
//# sourceMappingURL=groq.provider.js.map