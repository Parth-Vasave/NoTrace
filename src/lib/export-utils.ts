import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { type Message, type Member } from '@/context/chat-context';

export const exportChatToPDF = (
  roomCode: string,
  messages: Message[],
  members: Member[],
  currentUser: Member | null
) => {
  if (!messages.length) return;

  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text(`NOTRACE Chat - Room: ${roomCode}`, 14, 15);
  pdf.setFontSize(10);
  pdf.text(`Exported on: ${format(new Date(), 'Pp')} by ${currentUser?.name || 'User'}`, 14, 22);
  pdf.setLineWidth(0.1);
  pdf.line(14, 25, 196, 25);

  let yPos = 35;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  const lineHeight = 5;
  const spacing = 2;

  messages.forEach((msg) => {
    const timestamp = typeof msg.timestamp === 'number' ? format(new Date(msg.timestamp), 'p') : 'Sending...';
    const senderName = members.find(m => m.id === msg.senderId)?.name || 'Unknown';
    const messageText = msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const messageLine = `[${timestamp}] ${senderName}: ${messageText}`;

    const splitLines = pdf.splitTextToSize(messageLine, 180);
    const messageHeight = splitLines.length * lineHeight;

    if (yPos + messageHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }

    pdf.text(splitLines, 14, yPos);
    yPos += messageHeight + spacing;
  });

  pdf.save(`notrace_chat_${roomCode}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`);
};
