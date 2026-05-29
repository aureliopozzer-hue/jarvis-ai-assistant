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
  {
    name: 'email_read',
    description: 'Read user emails. Shows inbox with unread count, starred items, and recent emails.',
    paramSchema: { filter: 'string (optional) - "unread", "starred", or "all" (default: "unread")', limit: 'number (optional) - number of emails to return (default: 10)' },
  },
  {
    name: 'email_send',
    description: 'Compose and send an email on behalf of the user.',
    paramSchema: { to: 'string (required) - recipient email address', subject: 'string (required) - email subject line', body: 'string (required) - email body content' },
  },
  {
    name: 'social_check',
    description: 'Check social media accounts, recent posts, and engagement metrics.',
    paramSchema: { platform: 'string (optional) - "instagram", "twitter", "linkedin", "facebook", "tiktok", or "all" (default: "all")' },
  },
  {
    name: 'social_post',
    description: 'Create a social media post on behalf of the user.',
    paramSchema: { platform: 'string (required) - target platform', content: 'string (required) - post content text' },
  },
  {
    name: 'campaign_list',
    description: 'List and review marketing campaigns with their metrics and ROI.',
    paramSchema: { status: 'string (optional) - "draft", "active", "paused", "completed", or "all" (default: "all")' },
  },
  {
    name: 'campaign_create',
    description: 'Create a new marketing campaign.',
    paramSchema: { name: 'string (required) - campaign name', type: 'string (required) - "email", "social", "ads", "content"', budget: 'number (optional) - campaign budget' },
  },
  {
    name: 'calendar_check',
    description: 'Check upcoming calendar events and schedule.',
    paramSchema: { days: 'number (optional) - number of days ahead to check (default: 7)' },
  },
  {
    name: 'calendar_add',
    description: 'Add a new event to the calendar.',
    paramSchema: { title: 'string (required) - event title', startTime: 'string (required) - start time ISO string', endTime: 'string (required) - end time ISO string', description: 'string (optional) - event description', location: 'string (optional) - event location' },
  },
  {
    name: 'file_list',
    description: 'List and search user files.',
    paramSchema: { type: 'string (optional) - "document", "image", "code", "spreadsheet", or "all" (default: "all")', search: 'string (optional) - search term for file content' },
  },
  {
    name: 'finance_briefing',
    description: 'Gera um panorama diário completo do mercado financeiro com análise de índices, notícias e recomendações.',
    paramSchema: {},
  },
  {
    name: 'finance_quote',
    description: 'Obtém cotação em tempo real de uma ação ou índice.',
    paramSchema: { ticker: 'string (required) - Símbolo da ação (ex: AAPL, PETR4.SA, ^BVSP)' },
  },
  {
    name: 'finance_news',
    description: 'Obtém notícias do mercado financeiro, opcionalmente filtradas por ação.',
    paramSchema: { ticker: 'string (optional) - Símbolo da ação para filtrar notícias' },
  },
  {
    name: 'finance_search',
    description: 'Busca ações por nome da empresa ou símbolo.',
    paramSchema: { query: 'string (required) - Nome da empresa ou símbolo para buscar' },
  },
  {
    name: 'finance_analysis',
    description: 'Análise detalhada de uma ação com dados financeiros, estatísticas e earnings.',
    paramSchema: { ticker: 'string (required) - Símbolo da ação' },
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
- email_read: Read emails. Params: {"filter": "unread|starred|all", "limit": 10}
- email_send: Send an email. Params: {"to": "email@example.com", "subject": "subject", "body": "body text"}
- social_check: Check social media. Params: {"platform": "instagram|twitter|linkedin|facebook|tiktok|all"}
- social_post: Create a social post. Params: {"platform": "platform name", "content": "post text"}
- campaign_list: List marketing campaigns. Params: {"status": "draft|active|paused|completed|all"}
- campaign_create: Create a campaign. Params: {"name": "campaign name", "type": "email|social|ads|content", "budget": 1000}
- calendar_check: Check calendar events. Params: {"days": 7}
- calendar_add: Add a calendar event. Params: {"title": "event title", "startTime": "ISO string", "endTime": "ISO string", "description": "optional", "location": "optional"}
- file_list: List and search files. Params: {"type": "document|image|code|spreadsheet|all", "search": "optional search term"}
- finance_briefing: Daily market briefing. Params: {}
- finance_quote: Get stock/index quote. Params: {"ticker": "AAPL|PETR4.SA|^BVSP"}
- finance_news: Get financial news. Params: {"ticker": "optional ticker filter"}
- finance_search: Search stocks. Params: {"query": "company name or symbol"}
- finance_analysis: Detailed stock analysis. Params: {"ticker": "stock symbol"}

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
- When the user asks about emails, use email_read.
- When the user asks to send an email, use email_send.
- When the user asks about social media, use social_check.
- When the user asks to post on social media, use social_post.
- When the user asks about marketing campaigns, use campaign_list.
- When the user asks to create a campaign, use campaign_create.
- When the user asks about schedule or calendar, use calendar_check.
- When the user asks to schedule something, use calendar_add.
- When the user asks about files, use file_list.
- When the user asks about market overview, use finance_briefing.
- When the user asks about a stock quote, use finance_quote.
- When the user asks about financial news, use finance_news.
- When the user asks to search for a stock, use finance_search.
- When the user asks to analyze a stock, use finance_analysis.
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

// ─── Email Tool Executors ───────────────────────────────────────────

async function executeEmailRead(params: Record<string, unknown>): Promise<ToolResult> {
  const filter = String(params.filter || 'unread');
  const limit = Number(params.limit) || 10;

  try {
    const where: Record<string, unknown> = {};
    if (filter === 'unread') where.isRead = false;
    else if (filter === 'starred') where.isStarred = true;
    // 'all' = no filter

    const [emails, unreadCount] = await Promise.all([
      db.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        include: { account: { select: { provider: true, email: true } } },
      }),
      db.email.count({ where: { isRead: false } }),
    ]);

    const formattedEmails = emails.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      subject: e.subject,
      snippet: e.snippet,
      isRead: e.isRead,
      isStarred: e.isStarred,
      receivedAt: e.receivedAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        emails: formattedEmails,
        unreadCount,
        filter,
        total: emails.length,
      },
    };
  } catch (error) {
    console.error('[TOOL:email_read] Error:', error);
    return { success: false, data: null, error: 'Failed to read emails' };
  }
}

