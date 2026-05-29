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
  console.log('🚀 Connecting...');
  conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });
  console.log('✅ Connected!');

  try {
    // Check current nginx configs
    console.log('\n━━━ Current Nginx Sites ━━━');
    await exec('ls -la /etc/nginx/sites-enabled/');
    await exec('cat /etc/nginx/sites-enabled/beautyflow 2>/dev/null');
    await exec('cat /etc/nginx/sites-enabled/jarvis 2>/dev/null');

    // Remove conflicting beautyflow config (we merged it into jarvis config)
    console.log('\n━━━ Remove conflicting config ━━━');
    await exec('sudo rm -f /etc/nginx/sites-enabled/beautyflow 2>&1');
    await exec('sudo rm -f /etc/nginx/sites-enabled/default 2>&1');

    // Make jarvis config the only one
    // Rewrite the jarvis config to be proper
    const nginxConfig = `# JARVIS AI Assistant - Main Site Configuration
server {
    listen 80;
    server_name _;

    # JARVIS AI Assistant - all traffic
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
    await exec('sudo cp /tmp/jarvis-nginx.conf /etc/nginx/sites-enabled/jarvis 2>&1');
    await exec('sudo chown root:root /etc/nginx/sites-enabled/jarvis 2>&1');
    await exec('sudo nginx -t 2>&1');
    await exec('sudo systemctl restart nginx 2>&1');
    
    // Test
    console.log('\n━━━ Testing ━━━');
    await exec('sleep 2 && curl -s -o /dev/null -w "Nginx proxy: HTTP %{http_code}\\n" http://localhost/ 2>&1');
    await exec('curl -s -o /dev/null -w "JARVIS direct: HTTP %{http_code}\\n" http://localhost:3005/ 2>&1');
    await exec('curl -s http://localhost/ | head -5');
    await exec('curl -s http://localhost/api/jarvis/system 2>&1 | head -5');
    
    // PM2 startup
    console.log('\n━━━ PM2 Startup ━━━');
    await exec('pm2 save 2>&1');
    await exec('pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | tail -3');
    
    // Final check
    console.log('\n━━━ Final Status ━━━');
    await exec('pm2 list 2>&1');
    await exec('free -h | head -2');
    await exec('df -h / | tail -1');
    
    console.log(`\n🎉 JARVIS IS LIVE: http://${VPS_HOST}`);
    
  } finally {
    conn.end();
  }
}

main().catch(console.error);
