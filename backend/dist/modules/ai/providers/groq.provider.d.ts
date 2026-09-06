import { ConfigService } from '@nestjs/config';
import { AIResponse, GenerateOptions, IAIProvider } from '../interfaces/ai-provider.interface';
export declare class GroqProvider implements IAIProvider {
    private readonly configService;
    private readonly client;
    private readonly modelName;
    private readonly logger;
    constructor(configService: ConfigService);
    getProviderName(): string;
    generate(options: GenerateOptions): Promise<AIResponse>;
}
