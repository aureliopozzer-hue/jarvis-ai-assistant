import { NextRequest, NextResponse } from 'next/server';
import { getZAI, JARVIS_SYSTEM_PROMPT } from '@/lib/zai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId } = body as {
      message: string;
      conversationId?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    const zai = await getZAI();

    // Load conversation history if conversationId provided
    let conversation = conversationId
      ? await db.conversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        })
      : null;

    // Build messages array for LLM
    const chatMessages: Array<{ role: string; content: string }> = [
      { role: 'assistant', content: JARVIS_SYSTEM_PROMPT },
    ];

    if (conversation) {
      // Add existing conversation history
      for (const msg of conversation.messages) {
        chatMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add the new user message
    chatMessages.push({ role: 'user', content: message });

    // Save user message to DB
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Create new conversation with title from first message
      const title =
        message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await db.conversation.create({
        data: {
          title,
          messages: {
            create: {
              role: 'user',
              content: message,
            },
          },
        },
        include: {
          messages: true,
        },
      });
      currentConversationId = conversation.id;

      // Remove the user message from chatMessages since it's already in the array
      // The user message was added before creating the conversation, so it's fine
    } else {
      // Save user message to existing conversation
      await db.message.create({
        data: {
          role: 'user',
          content: message,
          conversationId: currentConversationId,
        },
      });
    }

    // Call LLM
    const completion = await zai.chat.completions.create({
      messages: chatMessages as Array<{
        role: 'assistant' | 'user' | 'system';
        content: string;
      }>,
      thinking: { type: 'disabled' },
    });

    const responseText =
      completion.choices[0]?.message?.content ||
      'Peço desculpas, mas não consegui processar sua solicitação.';

    // Save assistant response to DB
    const assistantMessage = await db.message.create({
      data: {
        role: 'assistant',
        content: responseText,
        conversationId: currentConversationId,
      },
    });

    return NextResponse.json({
      response: responseText,
      conversationId: currentConversationId,
      messageId: assistantMessage.id,
    });
  } catch (error) {
    console.error('[JARVIS CHAT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar sua mensagem' },
      { status: 500 }
    );
  }
}
