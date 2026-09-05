import { AIResponse, GenerateOptions, IAIProvider } from '../interfaces/ai-provider.interface';
export declare class GroqProvider implements IAIProvider {
    private readonly logger;
    getProviderName(): string;
    generate(_options: GenerateOptions): Promise<AIResponse>;
}
