import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List emails with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const isStarred = searchParams.get('isStarred');
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};

    if (isRead !== null) where.isRead = isRead === 'true';
    if (isStarred !== null) where.isStarred = isStarred === 'true';
    if (accountId) where.accountId = accountId;

    const [emails, total] = await Promise.all([
      db.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
        include: { account: { select: { provider: true, email: true } } },
      }),
      db.email.count({ where }),
    ]);

    return NextResponse.json({ emails, total, limit, offset });
  } catch (error) {
    console.error('[JARVIS EMAIL GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar e-mails' },
      { status: 500 }
    );
  }
}

// POST - Create/send email (simulated - stores in DB)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, to, subject, body: emailBody } = body as {
      accountId?: string;
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Destinatário, assunto e corpo são obrigatórios' },
        { status: 400 }
      );
    }

    // Find or create a default account
    let account;
    if (accountId) {
      account = await db.emailAccount.findUnique({ where: { id: accountId } });
      if (!account) {
        return NextResponse.json(
          { error: 'Conta de e-mail não encontrada' },
          { status: 404 }
        );
      }
    } else {
      // Use the first active account
      account = await db.emailAccount.findFirst({ where: { isActive: true } });
      if (!account) {
        return NextResponse.json(
          { error: 'Nenhuma conta de e-mail ativa encontrada' },
          { status: 404 }
        );
      }
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const snippet = emailBody.substring(0, 200);

    const email = await db.email.create({
      data: {
        accountId: account.id,
        messageId,
        from: account.email,
        to,
        subject,
        body: emailBody,
        snippet,
        isRead: true,
        labels: '["sent"]',
        receivedAt: new Date(),
      },
      include: { account: { select: { provider: true, email: true } } },
    });

    return NextResponse.json({ email }, { status: 201 });
  } catch (error) {
    console.error('[JARVIS EMAIL POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao enviar e-mail' },
      { status: 500 }
    );
  }
}

// PUT - Update email (mark as read, star/unstar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, isStarred, labels } = body as {
      id?: string;
      isRead?: boolean;
      isStarred?: boolean;
      labels?: string[];
    };

    if (!id) {
      return NextResponse.json(
        { error: 'ID do e-mail é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.email.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'E-mail não encontrado' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (isRead !== undefined) data.isRead = isRead;
    if (isStarred !== undefined) data.isStarred = isStarred;
    if (labels !== undefined) data.labels = JSON.stringify(labels);

    const email = await db.email.update({
      where: { id },
      data,
      include: { account: { select: { provider: true, email: true } } },
    });

    return NextResponse.json({ email });
  } catch (error) {
    console.error('[JARVIS EMAIL PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar e-mail' },
      { status: 500 }
    );
  }
}
