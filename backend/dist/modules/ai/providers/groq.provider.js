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
exports.GroqProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const groq_sdk_1 = require("groq-sdk");
const logger_service_1 = require("../../../common/logger/logger.service");
let GroqProvider = class GroqProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new logger_service_1.AppLogger('GroqProvider');
        const apiKey = this.configService.get('ai.groq.apiKey');
        if (!apiKey) {
            this.logger.warn('GROQ_API_KEY is not set. Groq provider will not work.');
        }
        this.client = new groq_sdk_1.default({ apiKey: apiKey ?? '' });
        this.modelName =
            this.configService.get('ai.groq.model') ?? 'llama-3.3-70b-versatile';
    }
    getProviderName() {
        return 'groq';
    }
    async generate(options) {
        const { messages, tools, systemPrompt, temperature = 0.3, maxTokens = 8192 } = options;
        const groqMessages = [];
        if (systemPrompt) {
            groqMessages.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
            groqMessages.push({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
            });
        }
        const groqTools = tools?.length
            ? tools.map((t) => ({
                type: 'function',
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }))
            : undefined;
        this.logger.debug(`Groq request: model=${this.modelName}, messages=${groqMessages.length}, tools=${tools?.length ?? 0}`);
        const completion = await this.client.chat.completions.create({
            model: this.modelName,
            messages: groqMessages,
            tools: groqTools,
            tool_choice: groqTools ? 'auto' : undefined,
            temperature,
            max_tokens: maxTokens,
        });
        const choice = completion.choices[0];
        const toolCalls = [];
        let textContent = choice.message.content ?? null;
        if (choice.message.tool_calls?.length) {
            for (const tc of choice.message.tool_calls) {
                try {
                    toolCalls.push({
                        id: tc.id,
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments),
                    });
                }
                catch {
                    this.logger.warn(`Failed to parse tool call arguments for ${tc.function.name}`);
                }
            }
        }
        return {
            content: textContent,
            toolCalls,
            usage: {
                promptTokens: completion.usage?.prompt_tokens ?? 0,
                completionTokens: completion.usage?.completion_tokens ?? 0,
                totalTokens: completion.usage?.total_tokens ?? 0,
            },
            finishReason: choice.finish_reason === 'tool_calls'
                ? 'tool_calls'
                : choice.finish_reason === 'stop'
                    ? 'stop'
                    : 'stop',
        };
    }
};
exports.GroqProvider = GroqProvider;
exports.GroqProvider = GroqProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GroqProvider);
//# sourceMappingURL=groq.provider.js.map