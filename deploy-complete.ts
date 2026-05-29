import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const BUN = '/home/ubuntu/.bun/bin/bun';
const PM2 = '/usr/lib/node_modules/pm2/bin/pm2';
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

function uploadBuffer(buffer: Buffer, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const ws = sftp.createWriteStream(remotePath);
      ws.on('close', resolve);
      ws.on('error', reject);
      ws.write(buffer);
      ws.end();
    });
  });
}

async function main() {
  console.log('🚀 Connecting to VPS...');
  conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });
  console.log('✅ Connected!');

  try {
    // Step A: Install ALL dependencies (including dev)
    console.log('\n━━━ Installing ALL deps (including dev) ━━━');
    await exec(`cd /home/ubuntu/jarvis && ${BUN} install 2>&1 | tail -10`, 120000);

    // Step B: Build
    console.log('\n━━━ Building ━━━');
    await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db NODE_ENV=production ${BUN} run build 2>&1`, 300000);

    // Step C: Copy static files
    console.log('\n━━━ Copying static files ━━━');
    await exec('cp -r /home/ubuntu/jarvis/.next/static /home/ubuntu/jarvis/.next/standalone/.next/ 2>&1');
    await exec('cp -r /home/ubuntu/jarvis/public /home/ubuntu/jarvis/.next/standalone/ 2>&1');
    await exec('ls /home/ubuntu/jarvis/.next/standalone/ 2>&1 | head -10');

    // Step D: Install PM2
    console.log('\n━━━ Installing PM2 ━━━');
    const pm2check = await exec('which pm2 2>/dev/null || echo "NOT_FOUND"');
    if (pm2check.stdout.includes('NOT_FOUND')) {
      await exec('sudo npm install -g pm2 2>&1 | tail -5', 60000);
    }
    await exec('pm2 --version 2>/dev/null || echo "PM2 STILL NOT FOUND"');

    // Step E: Start JARVIS
    console.log('\n━━━ Starting JARVIS ━━━');
    await exec('pm2 delete jarvis 2>/dev/null || true');
    await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db HOSTNAME=0.0.0.0 PORT=3005 pm2 start .next/standalone/server.js --name jarvis 2>&1`);
    await exec('sleep 5 && pm2 list 2>&1');
    await exec('pm2 save 2>&1');

    // Step F: Configure Nginx
    console.log('\n━━━ Configuring Nginx ━━━');
    const nginxConfig = `server {
    listen 80 default_server;
    server_name _;

    # BeautyFlow WhatsApp API
    location /whatsapp/ {
        proxy_pass http://127.0.0.1:3004/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        client_max_body_size 50M;
    }

    location /health {
        proxy_pass http://127.0.0.1:3004/api/status;
    }

    # JARVIS AI Assistant - main app
    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 50M;
    }
}`;
    await uploadBuffer(Buffer.from(nginxConfig), '/tmp/jarvis-nginx.conf');
    await exec('sudo cp /tmp/jarvis-nginx.conf /etc/nginx/sites-enabled/default 2>&1');
    await exec('sudo nginx -t 2>&1');
    await exec('sudo systemctl reload nginx 2>&1');

    // Step G: Test
    console.log('\n━━━ Testing ━━━');
    await exec('curl -s -o /dev/null -w "JARVIS (direct): HTTP %{http_code}\\n" http://localhost:3005/ 2>&1');
    await exec('curl -s -o /dev/null -w "Nginx (proxy): HTTP %{http_code}\\n" http://localhost/ 2>&1');
    await exec(`curl -s http://localhost:3005/api/jarvis/system 2>&1 | head -3`);
    await exec('pm2 list 2>&1');

    console.log(`\n🎉 JARVIS DEPLOYED: http://${VPS_HOST}`);

  } finally {
    conn.end();
  }
}

main().catch(console.error);
