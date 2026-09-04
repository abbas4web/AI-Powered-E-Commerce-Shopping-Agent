import type { Metadata } from 'next';
import { ConversationDetailPage } from '@/components/conversations/conversation-detail-page';

export const metadata: Metadata = { title: 'Conversation' };

export default function ConversationRoute({ params }: { params: { id: string } }) {
  return <ConversationDetailPage conversationId={params.id} />;
}
