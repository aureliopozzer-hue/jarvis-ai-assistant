import { getZAI } from '@/lib/zai';
import { db } from '@/lib/db';
import os from 'os';

// ─── Tool Result Type ───────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

// ─── Tool Definition ────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  paramSchema: Record<string, string>;
}

export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'search',
    description: 'Web search. Search the internet for current information.',
    paramSchema: { query: 'string (required) - search query' },
  },
  {
    name: 'vision',
    description: 'Analyze an image using AI vision. Requires a base64 image.',
    paramSchema: { image: 'string (required) - base64 image data', question: 'string (required) - what to analyze' },
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a text description.',
    paramSchema: { prompt: 'string (required) - image description', size: 'string (optional) - image size, default 1024x1024' },
  },
  {
    name: 'read_page',
    description: 'Read and extract content from a web page URL.',
    paramSchema: { url: 'string (required) - URL to read' },
  },
  {
    name: 'system',
    description: 'Get system stats (CPU, memory, uptime, etc.).',
    paramSchema: {},
  },
  {
    name: 'memory_save',
    description: 'Save a memory for future recall.',
    paramSchema: { category: 'string (required) - preference|fact|routine|context|note', key: 'string (required) - name/identifier', value: 'string (required) - the value to remember' },
  },
  {
    name: 'memory_recall',
    description: 'Search and recall memories.',
    paramSchema: { query: 'string (required) - search term' },
  },
  {
    name: 'notify',
    description: 'Create a notification alert.',
    paramSchema: { type: 'string (required) - info|warning|alert|success', title: 'string (required) - notification title', message: 'string (required) - notification message' },
  },
];

// ─── Tool Calling Prompt Section ────────────────────────────────────

export const TOOL_CALLING_PROMPT = `You have access to the following tools. When you need to use a tool, respond with EXACTLY this format:
[TOOL:tool_name]{"param":"value"}[/TOOL]

Available tools:
- search: Web search. Params: {"query": "search query"}
- generate_image: Generate an image. Params: {"prompt": "image description"}
- read_page: Read a web page. Params: {"url": "https://..."}
- system: Get system stats. Params: {}
- memory_save: Save a memory. Params: {"category": "preference|fact|routine|context|note", "key": "name", "value": "the value"}
- memory_recall: Recall memories. Params: {"query": "search term"}
- notify: Create a notification. Params: {"type": "info|warning|alert|success", "title": "title", "message": "message"}

You can use multiple tools in a single response. After using tools, I will provide the results and you can generate a final response.

IMPORTANT rules for tool usage:
- Only use tools when they are actually needed. For simple questions, just answer directly.
- When the user shares personal information (name, preferences, routines), proactively use memory_save.
- When asked about current events, news, or factual questions you're unsure about, use search.
- When asked about system status or server health, use system.
- When the user asks to set a reminder or alert, use notify.
- When the user asks to create visuals or images, use generate_image.
- When the user asks you to read or summarize a web page, use read_page.
- When you need to recall previously stored information, use memory_recall.
- Always briefly mention what tool you're using before the tool call (e.g., "Let me search for that..." then call the tool).
- After receiving tool results, incorporate them naturally into your response.`;

// ─── Tool Parser ────────────────────────────────────────────────────

export interface ParsedToolCall {
  name: string;
  params: Record<string, unknown>;
}

/**
 * Parse tool calls from LLM response text.
 * Matches patterns like: [TOOL:search]{"query":"weather"}[/TOOL]
 */
export function parseToolCalls(text: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];
  // Robust regex: matches [TOOL:name]{...json...}[/TOOL]
  // The JSON part is matched non-greedily, then we try to parse it
  const regex = /\[TOOL:(\w+)\]([\s\S]*?)\[\/TOOL\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const jsonStr = match[2].trim();

    try {
      const params = JSON.parse(jsonStr);
      toolCalls.push({ name, params: typeof params === 'object' && params !== null ? params : {} });
    } catch {
      // If JSON parsing fails, try to handle common issues
      console.warn(`[TOOL PARSER] Failed to parse params for tool "${name}": ${jsonStr}`);
      toolCalls.push({ name, params: {} });
    }
  }

  return toolCalls;
}

