"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const ai_orchestrator_service_1 = require("./ai-orchestrator.service");
const tool_dispatcher_service_1 = require("./tools/tool-dispatcher.service");
const gemini_provider_1 = require("./providers/gemini.provider");
const groq_provider_1 = require("./providers/groq.provider");
const ai_provider_interface_1 = require("./interfaces/ai-provider.interface");
const search_module_1 = require("../search/search.module");
const products_module_1 = require("../products/products.module");
const recommendations_module_1 = require("../recommendations/recommendations.module");
const conversations_module_1 = require("../conversations/conversations.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, search_module_1.SearchModule, products_module_1.ProductsModule, recommendations_module_1.RecommendationsModule, conversations_module_1.ConversationsModule],
        controllers: [ai_controller_1.AiController],
        providers: [
            gemini_provider_1.GeminiProvider,
            groq_provider_1.GroqProvider,
            {
                provide: ai_provider_interface_1.AI_PROVIDER,
                inject: [config_1.ConfigService, gemini_provider_1.GeminiProvider, groq_provider_1.GroqProvider],
                useFactory: (config, gemini, groq) => {
                    const provider = config.get('ai.provider') ?? 'gemini';
                    return provider === 'groq' ? groq : gemini;
                },
            },
            ai_service_1.AiService,
            ai_orchestrator_service_1.AiOrchestratorService,
            tool_dispatcher_service_1.ToolDispatcherService,
        ],
        exports: [ai_service_1.AiService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map