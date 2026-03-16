import ChatInterface from '@/components/pages/ChatInterface';

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomCode } = await params;
  return <ChatInterface roomCode={roomCode} />;
}
