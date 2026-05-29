import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // ─── Email Accounts ─────────────────────────────────────────────
  const emailAccount1 = await db.emailAccount.create({
    data: {
      provider: 'gmail',
      email: 'tony.stark@starkindustries.com',
      accessToken: 'demo_access_token_gmail',
      refreshToken: 'demo_refresh_token_gmail',
      isActive: true,
      lastSync: new Date(),
    },
  });

  const emailAccount2 = await db.emailAccount.create({
    data: {
      provider: 'outlook',
      email: 'jarvis@avengers.org',
      accessToken: 'demo_access_token_outlook',
      refreshToken: 'demo_refresh_token_outlook',
      isActive: true,
      lastSync: new Date(),
    },
  });

  console.log(`  ✅ Created 2 email accounts`);

  // ─── Emails ──────────────────────────────────────────────────────
  const emailData = [
    {
      accountId: emailAccount1.id,
      messageId: 'msg_gmail_001',
      from: 'pepper.potts@starkindustries.com',
      to: 'tony.stark@starkindustries.com',
      subject: 'Reunião de Diretores - Q4 Results',
      body: 'Caro Tony, A reunião de diretores para discutir os resultados do Q4 foi marcada para sexta-feira às 14h. Por favor, revise os números antes da reunião. Atenciosamente, Pepper.',
      snippet: 'Caro Tony, A reunião de diretores para discutir os resultados do Q4 foi marcada para sexta-feira às 14h.',
      isRead: false,
      isStarred: true,
      labels: '["inbox", "important"]',
      receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccount1.id,
      messageId: 'msg_gmail_002',
      from: 'bruce.banner@avengers.org',
      to: 'tony.stark@starkindustries.com',
      subject: 'Resultados do Experimento Gamma',
      body: 'Tony, Os resultados do experimento Gamma-7 estão prontos. Descobrimos uma anomalia interessante nos dados de radiação. Precisamos discutir isso quando você tiver um tempo. - Bruce',
      snippet: 'Tony, Os resultados do experimento Gamma-7 estão prontos. Descobrimos uma anomalia interessante nos dados de radiação.',
      isRead: true,
      isStarred: false,
      labels: '["inbox"]',
      receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccount1.id,
      messageId: 'msg_gmail_003',
      from: 'happy.hogan@starkindustries.com',
      to: 'tony.stark@starkindustries.com',
      subject: 'Itinerário da Viagem - Tóquio',
      body: 'Chefe, Seu voo para Tóquio está confirmado para segunda-feira. Partida às 08:00 do LAX. O hotel e o transporte já estão reservados. - Happy',
      snippet: 'Chefe, Seu voo para Tóquio está confirmado para segunda-feira. Partida às 08:00 do LAX.',
      isRead: false,
      isStarred: false,
      labels: '["inbox", "travel"]',
      receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccount2.id,
      messageId: 'msg_outlook_001',
      from: 'nick.fury@shield.gov',
      to: 'jarvis@avengers.org',
      subject: 'Classified: Mission Briefing',
      body: 'JARVIS, Esta é uma mensagem automatizada. Nova ameaça detectada na região do Atlântico Norte. Iniciar protocolo de monitoramento nível 4. - Director Fury',
      snippet: 'JARVIS, Esta é uma mensagem automatizada. Nova ameaça detectada na região do Atlântico Norte.',
      isRead: false,
      isStarred: true,
      labels: '["inbox", "classified"]',
      receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      accountId: emailAccount2.id,
      messageId: 'msg_outlook_002',
      from: 'friday@starkindustries.com',
      to: 'jarvis@avengers.org',
      subject: 'Relatório de Manutenção do Mark XLII',
      body: 'Olá JARVIS, O relatório de manutenção do Mark XLII indica que os repulsores precisam de recalibração. O nível de energia do reator arc está em 94.7%. Recomendo agendar manutenção. - FRIDAY',
      snippet: 'Olá JARVIS, O relatório de manutenção do Mark XLII indica que os repulsores precisam de recalibração.',
      isRead: true,
      isStarred: false,
      labels: '["inbox", "maintenance"]',
      receivedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  ];

  for (const email of emailData) {
    await db.email.create({ data: email });
  }
  console.log(`  ✅ Created ${emailData.length} emails`);

  // ─── Social Accounts ─────────────────────────────────────────────
  const socialAccount1 = await db.socialAccount.create({
    data: {
      platform: 'instagram',
      username: '@starkindustries',
      accessToken: 'demo_ig_token',
      isActive: true,
      lastSync: new Date(),
    },
  });

  const socialAccount2 = await db.socialAccount.create({
    data: {
      platform: 'twitter',
      username: '@tonystark',
      accessToken: 'demo_tw_token',
      isActive: true,
      lastSync: new Date(),
    },
  });

  const socialAccount3 = await db.socialAccount.create({
    data: {
      platform: 'linkedin',
      username: 'Tony Stark',
      accessToken: 'demo_li_token',
      isActive: true,
      lastSync: new Date(),
    },
  });

  console.log(`  ✅ Created 3 social accounts`);

  // ─── Social Posts ────────────────────────────────────────────────
  const socialPosts = [
    {
      accountId: socialAccount1.id,
      postId: 'ig_001',
      content: '🚀 Stark Industries anuncia novo laboratório de IA em São Paulo! #StarkTech #Innovation',
      mediaUrls: '["https://example.com/lab.jpg"]',
      likes: 15420,
      comments: 892,
      shares: 3201,
      postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      accountId: socialAccount1.id,
      postId: 'ig_002',
      content: 'Por trás das cenas: Nosso novo reator arc compacto. Mais energia, menos impacto ambiental. 🌍⚡ #CleanEnergy',
      mediaUrls: '["https://example.com/reactor.jpg"]',
      likes: 28750,
      comments: 1432,
      shares: 5601,
      postedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    },
    {
      accountId: socialAccount2.id,
      postId: 'tw_001',
      content: 'Just finished debugging the new JARVIS module at 3 AM. Sometimes the best ideas come when you should be sleeping. 💡 #DevLife',
      mediaUrls: '[]',
      likes: 45230,
      comments: 2100,
      shares: 8900,
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      accountId: socialAccount2.id,
      postId: 'tw_002',
      content: 'Announcing the Stark Fellowship Program - supporting the next generation of innovators. Applications open next week! 🎓',
      mediaUrls: '[]',
      likes: 32100,
      comments: 1560,
      shares: 6700,
      postedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      accountId: socialAccount3.id,
      postId: 'li_001',
      content: 'Excited to share that Stark Industries has been named #1 in Forbes Most Innovative Companies for the 5th consecutive year. This is a testament to our incredible team.',
      mediaUrls: '[]',
      likes: 8920,
      comments: 432,
      shares: 1560,
      postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];

  for (const post of socialPosts) {
    await db.socialPost.create({ data: post });
  }
  console.log(`  ✅ Created ${socialPosts.length} social posts`);

  // ─── Campaigns ───────────────────────────────────────────────────
  const campaigns = [
    {
      name: 'Stark Tech Launch - Q4',
      type: 'ads',
      status: 'active',
      budget: 50000,
      spent: 32500,
      metrics: JSON.stringify({ impressions: 1250000, clicks: 45000, conversions: 1200, ctr: 3.6, roi: 2.4 }),
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-03-31'),
    },
    {
      name: 'Newsletter - Product Update',
      type: 'email',
      status: 'draft',
      budget: 5000,
      spent: 0,
      metrics: JSON.stringify({ impressions: 0, clicks: 0, conversions: 0, ctr: 0, roi: 0 }),
      startDate: null,
      endDate: null,
    },
    {
      name: 'Instagram Influencer Campaign',
      type: 'social',
      status: 'active',
      budget: 25000,
      spent: 18750,
      metrics: JSON.stringify({ impressions: 890000, clicks: 32000, conversions: 890, ctr: 3.6, roi: 1.8 }),
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
    },
    {
      name: 'Blog Content Strategy',
      type: 'content',
      status: 'completed',
      budget: 10000,
      spent: 9800,
      metrics: JSON.stringify({ impressions: 450000, clicks: 18000, conversions: 560, ctr: 4.0, roi: 3.2 }),
      startDate: new Date('2024-10-01'),
      endDate: new Date('2024-12-31'),
    },
    {
      name: 'Holiday Promotional Ads',
      type: 'ads',
      status: 'paused',
      budget: 75000,
      spent: 45000,
      metrics: JSON.stringify({ impressions: 2100000, clicks: 68000, conversions: 2100, ctr: 3.2, roi: 2.1 }),
      startDate: new Date('2024-11-15'),
      endDate: new Date('2025-01-15'),
    },
  ];

  for (const campaign of campaigns) {
    await db.campaign.create({ data: campaign });
  }
  console.log(`  ✅ Created ${campaigns.length} campaigns`);

  // ─── Calendar Events ─────────────────────────────────────────────
  const now = new Date();
  const calendarEvents = [
    {
      title: 'Reunião de Diretores - Q4',
      description: 'Apresentação dos resultados do quarto trimestre',
      location: 'Sala de Conferências A - Torre Stark',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 16, 0),
      reminder: 30,
      source: 'jarvis',
    },
    {
      title: 'Demo do Novo JARVIS Module',
      description: 'Demonstração do módulo de visão computacional para a equipe de P&D',
      location: 'Lab 3 - Piso 42',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 11, 30),
      reminder: 15,
      source: 'jarvis',
    },
    {
      title: 'Entrevista - Forbes Innovation',
      description: 'Entrevista para matéria sobre inovação em IA',
      location: 'Virtual - Zoom',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 45),
      reminder: 10,
      source: 'google',
    },
    {
      title: 'Treinamento de Segurança',
      description: 'Treinamento trimestral de protocolos de segurança',
      location: 'Auditório Principal',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 9, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 12, 0),
      recurrence: 'FREQ=MONTHLY;COUNT=4',
      reminder: 60,
      source: 'outlook',
    },
    {
      title: 'Review do Sprint - Equipe Frontend',
      description: 'Revisão do sprint e planejamento do próximo',
      location: 'Sala Ágil - 2º andar',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 17, 0),
      reminder: 15,
      source: 'jarvis',
    },
    {
      title: 'Almoço com Pepper',
      description: '',
      location: 'Restaurante Le Bernardin',
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 30),
      endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0),
      reminder: 30,
      source: 'jarvis',
    },
  ];

  for (const event of calendarEvents) {
    await db.calendarEvent.create({ data: event });
  }
  console.log(`  ✅ Created ${calendarEvents.length} calendar events`);

  // ─── Files ───────────────────────────────────────────────────────
  const files = [
    {
      name: 'Q4_Financial_Report.pdf',
      type: 'document',
      size: 2456789,
      path: '/documents/reports/Q4_Financial_Report.pdf',
      content: 'Stark Industries Q4 Financial Report - Revenue: $12.5B, Net Income: $3.2B, R&D Investment: $1.8B',
      tags: '["financial", "report", "Q4"]',
    },
    {
      name: 'Mark_XLII_Blueprint.dwg',
      type: 'document',
      size: 15678901,
      path: '/projects/mark42/Blueprint.dwg',
      content: 'Mark XLII Armor Blueprint - Repulsor Configuration, Arc Reactor Integration, Flight System Layout',
      tags: '["engineering", "mark42", "blueprint"]',
    },
    {
      name: 'JARVIS_Architecture.md',
      type: 'code',
      size: 45678,
      path: '/projects/jarvis/docs/Architecture.md',
      content: '# JARVIS Architecture\n## Overview\nMulti-agent AI system with tool calling capabilities\n## Components\n- Chat Engine\n- Vision Module\n- Voice Pipeline\n- Memory System',
      tags: '["jarvis", "documentation", "architecture"]',
    },
    {
      name: 'Campaign_Analytics_Q4.xlsx',
      type: 'spreadsheet',
      size: 890123,
      path: '/marketing/analytics/Q4_Campaigns.xlsx',
      content: 'Campaign Analytics Q4 - Total Impressions: 4.2M, Total Clicks: 156K, Avg CTR: 3.7%, Total ROI: 2.3x',
      tags: '["marketing", "analytics", "Q4"]',
    },
    {
      name: 'Arc_Reactor_Schematic.png',
      type: 'image',
      size: 3456789,
      path: '/projects/arc-reactor/schematic.png',
      content: null,
      tags: '["engineering", "arc-reactor", "schematic"]',
    },
    {
      name: 'Server_Monitor_Config.json',
      type: 'code',
      size: 2345,
      path: '/config/monitor.json',
      content: '{ "interval": 5000, "thresholds": { "cpu": 80, "memory": 90, "disk": 85 }, "alerts": true }',
      tags: '["config", "monitoring", "server"]',
    },
  ];

  for (const file of files) {
    await db.fileItem.create({ data: file });
  }
  console.log(`  ✅ Created ${files.length} files`);

  // ─── Stripe Config ───────────────────────────────────────────────
  await db.stripeConfig.create({
    data: {
      publicKey: 'pk_test_demo_1234567890',
      secretKey: 'sk_test_demo_0987654321',
      webhookSecret: 'whsec_demo_abcdef',
      isActive: true,
      mode: 'test',
    },
  });
  console.log(`  ✅ Created Stripe config`);

  // ─── Subscription ────────────────────────────────────────────────
  const periodStart = new Date('2025-01-01');
  const periodEnd = new Date('2025-02-01');
  await db.subscription.create({
    data: {
      customerId: 'cus_demo_stark_001',
      email: 'tony.stark@starkindustries.com',
      plan: 'enterprise',
      status: 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });
  console.log(`  ✅ Created subscription`);

  console.log('\n🎉 Demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
