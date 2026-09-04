import type { Metadata } from 'next';
import { ConversationHistoryPage } from '@/components/conversations/conversation-history-page';

export const metadata: Metadata = { title: 'Conversations' };

export default function ConversationsRoute() {
  return <ConversationHistoryPage />;
}
