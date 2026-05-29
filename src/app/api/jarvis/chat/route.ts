import { NextRequest, NextResponse } from 'next/server';
import { getZAI, JARVIS_SYSTEM_PROMPT } from '@/lib/zai';
import { db } from '@/lib/db';
import { parseToolCalls, stripToolCalls, executeTool } from '@/lib/jarvis-tools';

export const maxDuration = 60;

// ─── Background Memory Extraction ───────────────────────────────────

interface ExtractedMemory {
  category: string;
  key: string;
  value: string;
}

const EXTRACTION_PROMPT = `Extract structured memories from this conversation. Return a JSON array of objects with {category, key, value}. Categories: preference, fact, routine, context, note. Only extract clear, factual information. If nothing worth remembering, return empty array [].

User: {message}
Assistant: {response}`;

async function extractAndSaveMemories(
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    const zai = await getZAI();

    const prompt = EXTRACTION_PROMPT.replace('{message}', userMessage).replace(
      '{response}',
      assistantResponse
    );

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a memory extraction system. Analyze conversations and extract factual information as structured data. Always respond with a valid JSON array only, no other text.',
        },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    });

    const rawContent = completion.choices[0]?.message?.content?.trim() || '[]';

    // Parse the JSON array from the response
    let memories: ExtractedMemory[];
    try {
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      memories = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.warn('[MEMORY EXTRACTION] Failed to parse LLM response as JSON');
      return;
    }

    if (!Array.isArray(memories) || memories.length === 0) return;

    const validCategories = ['preference', 'fact', 'routine', 'context', 'note'];

    for (const mem of memories) {
      try {
        if (
          !mem.category ||
          !mem.key ||
          !mem.value ||
          !validCategories.includes(mem.category)
        ) {
          continue;
        }

        // Upsert memory on (category, key) unique constraint
        await db.memory.upsert({
          where: {
            category_key: {
              category: mem.category,
              key: mem.key,
            },
          },
          update: {
            value: mem.value,
            source: 'inferred',
          },
          create: {
            category: mem.category,
            key: mem.key,
            value: mem.value,
            source: 'inferred',
            important: false,
          },
        });
      } catch (memError) {
        console.warn('[MEMORY EXTRACTION] Error saving individual memory:', memError);
      }
    }

    console.log(
      `[MEMORY EXTRACTION] Extracted ${memories.length} memories from conversation`
    );
  } catch (error) {
    console.error('[MEMORY EXTRACTION] Background extraction failed:', error);
  }
}

// ─── Tool Calling Loop ──────────────────────────────────────────────

const MAX_TOOL_ITERATIONS = 2;

/**
 * Run the tool calling loop:
 * 1. Call LLM
 * 2. Parse tool calls from response
 * 3. Execute tools
 * 4. Feed results back to LLM
 * 5. Repeat until no more tool calls or max iterations reached
 */
