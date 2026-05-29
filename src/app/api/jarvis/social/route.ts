import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List social accounts and their posts (with optional platform filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const includePosts = searchParams.get('includePosts') !== 'false';

    const where: Record<string, unknown> = {};
    if (platform) where.platform = platform;

    const accounts = await db.socialAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includePosts
        ? {
            posts: {
              orderBy: { postedAt: 'desc' },
              take: 20,
            },
          }
        : false,
    });

    const totalPosts = await db.socialPost.count(
      platform ? { where: { account: { platform } } } : undefined
    );

    return NextResponse.json({ accounts, totalPosts });
  } catch (error) {
    console.error('[JARVIS SOCIAL GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas sociais' },
      { status: 500 }
    );
  }
}

// POST - Create a new social post (simulated - stores in DB)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, content, mediaUrls } = body as {
      accountId?: string;
      content?: string;
      mediaUrls?: string[];
    };

    if (!accountId || !content) {
      return NextResponse.json(
        { error: 'accountId e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    const account = await db.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return NextResponse.json(
        { error: 'Conta social não encontrada' },
        { status: 404 }
      );
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const post = await db.socialPost.create({
      data: {
        accountId,
        postId,
        content,
        mediaUrls: JSON.stringify(mediaUrls || []),
        likes: 0,
        comments: 0,
        shares: 0,
        postedAt: new Date(),
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS SOCIAL POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar post' },
      { status: 500 }
    );
  }
}

// PUT - Update account sync status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, isActive, lastSync } = body as {
      accountId?: string;
      isActive?: boolean;
      lastSync?: string;
    };

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.socialAccount.findUnique({
      where: { id: accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Conta social não encontrada' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (lastSync !== undefined) data.lastSync = new Date(lastSync);
    else data.lastSync = new Date();

    const account = await db.socialAccount.update({
      where: { id: accountId },
      data,
      include: { posts: { orderBy: { postedAt: 'desc' }, take: 10 } },
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('[JARVIS SOCIAL PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conta social' },
      { status: 500 }
    );
  }
}
