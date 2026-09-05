export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface AITool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
export interface AIToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
export interface AIResponse {
    content: string | null;
    toolCalls: AIToolCall[];
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}
export interface AIStreamChunk {
    delta: string;
    done: boolean;
}
export interface GenerateOptions {
    messages: ChatMessage[];
    tools?: AITool[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}
export declare const AI_PROVIDER: unique symbol;
export interface IAIProvider {
    generate(options: GenerateOptions): Promise<AIResponse>;
    getProviderName(): string;
}