/**
 * Remove tool call patterns from text, leaving only the narrative content.
 */
export function stripToolCalls(text: string): string {
  return text.replace(/\[TOOL:\w+\][\s\S]*?\[\/TOOL\]/g, '').trim();
}

// ─── Tool Executor ──────────────────────────────────────────────────

async function executeSearch(params: Record<string, unknown>): Promise<ToolResult> {
  const query = String(params.query || '');
  if (!query) {
    return { success: false, data: null, error: 'Query parameter is required' };
  }

  try {
    const zai = await getZAI();
    const searchResults = await zai.functions.invoke('web_search', {
      query,
      num: 5,
    });

    const results = Array.isArray(searchResults)
      ? searchResults.map((result: Record<string, unknown>) => ({
          name: String(result.name || ''),
          url: String(result.url || ''),
          snippet: String(result.snippet || ''),
          host_name: String(result.host_name || ''),
          date: String(result.date || ''),
        }))
      : [];

    return { success: true, data: results };
  } catch (error) {
    console.error('[TOOL:search] Error:', error);
    return { success: false, data: null, error: 'Web search failed' };
  }
}

async function executeVision(params: Record<string, unknown>): Promise<ToolResult> {
  const image = String(params.image || '');
  const question = String(params.question || 'What do you see in this image?');

  if (!image) {
    return { success: false, data: null, error: 'Image parameter is required' };
  }

  try {
    const zai = await getZAI();

    let imageUrl: string;
    if (image.startsWith('data:')) {
      imageUrl = image;
    } else {
      imageUrl = `data:image/jpeg;base64,${image}`;
    }

    const visionResult = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const analysis = visionResult.choices[0]?.message?.content || 'Unable to analyze the image.';
    return { success: true, data: { analysis } };
  } catch (error) {
    console.error('[TOOL:vision] Error:', error);
    return { success: false, data: null, error: 'Image analysis failed' };
  }
}

async function executeGenerateImage(params: Record<string, unknown>): Promise<ToolResult> {
  const prompt = String(params.prompt || '');
  const size = String(params.size || '1024x1024');

  if (!prompt) {
    return { success: false, data: null, error: 'Prompt parameter is required' };
  }

  try {
    const zai = await getZAI();
    const imageResult = await zai.images.generations.create({
      prompt,
      size,
    });

    const imageBase64 = imageResult.data[0]?.base64 || '';
    if (!imageBase64) {
      return { success: false, data: null, error: 'No image was generated' };
    }

    return { success: true, data: { image: imageBase64 } };
  } catch (error) {
    console.error('[TOOL:generate_image] Error:', error);
    return { success: false, data: null, error: 'Image generation failed' };
  }
}

async function executeReadPage(params: Record<string, unknown>): Promise<ToolResult> {
  const url = String(params.url || '');

  if (!url) {
    return { success: false, data: null, error: 'URL parameter is required' };
  }

  try {
    const zai = await getZAI();
    const pageResult = await zai.functions.invoke('page_reader', { url });

    const title = String((pageResult as Record<string, unknown>).title || '');
    const content = String((pageResult as Record<string, unknown>).content || '');

    return { success: true, data: { title, content, url } };
  } catch (error) {
    console.error('[TOOL:read_page] Error:', error);
    return { success: false, data: null, error: 'Failed to read the web page' };
  }
}

