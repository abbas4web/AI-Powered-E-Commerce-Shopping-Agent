"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("./interfaces/ai-provider.interface");
const ai_orchestrator_service_1 = require("./ai-orchestrator.service");
const logger_service_1 = require("../../common/logger/logger.service");
let AiService = class AiService {
    constructor(aiProvider, orchestrator) {
        this.aiProvider = aiProvider;
        this.orchestrator = orchestrator;
        this.logger = new logger_service_1.AppLogger('AiService');
    }
    async chat(userId, dto) {
        this.logger.debug(`Chat request — user=${userId}, provider=${this.aiProvider.getProviderName()}`);
        return this.orchestrator.processMessage(userId, dto);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, ai_orchestrator_service_1.AiOrchestratorService])
], AiService);
//# sourceMappingURL=ai.service.js.map