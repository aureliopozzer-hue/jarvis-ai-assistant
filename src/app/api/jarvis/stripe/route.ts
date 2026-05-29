import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Get Stripe config and subscription status
export async function GET() {
  try {
    const [stripeConfigs, subscriptions] = await Promise.all([
      db.stripeConfig.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Mask sensitive keys for security
    const maskedConfigs = stripeConfigs.map((config) => ({
      ...config,
      secretKey: config.secretKey
        ? `${config.secretKey.substring(0, 8)}...${config.secretKey.substring(config.secretKey.length - 4)}`
        : '',
      webhookSecret: config.webhookSecret ? '***configured***' : null,
    }));

    return NextResponse.json({
      stripeConfig: maskedConfigs[0] || null,
      subscriptions,
    });
  } catch (error) {
    console.error('[JARVIS STRIPE GET ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações do Stripe' },
      { status: 500 }
    );
  }
}

// POST - Configure Stripe keys / create checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'configure') {
      const { publicKey, secretKey, webhookSecret, mode } = body as {
        publicKey?: string;
        secretKey?: string;
        webhookSecret?: string;
        mode?: string;
      };

      if (!publicKey || !secretKey) {
        return NextResponse.json(
          { error: 'Chave pública e secreta são obrigatórias' },
          { status: 400 }
        );
      }

      // Deactivate existing configs
      await db.stripeConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      const config = await db.stripeConfig.create({
        data: {
          publicKey,
          secretKey,
          webhookSecret: webhookSecret || null,
          mode: mode || 'test',
        },
      });

      return NextResponse.json({ config }, { status: 201 });
    }

    if (action === 'checkout') {
      const { customerId, email, plan } = body as {
        customerId?: string;
        email?: string;
        plan?: string;
      };

      if (!customerId || !email || !plan) {
        return NextResponse.json(
          { error: 'customerId, email e plano são obrigatórios' },
          { status: 400 }
        );
      }

      const validPlans = ['free', 'pro', 'enterprise'];
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: `Plano inválido. Planos válidos: ${validPlans.join(', ')}` },
          { status: 400 }
        );
      }

      // Simulated checkout session
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscription = await db.subscription.create({
        data: {
          customerId,
          email,
          plan,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      return NextResponse.json(
        {
          sessionId: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          subscription,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'Ação inválida. Use "configure" ou "checkout"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[JARVIS STRIPE POST ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição Stripe' },
      { status: 500 }
    );
  }
}

// PUT - Update subscription
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, plan, status, cancelAtPeriodEnd } = body as {
      id?: string;
      plan?: string;
      status?: string;
      cancelAtPeriodEnd?: boolean;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await db.subscription.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Assinatura não encontrada' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (plan) {
      const validPlans = ['free', 'pro', 'enterprise'];
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: `Plano inválido. Planos válidos: ${validPlans.join(', ')}` },
          { status: 400 }
        );
      }
      data.plan = plan;
    }
    if (status) {
      const validStatuses = ['active', 'canceled', 'past_due', 'trialing'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status inválido. Status válidos: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      data.status = status;
    }
    if (cancelAtPeriodEnd !== undefined) {
      data.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }

    const subscription = await db.subscription.update({
      where: { id },
      data,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('[JARVIS STRIPE PUT ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar assinatura' },
      { status: 500 }
    );
  }
}
