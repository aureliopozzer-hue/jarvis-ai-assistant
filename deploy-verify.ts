import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

let conn: Client;

function exec(cmd: string, timeout = 30000): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', (d: Buffer) => { stdout += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); process.stderr.write(d.toString()); });
      stream.on('close', (code: number) => resolve({ stdout, stderr, code: code ?? 0 }));
    });
  });
}

async function main() {
  console.log('🚀 Connecting...');
  conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });
  console.log('✅ Connected!');

  try {
    // PM2 startup
    console.log('\n━━━ PM2 Startup ━━━');
    const startupResult = await exec('pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1');
    // Extract the sudo command from the output
    const sudoCmd = startupResult.stdout.match(/sudo .*/)?.[0];
    if (sudoCmd) {
      console.log(`Running: ${sudoCmd}`);
      await exec(sudoCmd + ' 2>&1');
    }
    await exec('pm2 save 2>&1');
    
    // Check PM2
    console.log('\n━━━ PM2 Status ━━━');
    await exec('pm2 list 2>&1');

    // Test API endpoints
    console.log('\n━━━ API Tests ━━━');
    await exec('curl -s http://localhost/api/jarvis/system 2>&1 | head -3');
    await exec('curl -s -o /dev/null -w "Weather API: HTTP %{http_code}\\n" "http://localhost/api/jarvis/weather?action=current&city=Sao+Paulo" 2>&1');
    await exec('curl -s -o /dev/null -w "Memory API: HTTP %{http_code}\\n" "http://localhost/api/jarvis/memory?type=insights" 2>&1');
    await exec('curl -s -o /dev/null -w "News API: HTTP %{http_code}\\n" "http://localhost/api/jarvis/news?action=headlines" 2>&1');

    // System resources
    console.log('\n━━━ System Resources ━━━');
    await exec('free -h | head -2');
    await exec('df -h / | tail -1');
    await exec('uptime');

    // PM2 logs
    console.log('\n━━━ PM2 Logs ━━━');
    await exec('pm2 logs jarvis --lines 15 --nostream 2>&1');

    console.log(`\n✅ JARVIS IS LIVE AND HEALTHY!`);
    console.log(`🌐 URL: http://${VPS_HOST}`);

  } finally {
    conn.end();
  }
}

main().catch(console.error);
