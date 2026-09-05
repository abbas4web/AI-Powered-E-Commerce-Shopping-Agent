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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const logger_service_1 = require("../../../common/logger/logger.service");
let GeminiProvider = class GeminiProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new logger_service_1.AppLogger('GeminiProvider');
        const apiKey = this.configService.get('ai.gemini.apiKey');
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY is not set. AI features will not work until it is configured.');
        }
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey ?? '');
        this.modelName = this.configService.get('ai.gemini.model') ?? 'gemini-1.5-pro';
    }
    getProviderName() {
        return 'gemini';
    }
    async generate(options) {
        const { messages, tools, systemPrompt, temperature = 0.3, maxTokens = 8192 } = options;
        const geminiTools = tools?.length
            ? [
                {
                    functionDeclarations: tools.map((t) => ({
                        name: t.name,
                        description: t.description,
                        parameters: t.parameters,
                    })),
                },
            ]
            : undefined;
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            systemInstruction: systemPrompt,
            tools: geminiTools,
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
            },
            safetySettings: [
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
        });
        const history = messages.slice(0, -1).map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));
        const lastMessage = messages[messages.length - 1];
        const chat = model.startChat({ history });
        this.logger.debug(`Gemini request: model=${this.modelName}, messages=${messages.length}, tools=${tools?.length ?? 0}`);
        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        const candidate = response.candidates?.[0];
        const toolCalls = [];
        let textContent = null;
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.text) {
                    textContent = (textContent ?? '') + part.text;
                }
                if (part.functionCall) {
                    toolCalls.push({
                        id: `${part.functionCall.name}-${Date.now()}`,
                        name: part.functionCall.name,
                        arguments: part.functionCall.args ?? {},
                    });
                }
            }
        }
        const usageMeta = response.usageMetadata;
        return {
            content: textContent,
            toolCalls,
            usage: {
                promptTokens: usageMeta?.promptTokenCount ?? 0,
                completionTokens: usageMeta?.candidatesTokenCount ?? 0,
                totalTokens: usageMeta?.totalTokenCount ?? 0,
            },
            finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
        };
    }
};
exports.GeminiProvider = GeminiProvider;
exports.GeminiProvider = GeminiProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiProvider);
//# sourceMappingURL=gemini.provider.js.map