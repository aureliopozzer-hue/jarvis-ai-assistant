import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

let conn: Client;

function exec(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 EXEC: ${cmd.substring(0, 150)}${cmd.length > 150 ? '...' : ''}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', (data: Buffer) => {
        stdout += data.toString();
        process.stdout.write(data.toString());
      });
      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        process.stderr.write(data.toString());
      });
      stream.on('close', (code: number) => {
        resolve({ stdout, stderr, code: code ?? 0 });
      });
    });
  });
}

async function main() {
  console.log('🚀 Connecting to VPS...');
  conn = new Client();

  await new Promise<void>((resolve, reject) => {
    conn.on('ready', () => {
      console.log('✅ Connected!');
      resolve();
    });
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });

  try {
    // System info
    console.log('\n━━━ System Info ━━━');
    await exec('uname -a');
    await exec('cat /etc/os-release | head -4');
    await exec('free -h | head -2');
    await exec('df -h / | tail -1');

    // Running services
    console.log('\n━━━ Running Services ━━━');
    await exec('pm2 list 2>/dev/null || echo "PM2 not found"');
    await exec('ss -tlnp 2>/dev/null | head -20');

    // Node/Bun check
    console.log('\n━━━ Node/Bun/PM2 ━━━');
    await exec('node --version 2>/dev/null && npm --version 2>/dev/null && bun --version 2>/dev/null && pm2 --version 2>/dev/null || echo "Some not installed"');

    // Nginx check
    console.log('\n━━━ Nginx ━━━');
    await exec('nginx -v 2>&1 || echo "Nginx not installed"');
    await exec('cat /etc/nginx/sites-enabled/* 2>/dev/null | head -60 || echo "No sites config"');

    // Check existing projects
    console.log('\n━━━ Existing Projects ━━━');
    await exec('ls -la /home/ubuntu/ 2>/dev/null | head -20');

    // Disk space
    console.log('\n━━━ Disk Space ━━━');
    await exec('df -h');

  } finally {
    conn.end();
  }
}

main().catch(console.error);
