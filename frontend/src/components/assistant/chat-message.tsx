import { Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex gap-3', !isAssistant && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
          isAssistant ? 'bg-primary/10' : 'bg-secondary',
        )}
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', !isAssistant && 'items-end')}>
        <div
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm leading-relaxed',
            isAssistant
              ? 'bg-card border text-foreground'
              : 'bg-primary text-primary-foreground',
          )}
        >
          {/* Preserve line breaks from AI response */}
          {content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground px-1">
          {relativeTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