async function executeEmailSend(params: Record<string, unknown>): Promise<ToolResult> {
  const to = String(params.to || '');
  const subject = String(params.subject || '');
  const body = String(params.body || '');

  if (!to || !subject || !body) {
    return { success: false, data: null, error: 'To, subject, and body are required' };
  }

  try {
    // Find first active account
    const account = await db.emailAccount.findFirst({ where: { isActive: true } });
    if (!account) {
      return { success: false, data: null, error: 'No active email account found' };
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const snippet = body.substring(0, 200);

    const email = await db.email.create({
      data: {
        accountId: account.id,
        messageId,
        from: account.email,
        to,
        subject,
        body,
        snippet,
        isRead: true,
        labels: '["sent"]',
        receivedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        sentAt: email.receivedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[TOOL:email_send] Error:', error);
    return { success: false, data: null, error: 'Failed to send email' };
  }
}

// ─── Social Media Tool Executors ────────────────────────────────────

async function executeSocialCheck(params: Record<string, unknown>): Promise<ToolResult> {
  const platform = String(params.platform || 'all');

  try {
    const where: Record<string, unknown> = {};
    if (platform !== 'all') where.platform = platform;

    const accounts = await db.socialAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        posts: {
          orderBy: { postedAt: 'desc' },
          take: 5,
        },
      },
    });

    const totalPosts = await db.socialPost.count(
      platform !== 'all' ? { where: { account: { platform } } } : undefined
    );

    const formattedAccounts = accounts.map((a) => ({
      id: a.id,
      platform: a.platform,
      username: a.username,
      isActive: a.isActive,
      postCount: a.posts.length,
      recentPosts: a.posts.map((p) => ({
        content: p.content.substring(0, 100),
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        postedAt: p.postedAt.toISOString(),
      })),
    }));

    return {
      success: true,
      data: {
        accounts: formattedAccounts,
        totalPosts,
        platform,
      },
    };
  } catch (error) {
    console.error('[TOOL:social_check] Error:', error);
    return { success: false, data: null, error: 'Failed to check social media' };
  }
}

async function executeSocialPost(params: Record<string, unknown>): Promise<ToolResult> {
  const platform = String(params.platform || '');
  const content = String(params.content || '');

  if (!platform || !content) {
    return { success: false, data: null, error: 'Platform and content are required' };
  }

  try {
    const account = await db.socialAccount.findFirst({
      where: { platform, isActive: true },
    });
    if (!account) {
      return { success: false, data: null, error: `No active ${platform} account found` };
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const post = await db.socialPost.create({
      data: {
        accountId: account.id,
        postId,
        content,
        mediaUrls: '[]',
        postedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        id: post.id,
        platform: account.platform,
        username: account.username,
        content: post.content,
        postedAt: post.postedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[TOOL:social_post] Error:', error);
    return { success: false, data: null, error: 'Failed to create social media post' };
  }
}

// ─── Campaign Tool Executors ────────────────────────────────────────

async function executeCampaignList(params: Record<string, unknown>): Promise<ToolResult> {
  const status = String(params.status || 'all');

  try {
    const where: Record<string, unknown> = {};
    if (status !== 'all') where.status = status;

    const campaigns = await db.campaign.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    const formattedCampaigns = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      budget: c.budget,
      spent: c.spent,
      metrics: JSON.parse(c.metrics || '{}'),
      startDate: c.startDate?.toISOString() || null,
      endDate: c.endDate?.toISOString() || null,
    }));

    return {
      success: true,
      data: { campaigns: formattedCampaigns, total: campaigns.length, filter: status },
    };
  } catch (error) {
    console.error('[TOOL:campaign_list] Error:', error);
    return { success: false, data: null, error: 'Failed to list campaigns' };
  }
}

async function executeCampaignCreate(params: Record<string, unknown>): Promise<ToolResult> {
  const name = String(params.name || '');
  const type = String(params.type || '');
  const budget = Number(params.budget) || 0;

  const validTypes = ['email', 'social', 'ads', 'content'];
  if (!name) {
    return { success: false, data: null, error: 'Campaign name is required' };
  }
  if (!type || !validTypes.includes(type)) {
    return { success: false, data: null, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` };
  }

  try {
    const campaign = await db.campaign.create({
      data: {
        name,
        type,
        budget,
        metrics: '{}',
      },
    });

    return {
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        budget: campaign.budget,
        createdAt: campaign.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error('[TOOL:campaign_create] Error:', error);
    return { success: false, data: null, error: 'Failed to create campaign' };
  }
}

// ─── Calendar Tool Executors ────────────────────────────────────────

async function executeCalendarCheck(params: Record<string, unknown>): Promise<ToolResult> {
  const days = Number(params.days) || 7;

  try {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    const events = await db.calendarEvent.findMany({
      where: {
        startTime: {
          gte: now,
          lte: endDate,
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const formattedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      location: e.location,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      source: e.source,
    }));

    return {
      success: true,
      data: { events: formattedEvents, total: events.length, daysChecked: days },
    };
  } catch (error) {
    console.error('[TOOL:calendar_check] Error:', error);
    return { success: false, data: null, error: 'Failed to check calendar' };
  }
}

async function executeCalendarAdd(params: Record<string, unknown>): Promise<ToolResult> {
  const title = String(params.title || '');
  const startTime = String(params.startTime || '');
  const endTime = String(params.endTime || '');
  const description = params.description ? String(params.description) : undefined;
  const location = params.location ? String(params.location) : undefined;

  if (!title || !startTime || !endTime) {
    return { success: false, data: null, error: 'Title, startTime, and endTime are required' };
  }

  try {
    const event = await db.calendarEvent.create({
      data: {
        title,
        description: description || null,
        location: location || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        source: 'jarvis',
      },
    });

    return {
      success: true,
      data: {
        id: event.id,
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        description: event.description,
        location: event.location,
      },
    };
  } catch (error) {
    console.error('[TOOL:calendar_add] Error:', error);
    return { success: false, data: null, error: 'Failed to add calendar event' };
  }
}

// ─── Finance Tool Executors ─────────────────────────────────────────

const GATEWAY_URL = 'https://internal-api.z.ai';
const API_PREFIX = '/external/finance';

async function financeFetch(endpoint: string) {
  const url = `${GATEWAY_URL}${API_PREFIX}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-Z-AI-From': 'Z' },
  });
  if (!response.ok) {
    throw new Error(`Finance API error: ${response.status}`);
  }
  return response.json();
}

async function executeFinanceBriefing(): Promise<ToolResult> {
  try {
    // 1. Fetch major indices snapshots
    const indicesTickers = '^GSPC,^DJI,^IXIC,^BVSP';
    let indicesData: unknown = null;
    try {
      indicesData = await financeFetch(`/snapshot?ticker=${encodeURIComponent(indicesTickers)}`);
    } catch (err) {
      console.error('[TOOL:finance_briefing] Failed to fetch indices:', err);
    }

    // 2. Fetch market news
    let newsData: unknown[] = [];
    try {
      const newsResult = await financeFetch('/news');
      newsData = Array.isArray(newsResult) ? newsResult : [];
    } catch (err) {
      console.error('[TOOL:finance_briefing] Failed to fetch news:', err);
    }

    // 3. Use ZAI to generate a Portuguese briefing
    try {
      const zai = await getZAI();
      const briefingPrompt = `Você é J.A.R.V.I.S. Gerando briefing diário do mercado financeiro. Dados atuais:

Índices: ${JSON.stringify(indicesData)}
Notícias: ${JSON.stringify(newsData.slice(0, 5))}

Gere um briefing completo em português brasileiro com:
1. Panorama geral do mercado (alta/baixa/volatilidade)
2. Principais índices e suas variações
3. Destaque de 3 notícias mais relevantes
4. Recomendação geral (não é conselho financeiro)
5. Ações brasileiras se houver dados do Bovespa

Use um tom profissional mas acessível, como um assistente financeiro de elite.`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Você é um assistente financeiro JARVIS que gera briefings diários de mercado.' },
          { role: 'user', content: briefingPrompt },
        ],
        thinking: { type: 'disabled' },
      });

      const briefingText = completion.choices[0]?.message?.content || 'Não foi possível gerar o briefing no momento.';

      return {
        success: true,
        data: {
          briefing: briefingText,
          indices: indicesData,
          news: newsData.slice(0, 10),
        },
      };
    } catch (err) {
      console.error('[TOOL:finance_briefing] Failed to generate briefing:', err);
      return {
        success: true,
        data: {
          briefing: 'Erro ao gerar briefing com IA. Dados brutos disponíveis.',
          indices: indicesData,
          news: newsData.slice(0, 10),
        },
      };
    }
  } catch (error) {
    console.error('[TOOL:finance_briefing] Error:', error);
    return { success: false, data: null, error: 'Failed to generate market briefing' };
  }
}

