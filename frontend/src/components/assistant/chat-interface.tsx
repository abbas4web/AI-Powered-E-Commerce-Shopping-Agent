'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from './chat-message';
import { ProductRecommendationCard } from './product-recommendation-card';
import { chatSchema, type ChatFormValues } from '@/lib/validations';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { ChatResponse } from '@smartshop/shared';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response?: ChatResponse;
  timestamp: string;
}

const STARTER_PROMPTS = [
  'I need a laptop under ₹80,000 for Flutter development with 16GB RAM',
  'Best smartphones under ₹40,000 with good camera',
  'Compare ASUS Vivobook vs Dell Inspiron for development',
  'Wireless headphones under ₹5,000 with noise cancellation',
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
  });

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (values: ChatFormValues) => {
    const userMessage: Message = {
      role: 'user',
      content: values.message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    reset();
    setIsLoading(true);

    try {
      const response = await apiClient.post<ChatResponse>('/ai/chat', {
        message: values.message,
        conversationId,
      });

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // The AI returns a JSON string inside response.message — parse it
      let parsedResponse: ChatResponse = response;
      let displayMessage = response.message;

      try {
        // Strip markdown code blocks if present
        const cleaned = response.message
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        if (cleaned.startsWith('{')) {
          const parsed = JSON.parse(cleaned) as ChatResponse;
          parsedResponse = {
            ...response,
            message: parsed.message ?? response.message,
            intent: parsed.intent,
            products: parsed.products,
            followUpQuestions: parsed.followUpQuestions,
          };
          displayMessage = parsed.message ?? response.message;
        }
      } catch {
        // Not JSON — display as plain text
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: displayMessage,
        response: parsedResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: err instanceof Error ? err.message : 'Failed to get a response',
      });
      // Remove the user message on failure so they can retry
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterPrompt = (prompt: string) => {
    sendMessage({ message: prompt });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <ScrollArea className="flex-1 px-4">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full py-16 space-y-6">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-semibold">SmartShop AI Assistant</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Describe what you&apos;re looking for and I&apos;ll find the best options, explain the trade-offs, and answer your questions.
              </p>
            </div>
            <div className="grid gap-2 w-full max-w-md">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleStarterPrompt(prompt)}
                  className="text-left text-sm rounded-lg border bg-card px-4 py-3 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-3">
                <ChatMessage role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                {/* Render product cards if the response contains recommendations */}
                {msg.response?.products && msg.response.products.length > 0 && (
                  <div className="ml-9 grid gap-3">
                    {msg.response.products.map((rec) => (
                      <ProductRecommendationCard key={rec.productId} recommendation={rec} />
                    ))}
                  </div>
                )}
                {/* Follow-up questions */}
                {msg.response?.followUpQuestions && msg.response.followUpQuestions.length > 0 && (
                  <div className="ml-9 flex flex-wrap gap-2">
                    {msg.response.followUpQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage({ message: q })}
                        className="text-xs rounded-full border px-3 py-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex gap-1 items-center h-8">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3">
        <form
          onSubmit={handleSubmit(sendMessage)}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <Input
            placeholder="Ask about any product… e.g. 'Best laptop under ₹70k for coding'"
            autoComplete="off"
            disabled={isLoading}
            className="flex-1"
            {...register('message')}
          />
          <Button type="submit" disabled={isLoading} size="icon" aria-label="Send message">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {errors.message && (
          <p className="text-xs text-destructive mt-1 max-w-3xl mx-auto">
            {errors.message.message}
          </p>
        )}
      </div>
    </div>
  );
}
