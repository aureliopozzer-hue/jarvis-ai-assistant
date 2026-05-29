import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ec2-user';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const JARVIS_PORT = 3005;

const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

function exec(cmd: string, conn: Client): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 EXEC: ${cmd.substring(0, 120)}${cmd.length > 120 ? '...' : ''}`);
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
  
  const conn = new Client();
  
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', () => {
      console.log('✅ Connected to VPS!');
      resolve();
    });
    conn.on('error', (err) => {
      console.error('❌ Connection error:', err.message);
      reject(err);
    });
    conn.connect({
      host: VPS_HOST,
      port: 22,
      username: VPS_USER,
      privateKey: privateKey,
    });
  });

  try {
    // Step 1: Check system info
    console.log('\n━━━ Step 1: System Info ━━━');
    await exec('uname -a && cat /etc/os-release | head -3 && free -h | head -2 && df -h / | tail -1', conn);

    // Step 2: Check what's already running
    console.log('\n━━━ Step 2: Running Services ━━━');
    await exec('pm2 list 2>/dev/null || echo "PM2 not installed" && netstat -tlnp 2>/dev/null || ss -tlnp', conn);

    // Step 3: Check if Bun is installed
    console.log('\n━━━ Step 3: Check Bun ━━━');
    const bunCheck = await exec('bun --version 2>/dev/null || echo "NOT_INSTALLED"', conn);

    // Step 4: Install Bun if needed
    if (bunCheck.stdout.includes('NOT_INSTALLED')) {
      console.log('\n━━━ Step 4: Installing Bun ━━━');
      await exec('curl -fsSL https://bun.sh/install | bash', conn);
      await exec('source ~/.bashrc && bun --version', conn);
    } else {
      console.log('\n━━━ Step 4: Bun already installed ━━━');
    }

    // Step 5: Install PM2 if needed
    console.log('\n━━━ Step 5: PM2 Check ━━━');
    const pm2Check = await exec('pm2 --version 2>/dev/null || echo "NOT_INSTALLED"', conn);
    if (pm2Check.stdout.includes('NOT_INSTALLED')) {
      console.log('Installing PM2...');
      await exec('npm install -g pm2 2>/dev/null || bun add -g pm2', conn);
    }

    // Step 6: Create project directory
    console.log('\n━━━ Step 6: Create Project Dir ━━━');
    await exec('mkdir -p /home/ec2-user/jarvis', conn);

    // Step 7: Check Nginx config
    console.log('\n━━━ Step 7: Nginx Config ━━━');
    await exec('cat /etc/nginx/nginx.conf 2>/dev/null | head -50 || echo "No nginx config found"', conn);
    await exec('ls /etc/nginx/sites-enabled/ 2>/dev/null || ls /etc/nginx/conf.d/ 2>/dev/null || echo "No sites dir"', conn);

    // Step 8: Check Node.js
    console.log('\n━━━ Step 8: Node.js Check ━━━');
    await exec('node --version 2>/dev/null || echo "NOT_INSTALLED" && npm --version 2>/dev/null || echo "NPM_NOT_INSTALLED"', conn);

    console.log('\n✅ VPS scan complete! Ready for deployment.');
    console.log('\nNext steps will be to:');
    console.log('1. Upload project files to VPS');
    console.log('2. Install dependencies');
    console.log('3. Build for production');
    console.log('4. Configure PM2');
    console.log('5. Configure Nginx reverse proxy');

  } finally {
    conn.end();
    console.log('\n🔌 Disconnected from VPS');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
