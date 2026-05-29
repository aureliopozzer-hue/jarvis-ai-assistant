import { db } from '@/lib/db';

async function seedFinance() {
  console.log('🌱 Seeding Finance Watchlist...');

  const defaultWatchlist = [
    { ticker: 'AAPL', name: 'Apple Inc.', type: 'STOCKS', quantity: 10, avgPrice: 175.50 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', type: 'STOCKS', quantity: 5, avgPrice: 380.00 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCKS', quantity: 8, avgPrice: 140.25 },
    { ticker: 'TSLA', name: 'Tesla Inc.', type: 'STOCKS', quantity: 3, avgPrice: 245.00 },
    { ticker: 'PETR4.SA', name: 'Petrobras PN', type: 'STOCKS', quantity: 100, avgPrice: 36.80 },
    { ticker: 'VALE3.SA', name: 'Vale ON', type: 'STOCKS', quantity: 50, avgPrice: 68.50 },
    { ticker: '^BVSP', name: 'Ibovespa', type: 'INDEX' },
    { ticker: 'BTC-USD', name: 'Bitcoin USD', type: 'CRYPTO', quantity: 0.5, avgPrice: 42000.00 },
  ];

  for (const item of defaultWatchlist) {
    await db.financeWatchlist.upsert({
      where: { ticker: item.ticker },
      update: {
        name: item.name,
        type: item.type,
        quantity: item.quantity ?? null,
        avgPrice: item.avgPrice ?? null,
      },
      create: {
        ticker: item.ticker,
        name: item.name,
        type: item.type,
        quantity: item.quantity ?? null,
        avgPrice: item.avgPrice ?? null,
      },
    });
    console.log(`  ✅ ${item.ticker} - ${item.name}`);
  }

  // Seed some default alerts
  console.log('🌱 Seeding Finance Alerts...');

  const defaultAlerts = [
    { ticker: 'AAPL', type: 'above', value: 200 },
    { ticker: 'AAPL', type: 'below', value: 150 },
    { ticker: 'BTC-USD', type: 'change_percent', value: 5 },
    { ticker: 'PETR4.SA', type: 'above', value: 40 },
  ];

  for (const alert of defaultAlerts) {
    const existing = await db.financeAlert.findFirst({
      where: {
        ticker: alert.ticker,
        type: alert.type,
        value: alert.value,
      },
    });

    if (!existing) {
      await db.financeAlert.create({
        data: {
          ticker: alert.ticker,
          type: alert.type,
          value: alert.value,
          isActive: true,
          triggered: false,
        },
      });
      console.log(`  ✅ Alert: ${alert.ticker} ${alert.type} ${alert.value}`);
    } else {
      console.log(`  ⏭️  Alert already exists: ${alert.ticker} ${alert.type} ${alert.value}`);
    }
  }

  console.log('🎉 Finance seeding complete!');
}

seedFinance()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
