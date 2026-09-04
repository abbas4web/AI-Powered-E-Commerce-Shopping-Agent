/**
 * AIProvider — the single abstraction all AI providers must implement.
 *
 * Business logic only interacts with this interface, making it trivial
 * to swap Gemini for Groq (or any other LLM) without touching orchestration.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
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

export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface IAIProvider {
  /**
   * Generate a response. Supports tool calling.
   * The provider is responsible for serializing tool schemas
   * in its own format.
   */
  generate(options: GenerateOptions): Promise<AIResponse>;

  /**
   * Return the provider name for logging/debugging.
   */
  getProviderName(): string;
}
