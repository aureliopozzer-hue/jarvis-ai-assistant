import { NextResponse } from 'next/server';
import os from 'os';

interface CpuTimes {
  idle: number;
  total: number;
}

function getCpuTimes(): CpuTimes {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += (cpu.times as Record<string, number>)[type];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

function calculateRealtimeCpuUsage(): Promise<{
  usage: number;
  cores: number;
  model: string;
  speeds: number[];
}> {
  const cpus = os.cpus();
  const cores = cpus.length;

  if (cores === 0) {
    return Promise.resolve({ usage: 0, cores: 0, model: 'unknown', speeds: [] });
  }

  const model = cpus[0].model;
  const speeds = cpus.map((cpu) => cpu.speed);

  // Take two samples 1 second apart to compute real-time CPU usage
  const sample1 = getCpuTimes();

  return new Promise((resolve) => {
    setTimeout(() => {
      const sample2 = getCpuTimes();

      const idleDiff = sample2.idle - sample1.idle;
      const totalDiff = sample2.total - sample1.total;

      const usage = totalDiff > 0
        ? ((totalDiff - idleDiff) / totalDiff) * 100
        : 0;

      resolve({
        usage: Math.round(usage * 100) / 100,
        cores,
        model,
        speeds,
      });
    }, 1000);
  });
}

function getMemoryInfo(): {
  total: number;
  used: number;
  free: number;
  percentage: number;
} {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return {
    total,
    used,
    free,
    percentage: Math.round(percentage * 100) / 100,
  };
}

function getNetworkInfo(): Array<{
  name: string;
  addresses: Array<{ family: string; address: string }>;
}> {
  const interfaces = os.networkInterfaces();
  const result: Array<{
    name: string;
    addresses: Array<{ family: string; address: string }>;
  }> = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    const addresses = nets
      .filter((net) => !net.internal)
      .map((net) => ({
        family: net.family,
        address: net.address,
      }));
    if (addresses.length > 0) {
      result.push({ name, addresses });
    }
  }

  return result;
}

export async function GET() {
  try {
    const cpu = await calculateRealtimeCpuUsage();
    const memory = getMemoryInfo();
    const uptime = os.uptime();
    const loadAvg = os.loadavg();
    const platform = os.platform();
    const hostname = os.hostname();
    const network = getNetworkInfo();

    return NextResponse.json({
      cpu,
      memory,
      uptime,
      loadAvg: loadAvg.map((v) => Math.round(v * 100) / 100),
      platform,
      hostname,
      network,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[JARVIS SYSTEM ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao obter informações do sistema' },
      { status: 500 }
    );
  }
}