async function runToolCallingLoop(
  zai: Awaited<ReturnType<typeof getZAI>>,
  chatMessages: Array<{ role: 'assistant' | 'user' | 'system'; content: string }>,
  allToolsUsed: string[]
): Promise<{ finalResponse: string; toolsUsed: string[] }> {
  let currentMessages = [...chatMessages];
  let toolsUsed = allToolsUsed;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    // Call LLM
    const completion = await zai.chat.completions.create({
      messages: currentMessages,
      thinking: { type: 'disabled' },
    });

    const responseText =
      completion.choices[0]?.message?.content ||
      'Peço desculpas, mas não consegui processar sua solicitação.';

    // Parse tool calls from the response
    const toolCalls = parseToolCalls(responseText);

    if (toolCalls.length === 0) {
      // No tools called — this is the final response
      // Strip any leftover tool call artifacts just in case
      const cleanResponse = stripToolCalls(responseText);
      return { finalResponse: cleanResponse || responseText, toolsUsed };
    }

    // Tools were called — execute them
    console.log(
      `[TOOL LOOP] Iteration ${iteration + 1}: Found ${toolCalls.length} tool call(s): ${toolCalls.map((t) => t.name).join(', ')}`
    );

    // Track which tools were used
    for (const tc of toolCalls) {
      if (!toolsUsed.includes(tc.name)) {
        toolsUsed.push(tc.name);
      }
    }

    // Execute each tool and collect results
    const toolResults: string[] = [];
    for (const tc of toolCalls) {
      console.log(`[TOOL LOOP] Executing: ${tc.name} with params:`, tc.params);
      const result = await executeTool(tc.name, tc.params);
      toolResults.push(
        `Tool "${tc.name}" result: ${result.success ? JSON.stringify(result.data) : `ERROR: ${result.error}`}`
      );
    }

    // Get the narrative text (content outside tool calls)
    const narrativeText = stripToolCalls(responseText);

    // Add assistant's response (with tool calls) to conversation
    currentMessages.push({ role: 'assistant', content: responseText });

    // Add tool results as a system message
    const toolResultsMessage = `[TOOL RESULTS]\n${toolResults.join('\n')}\n[END TOOL RESULTS]\n\nPlease incorporate these results into your response. If you need more information, you can call additional tools. Otherwise, provide your final answer.`;

    currentMessages.push({ role: 'system', content: toolResultsMessage });
  }

  // If we've reached max iterations, do one final LLM call to summarize
  console.log('[TOOL LOOP] Max iterations reached, generating final response');

  const finalCompletion = await zai.chat.completions.create({
    messages: [
      ...currentMessages,
      {
        role: 'system',
        content:
          'You have used tools and gathered information. Please now provide a complete final response to the user based on all the tool results you have received. Do not call any more tools.',
      },
    ],
    thinking: { type: 'disabled' },
  });

  const finalText =
    finalCompletion.choices[0]?.message?.content ||
    'Peço desculpas, mas não consegui completar a operação após múltiplas tentativas.';

  return { finalResponse: stripToolCalls(finalText) || finalText, toolsUsed };
}

// ─── Chat Endpoint ──────────────────────────────────────────────────

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
    const chatMessages: Array<{ role: 'assistant' | 'user' | 'system'; content: string }> = [
      { role: 'system', content: JARVIS_SYSTEM_PROMPT },
    ];

    if (conversation) {
      // Add existing conversation history
      for (const msg of conversation.messages) {
        chatMessages.push({ role: msg.role as 'assistant' | 'user' | 'system', content: msg.content });
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

    // Run the tool calling loop with fallback
    let finalResponse: string;
    let toolsUsed: string[] = [];

    try {
      const result = await runToolCallingLoop(zai, chatMessages, []);
      finalResponse = result.finalResponse;
      toolsUsed = result.toolsUsed;
    } catch (toolError) {
      console.error('[JARVIS CHAT] Tool calling loop failed, falling back to basic response:', toolError);
      // Fallback: simple single-call response without tool calling
      const completion = await zai.chat.completions.create({
        messages: chatMessages,
        thinking: { type: 'disabled' },
      });
      finalResponse = completion.choices[0]?.message?.content || 'Peço desculpas, mas não consegui processar sua solicitação.';
    }

    // Save assistant response to DB
    const assistantMessage = await db.message.create({
      data: {
        role: 'assistant',
        content: finalResponse,
        conversationId: currentConversationId,
      },
    });

    // ── Background: Auto-extract memories (non-blocking) ──────────
    // Only run memory extraction 30% of the time to reduce server load
    // Do NOT await — this runs in the background without slowing the response
    if (Math.random() < 0.3) {
      extractAndSaveMemories(message, finalResponse).catch(() => {
        // Silently ignore — errors are already logged inside
      });
    }

    const responseData: {
      response: string;
      conversationId: string;
      messageId: string;
      toolsUsed?: string[];
    } = {
      response: finalResponse,
      conversationId: currentConversationId,
      messageId: assistantMessage.id,
    };

    // Only include toolsUsed if any tools were actually used
    if (toolsUsed.length > 0) {
      responseData.toolsUsed = toolsUsed;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[JARVIS CHAT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar sua mensagem' },
      { status: 500 }
    );
  }
}