async function executeFinanceQuote(params: Record<string, unknown>): Promise<ToolResult> {
  const ticker = String(params.ticker || '');
  if (!ticker) {
    return { success: false, data: null, error: 'Ticker parameter is required' };
  }

  try {
    const data = await financeFetch(`/quote?ticker=${encodeURIComponent(ticker)}&type=STOCKS`);
    return { success: true, data: { quote: data } };
  } catch (error) {
    console.error('[TOOL:finance_quote] Error:', error);
    return { success: false, data: null, error: 'Failed to get stock quote' };
  }
}

async function executeFinanceNews(params: Record<string, unknown>): Promise<ToolResult> {
  const ticker = params.ticker ? String(params.ticker) : undefined;

  try {
    let endpoint = '/news';
    if (ticker) {
      endpoint += `?ticker=${encodeURIComponent(ticker)}`;
    }
    const data = await financeFetch(endpoint);
    return { success: true, data: { news: data } };
  } catch (error) {
    console.error('[TOOL:finance_news] Error:', error);
    return { success: false, data: null, error: 'Failed to get financial news' };
  }
}

async function executeFinanceSearch(params: Record<string, unknown>): Promise<ToolResult> {
  const query = String(params.query || '');
  if (!query) {
    return { success: false, data: null, error: 'Query parameter is required' };
  }

  try {
    const data = await financeFetch(`/search?query=${encodeURIComponent(query)}`);
    return { success: true, data: { results: data } };
  } catch (error) {
    console.error('[TOOL:finance_search] Error:', error);
    return { success: false, data: null, error: 'Failed to search stocks' };
  }
}

