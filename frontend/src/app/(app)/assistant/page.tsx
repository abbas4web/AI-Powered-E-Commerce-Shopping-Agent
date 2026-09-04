import type { Metadata } from 'next';
import { ChatInterface } from '@/components/assistant/chat-interface';

export const metadata: Metadata = { title: 'AI Assistant' };

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <ChatInterface />
    </div>
  );
}
