import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const BUN = '/home/ubuntu/.bun/bin/bun';
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
  const step = process.env.STEP || 'fix1';

  console.log(`🚀 Connecting (step: ${step})...`);
  conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });
  console.log('✅ Connected!');

  try {
    if (step === 'fix1') {
      // Fix 1: Remove old package.json, upload fresh one with ALL deps, reinstall
      console.log('\n━━━ Fix 1: Full reinstall with dev deps ━━━');
      
      // Remove node_modules and reinstall
      await exec(`cd /home/ubuntu/jarvis && rm -rf node_modules`);
      
      // Upload fresh package.json
      const pkgJson = fs.readFileSync('/home/z/my-project/package.json', 'utf8');
      await uploadBuffer(Buffer.from(pkgJson), '/home/ubuntu/jarvis/package.json');
      
      // Install ALL deps
      await exec(`cd /home/ubuntu/jarvis && ${BUN} install --no-save 2>&1 | tail -10`, 180000);
      
      // Verify tw-animate-css exists
      await exec(`ls /home/ubuntu/jarvis/node_modules/tw-animate-css/ 2>/dev/null | head -5 || echo "MISSING tw-animate-css"`);
      
      // Also upload postcss config
      const postcssConfig = fs.readFileSync('/home/z/my-project/postcss.config.mjs', 'utf8');
      await uploadBuffer(Buffer.from(postcssConfig), '/home/ubuntu/jarvis/postcss.config.mjs');
      
      // Upload tailwind config if exists
      try {
        const twConfig = fs.readFileSync('/home/z/my-project/tailwind.config.ts', 'utf8');
        await uploadBuffer(Buffer.from(twConfig), '/home/ubuntu/jarvis/tailwind.config.ts');
      } catch { /* no tailwind config file */ }
      
      console.log('✅ Fix 1 done - deps reinstalled');
    }
    
    else if (step === 'build') {
      // Build
      console.log('\n━━━ Build ━━━');
      await exec(`cd /home/ubuntu/jarvis && rm -rf .next`);
      await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db NODE_ENV=production ${BUN} run build 2>&1`, 300000);
      await exec('ls -la /home/ubuntu/jarvis/.next/standalone/ 2>/dev/null | head -10');
      console.log('✅ Build done');
    }

    else if (step === 'start') {
      // Copy static + start
      console.log('\n━━━ Copy static + Start ━━━');
      
      // Copy static files to standalone
      await exec('mkdir -p /home/ubuntu/jarvis/.next/standalone/.next/ 2>/dev/null');
      await exec('cp -r /home/ubuntu/jarvis/.next/static /home/ubuntu/jarvis/.next/standalone/.next/ 2>&1');
      await exec('cp -r /home/ubuntu/jarvis/public /home/ubuntu/jarvis/.next/standalone/ 2>&1');
      
      // Verify standalone server.js exists
      await exec('ls -la /home/ubuntu/jarvis/.next/standalone/server.js 2>/dev/null');
      
      // Start with PM2
      await exec('pm2 delete jarvis 2>/dev/null || true');
      await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db HOSTNAME=0.0.0.0 PORT=3005 pm2 start .next/standalone/server.js --name jarvis 2>&1`);
      await exec('sleep 5 && pm2 list 2>&1');
      
      // Test direct
      await exec('curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3005/ 2>&1');
      await exec('pm2 save 2>&1');
      console.log('✅ Started');
    }

    else if (step === 'nginx') {
      // Fix Nginx
      console.log('\n━━━ Fix Nginx ━━━');
      
      // Remove old default config conflict
      await exec('sudo rm -f /etc/nginx/sites-enabled/default 2>&1');
      
      // Remove any other conflicting configs
      await exec('ls /etc/nginx/sites-enabled/ 2>/dev/null');
      await exec('cat /etc/nginx/nginx.conf 2>/dev/null | head -30');
      
      // Upload our config (without default_server to avoid conflicts)
      const nginxConfig = `server {
    listen 80;
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

    # JARVIS AI Assistant
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
      await exec('sudo nginx -t 2>&1');
      await exec('sudo systemctl start nginx 2>&1 || sudo systemctl reload nginx 2>&1');
      
      // Test
      await exec('sleep 2 && curl -s -o /dev/null -w "Nginx: HTTP %{http_code}" http://localhost/ 2>&1');
      console.log('✅ Nginx configured');
    }

    else if (step === 'verify') {
      // Final verification
      console.log('\n━━━ Final Verification ━━━');
      await exec('pm2 list 2>&1');
      await exec('curl -s -o /dev/null -w "JARVIS direct: HTTP %{http_code}\\n" http://localhost:3005/ 2>&1');
      await exec('curl -s -o /dev/null -w "Nginx proxy: HTTP %{http_code}\\n" http://localhost/ 2>&1');
      await exec('curl -s http://localhost:3005/api/jarvis/system 2>&1 | head -5');
      await exec('free -h | head -2');
      await exec('df -h / | tail -1');
      await exec('pm2 logs jarvis --lines 10 --nostream 2>&1');
      console.log(`\n🎉 JARVIS URL: http://${VPS_HOST}`);
    }

  } finally {
    conn.end();
  }
}

main().catch(console.error);