async function executeFinanceAnalysis(params: Record<string, unknown>): Promise<ToolResult> {
  const ticker = String(params.ticker || '');
  if (!ticker) {
    return { success: false, data: null, error: 'Ticker parameter is required' };
  }

  try {
    // Fetch multiple data points for comprehensive analysis
    const [quoteData, profileData, financialsData, statisticsData, earningsData] = await Promise.allSettled([
      financeFetch(`/quote?ticker=${encodeURIComponent(ticker)}&type=STOCKS`),
      financeFetch(`/profile?ticker=${encodeURIComponent(ticker)}`),
      financeFetch(`/financials?ticker=${encodeURIComponent(ticker)}`),
      financeFetch(`/statistics?ticker=${encodeURIComponent(ticker)}`),
      financeFetch(`/earnings?ticker=${encodeURIComponent(ticker)}`),
    ]);

    const extractResult = (result: PromiseSettledResult<unknown>) =>
      result.status === 'fulfilled' ? result.value : null;

    return {
      success: true,
      data: {
        quote: extractResult(quoteData),
        profile: extractResult(profileData),
        financials: extractResult(financialsData),
        statistics: extractResult(statisticsData),
        earnings: extractResult(earningsData),
      },
    };
  } catch (error) {
    console.error('[TOOL:finance_analysis] Error:', error);
    return { success: false, data: null, error: 'Failed to analyze stock' };
  }
}

