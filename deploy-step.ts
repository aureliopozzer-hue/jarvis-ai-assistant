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
    const timer = setTimeout(() => {
      // Don't reject, just resolve what we have
      console.log('⏰ Command timed out, continuing...');
    }, timeout);
    conn.exec(cmd, (err, stream) => {
      if (err) { clearTimeout(timer); return reject(err); }
      let stdout = '';
      let stderr = '';
      stream.on('data', (d: Buffer) => { stdout += d.toString(); process.stdout.write(d.toString()); });
      stream.stderr.on('data', (d: Buffer) => { stderr += d.toString(); process.stderr.write(d.toString()); });
      stream.on('close', (code: number) => { clearTimeout(timer); resolve({ stdout, stderr, code: code ?? 0 }); });
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
  const step = process.env.STEP || '1';
  
  console.log(`🚀 Connecting to VPS (Step ${step})...`);
  conn = new Client();
  await new Promise<void>((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({ host: VPS_HOST, port: 22, username: VPS_USER, privateKey });
  });
  console.log('✅ Connected!');

  try {
    if (step === '1') {
      // Install PM2 + deps
      console.log('\n━━━ Step 1: Install PM2 + Bun deps ━━━');
      await exec(`${BUN} --version`);
      await exec('npm install -g pm2 2>&1 | tail -3');
      await exec(`${PM2} --version 2>/dev/null || echo "PM2 still not found"`);
      await exec(`cd /home/ubuntu/jarvis && ${BUN} install 2>&1 | tail -5`, 120000);
      console.log('✅ Step 1 done');
    }
    
    else if (step === '2') {
      // Prisma generate + db push
      console.log('\n━━━ Step 2: Prisma Setup ━━━');
      await exec(`cd /home/ubuntu/jarvis && ${BUN} x prisma generate 2>&1`, 60000);
      await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db ${BUN} x prisma db push 2>&1`, 60000);
      console.log('✅ Step 2 done');
    }
    
    else if (step === '3') {
      // Build
      console.log('\n━━━ Step 3: Build ━━━');
      await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db NODE_ENV=production ${BUN} run build 2>&1`, 300000);
      console.log('✅ Step 3 done');
    }

    else if (step === '4') {
      // Check build + copy static
      console.log('\n━━━ Step 4: Post-build ━━━');
      await exec('ls -la /home/ubuntu/jarvis/.next/ 2>/dev/null | head -15');
      await exec('test -d /home/ubuntu/jarvis/.next/standalone && echo "HAS_STANDALONE" || echo "NO_STANDALONE"');
      await exec('cp -r /home/ubuntu/jarvis/.next/static /home/ubuntu/jarvis/.next/standalone/.next/ 2>/dev/null');
      await exec('cp -r /home/ubuntu/jarvis/public /home/ubuntu/jarvis/.next/standalone/ 2>/dev/null');
      await exec('ls /home/ubuntu/jarvis/.next/standalone/ 2>/dev/null | head -10');
      console.log('✅ Step 4 done');
    }
    
    else if (step === '5') {
      // Start with PM2
      console.log('\n━━━ Step 5: Start with PM2 ━━━');
      await exec(`${PM2} delete jarvis 2>/dev/null || true`);
      
      // Check if standalone exists
      const check = await exec('test -d /home/ubuntu/jarvis/.next/standalone && echo "YES" || echo "NO"');
      
      if (check.stdout.includes('YES')) {
        console.log('Using standalone build...');
        await exec(`${PM2} start node /home/ubuntu/jarvis/.next/standalone/server.js --name jarvis -- PORT=3005 HOSTNAME=0.0.0.0 2>&1`);
      } else {
        console.log('Using next start...');
        // Create start script
        const startScript = `#!/bin/bash
export DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db
export PORT=3005
export HOSTNAME=0.0.0.0
cd /home/ubuntu/jarvis
${BUN} run start
`;
        await uploadBuffer(Buffer.from(startScript), '/home/ubuntu/jarvis/start.sh');
        await exec('chmod +x /home/ubuntu/jarvis/start.sh');
        await exec(`${PM2} start /home/ubuntu/jarvis/start.sh --name jarvis 2>&1`);
      }
      
      await exec(`sleep 5 && ${PM2} list 2>&1`);
      await exec(`${PM2} save 2>&1`);
      console.log('✅ Step 5 done');
    }
    
    else if (step === '6') {
      // Configure Nginx + test
      console.log('\n━━━ Step 6: Nginx + Test ━━━');
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

    # JARVIS AI Assistant - all other traffic
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
      
      // Test
      await exec('sleep 3');
      await exec('curl -s -o /dev/null -w "JARVIS: HTTP %{http_code}" http://localhost:3005/ 2>&1');
      await exec('curl -s -o /dev/null -w "NGINX: HTTP %{http_code}" http://localhost/ 2>&1');
      await exec(`${PM2} list 2>&1`);
      console.log('✅ Step 6 done');
    }

    else if (step === '7') {
      // Final verification
      console.log('\n━━━ Step 7: Final Verification ━━━');
      await exec(`${PM2} list 2>&1`);
      await exec('curl -s -o /dev/null -w "JARVIS direct: HTTP %{http_code}\\n" http://localhost:3005/ 2>&1');
      await exec('curl -s -o /dev/null -w "Nginx proxy: HTTP %{http_code}\\n" http://localhost/ 2>&1');
      await exec('curl -s http://localhost/api/jarvis/system 2>&1 | head -5');
      await exec('free -h | head -2');
      await exec('df -h / | tail -1');
      console.log(`\n🎉 JARVIS URL: http://${VPS_HOST}`);
    }

  } finally {
    conn.end();
  }
}

main().catch(console.error);