async function executeSystem(): Promise<ToolResult> {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as Record<string, number>)[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsage = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;

    const data = {
      cpu: {
        usage: Math.round(cpuUsage * 100) / 100,
        cores: cpus.length,
        model: cpus[0]?.model || 'unknown',
      },
      memory: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentage: totalMem > 0 ? Math.round((usedMem / totalMem) * 10000) / 100 : 0,
      },
      uptime: os.uptime(),
      loadAvg: os.loadavg().map((v) => Math.round(v * 100) / 100),
      platform: os.platform(),
      hostname: os.hostname(),
      timestamp: new Date().toISOString(),
    };

    return { success: true, data };
  } catch (error) {
    console.error('[TOOL:system] Error:', error);
    return { success: false, data: null, error: 'Failed to get system stats' };
  }
}

async function executeMemorySave(params: Record<string, unknown>): Promise<ToolResult> {
  const category = String(params.category || '');
  const key = String(params.key || '');
  const value = String(params.value || '');

  const validCategories = ['preference', 'fact', 'routine', 'context', 'note'];

  if (!category || !validCategories.includes(category)) {
    return { success: false, data: null, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` };
  }
  if (!key) {
    return { success: false, data: null, error: 'Key parameter is required' };
  }
  if (!value) {
    return { success: false, data: null, error: 'Value parameter is required' };
  }

  try {
    const memory = await db.memory.upsert({
      where: {
        category_key: { category, key },
      },
      update: {
        value,
        source: 'user',
      },
      create: {
        category,
        key,
        value,
        source: 'user',
        important: false,
      },
    });

    return { success: true, data: { id: memory.id, category, key, value } };
  } catch (error) {
    console.error('[TOOL:memory_save] Error:', error);
    return { success: false, data: null, error: 'Failed to save memory' };
  }
}

async function executeMemoryRecall(params: Record<string, unknown>): Promise<ToolResult> {
  const query = String(params.query || '');

  if (!query) {
    return { success: false, data: null, error: 'Query parameter is required' };
  }

  try {
    // Search by category or key containing the query string
    const memories = await db.memory.findMany({
      where: {
        OR: [
          { key: { contains: query } },
          { value: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    return { success: true, data: memories };
  } catch (error) {
    console.error('[TOOL:memory_recall] Error:', error);
    return { success: false, data: null, error: 'Failed to recall memories' };
  }
}

async function executeNotify(params: Record<string, unknown>): Promise<ToolResult> {
  const type = String(params.type || 'info');
  const title = String(params.title || '');
  const message = String(params.message || '');

  const validTypes = ['info', 'warning', 'alert', 'success'];
  if (!validTypes.includes(type)) {
    return { success: false, data: null, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
  }
  if (!title) {
    return { success: false, data: null, error: 'Title parameter is required' };
  }
  if (!message) {
    return { success: false, data: null, error: 'Message parameter is required' };
  }

  // Map 'alert' to the notification model's valid types
  const notifyType = type === 'alert' ? 'alert' : type;

  try {
    const notification = await db.notification.create({
      data: {
        type: notifyType,
        title,
        message,
      },
    });

    return { success: true, data: { id: notification.id, type: notifyType, title, message } };
  } catch (error) {
    console.error('[TOOL:notify] Error:', error);
    return { success: false, data: null, error: 'Failed to create notification' };
  }
}

/**
 * Execute a tool by name with the given parameters.
 * This is the main entry point for tool execution.
 */
export async function executeTool(
  name: string,
  params: Record<string, unknown>
): Promise<ToolResult> {
  switch (name) {
    case 'search':
      return executeSearch(params);
    case 'vision':
      return executeVision(params);
    case 'generate_image':
      return executeGenerateImage(params);
    case 'read_page':
      return executeReadPage(params);
    case 'system':
      return executeSystem();
    case 'memory_save':
      return executeMemorySave(params);
    case 'memory_recall':
      return executeMemoryRecall(params);
    case 'notify':
      return executeNotify(params);
    default:
      return {
        success: false,
        data: null,
        error: `Unknown tool: ${name}. Available tools: ${AVAILABLE_TOOLS.map((t) => t.name).join(', ')}`,
      };
  }
}