// ─── File Tool Executors ────────────────────────────────────────────

async function executeFileList(params: Record<string, unknown>): Promise<ToolResult> {
  const type = String(params.type || 'all');
  const search = params.search ? String(params.search) : undefined;

  try {
    const where: Record<string, unknown> = {};
    if (type !== 'all') where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const files = await db.fileItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const formattedFiles = files.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      path: f.path,
      tags: JSON.parse(f.tags || '[]'),
      createdAt: f.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: { files: formattedFiles, total: files.length, filter: type },
    };
  } catch (error) {
    console.error('[TOOL:file_list] Error:', error);
    return { success: false, data: null, error: 'Failed to list files' };
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
    case 'email_read':
      return executeEmailRead(params);
    case 'email_send':
      return executeEmailSend(params);
    case 'social_check':
      return executeSocialCheck(params);
    case 'social_post':
      return executeSocialPost(params);
    case 'campaign_list':
      return executeCampaignList(params);
    case 'campaign_create':
      return executeCampaignCreate(params);
    case 'calendar_check':
      return executeCalendarCheck(params);
    case 'calendar_add':
      return executeCalendarAdd(params);
    case 'file_list':
      return executeFileList(params);
    case 'finance_briefing':
      return executeFinanceBriefing();
    case 'finance_quote':
      return executeFinanceQuote(params);
    case 'finance_news':
      return executeFinanceNews(params);
    case 'finance_search':
      return executeFinanceSearch(params);
    case 'finance_analysis':
      return executeFinanceAnalysis(params);
    default:
      return {
        success: false,
        data: null,
        error: `Unknown tool: ${name}. Available tools: ${AVAILABLE_TOOLS.map((t) => t.name).join(', ')}`,
      };
  }
}
