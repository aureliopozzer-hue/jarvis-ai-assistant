import { Client } from 'ssh2';
import * as fs from 'fs';
import * as path from 'path';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const JARVIS_PORT = 3005;
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

let conn: Client;

function exec(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', (data: Buffer) => { stdout += data.toString(); process.stdout.write(data.toString()); });
      stream.stderr.on('data', (data: Buffer) => { stderr += data.toString(); process.stderr.write(data.toString()); });
      stream.on('close', (code: number) => { resolve({ stdout, stderr, code: code ?? 0 }); });
    });
  });
}

function uploadFile(localPath: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => { resolve(); });
      writeStream.on('error', reject);
      readStream.on('error', reject);
      readStream.pipe(writeStream);
    });
  });
}

function uploadBuffer(buffer: Buffer, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const writeStream = sftp.createWriteStream(remotePath);
      writeStream.on('close', () => { resolve(); });
      writeStream.on('error', reject);
      writeStream.write(buffer);
      writeStream.end();
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
    // ━━━ Step 1: Install Bun if needed & PM2 ━━━
    console.log('\n━━━ Step 1: Install Dependencies ━━━');
    await exec('source ~/.bashrc && bun --version 2>/dev/null || (curl -fsSL https://bun.sh/install | bash)');
    await exec('source ~/.bashrc && npm install -g pm2 2>/dev/null; pm2 --version');

    // ━━━ Step 2: Create project directory ━━━
    console.log('\n━━━ Step 2: Create Project Dir ━━━');
    await exec('mkdir -p /home/ubuntu/jarvis');

    // ━━━ Step 3: Initialize project on VPS ━━━
    console.log('\n━━━ Step 3: Initialize Project ━━━');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && bun init -y 2>/dev/null || true');

    // ━━━ Step 4: Upload package.json ━━━
    console.log('\n━━━ Step 4: Upload package.json ━━━');
    const pkgJson = fs.readFileSync('/home/z/my-project/package.json', 'utf8');
    await uploadBuffer(Buffer.from(pkgJson), '/home/ubuntu/jarvis/package.json');

    // ━━━ Step 5: Install dependencies on VPS ━━━
    console.log('\n━━━ Step 5: Install Dependencies ━━━');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && bun install --production 2>&1');
    
    // ━━━ Step 6: Upload source files ━━━
    console.log('\n━━━ Step 6: Upload Source Files ━━━');
    
    // Create directory structure
    await exec(`
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/chat && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/memory && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/conversations && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/notifications && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/proactive && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/system && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/tts && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/vision && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/search && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/read && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/generate-image && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/weather && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/news && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/finance && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/finance/watchlist && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/finance/alerts && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/email && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/social && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/campaigns && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/calendar && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/files && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/stripe && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/settings && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/voice && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/tasks && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/automation && \
      mkdir -p /home/ubuntu/jarvis/src/app/api/jarvis/conversations/[id] && \
      mkdir -p /home/ubuntu/jarvis/src/lib && \
      mkdir -p /home/ubuntu/jarvis/src/components/jarvis && \
      mkdir -p /home/ubuntu/jarvis/src/components/ui && \
      mkdir -p /home/ubuntu/jarvis/src/hooks && \
      mkdir -p /home/ubuntu/jarvis/prisma && \
      mkdir -p /home/ubuntu/jarvis/db && \
      mkdir -p /home/ubuntu/jarvis/public
    `);

    // Upload all source files using tar + sftp
    console.log('Creating tar archive of source files...');
    
    // We need to tar and upload. Let's use a different approach - tar locally and pipe via sftp
    // Actually, let's just use the exec to pull from our local or use scp-like approach
    // The simplest way: create a tar, upload it, extract it
    
    console.log('✅ Directory structure created on VPS');
    
    // ━━━ Step 7: Upload key files ━━━
    console.log('\n━━━ Step 7: Upload Config Files ━━━');
    
    // next.config
    const nextConfig = fs.readFileSync('/home/z/my-project/next.config.ts', 'utf8');
    await uploadBuffer(Buffer.from(nextConfig), '/home/ubuntu/jarvis/next.config.ts');
    
    // tsconfig
    const tsconfig = fs.readFileSync('/home/z/my-project/tsconfig.json', 'utf8');
    await uploadBuffer(Buffer.from(tsconfig), '/home/ubuntu/jarvis/tsconfig.json');
    
    // prisma schema
    const prismaSchema = fs.readFileSync('/home/z/my-project/prisma/schema.prisma', 'utf8');
    await uploadBuffer(Buffer.from(prismaSchema), '/home/ubuntu/jarvis/prisma/schema.prisma');
    
    // .env file
    const envContent = `DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db\nNODE_ENV=production\nPORT=${JARVIS_PORT}\n`;
    await uploadBuffer(Buffer.from(envContent), '/home/ubuntu/jarvis/.env');

    console.log('✅ Config files uploaded!');

    // ━━━ Step 8: Upload all src files ━━━
    console.log('\n━━━ Step 8: Uploading source files via tar ━━━');
    
    // Create tar on local machine and upload
    const { execSync } = require('child_process');
    
    // Create a tar archive
    try {
      execSync('tar czf /tmp/jarvis-src.tar.gz src/ prisma/ public/', {
        cwd: '/home/z/my-project',
        stdio: 'inherit'
      });
      console.log('✅ Tar created');
    } catch (e) {
      console.log('Creating tar with alternative method...');
      // Try with explicit file list
      execSync('tar czf /tmp/jarvis-src.tar.gz src prisma public', {
        cwd: '/home/z/my-project'
      });
    }
    
    // Upload tar
    console.log('Uploading tar archive...');
    await uploadFile('/tmp/jarvis-src.tar.gz', '/home/ubuntu/jarvis/src.tar.gz');
    console.log('✅ Tar uploaded');
    
    // Extract on VPS
    console.log('Extracting on VPS...');
    await exec('cd /home/ubuntu/jarvis && tar xzf src.tar.gz && rm src.tar.gz');
    console.log('✅ Source files extracted!');

    // ━━━ Step 9: Install deps and generate Prisma ━━━
    console.log('\n━━━ Step 9: Install Deps & Generate Prisma ━━━');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && bun install 2>&1 | tail -5');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && npx prisma generate 2>&1 | tail -5');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && npx prisma db push 2>&1 | tail -5');

    // ━━━ Step 10: Build ━━━
    console.log('\n━━━ Step 10: Build for Production ━━━');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && NODE_ENV=production bun run build 2>&1 | tail -20');

    // ━━━ Step 11: Configure PM2 ━━━
    console.log('\n━━━ Step 11: Configure PM2 ━━━');
    const pm2Config = `module.exports = {
  apps: [
    {
      name: 'jarvis',
      script: '/home/ubuntu/jarvis/.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: ${JARVIS_PORT},
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: 'file:/home/ubuntu/jarvis/db/production.db',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    }
  ]
};`;
    await uploadBuffer(Buffer.from(pm2Config), '/home/ubuntu/jarvis/ecosystem.config.js');

    // ━━━ Step 12: Start with PM2 ━━━
    console.log('\n━━━ Step 12: Start JARVIS with PM2 ━━━');
    await exec('cd /home/ubuntu/jarvis && source ~/.bashrc && pm2 start ecosystem.config.js 2>&1');
    await exec('sleep 3 && pm2 list 2>&1');

    // ━━━ Step 13: Configure Nginx ━━━
    console.log('\n━━━ Step 13: Configure Nginx ━━━');
    const nginxConfig = `server {
    listen 80;
    server_name jarvis.b beautyflow.xyz _;

    # BeautyFlow WhatsApp API proxy
    location /api/whatsapp/ {
        proxy_pass http://127.0.0.1:3004/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        client_max_body_size 50M;
    }

    # Health check for BeautyFlow
    location /health {
        proxy_pass http://127.0.0.1:3004/api/status;
        proxy_http_version 1.1;
    }

    # JARVIS - all other traffic
    location / {
        proxy_pass http://127.0.0.1:${JARVIS_PORT};
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
    console.log('✅ Nginx configured!');

    // ━━━ Step 14: Verify ━━━
    console.log('\n━━━ Step 14: Verify Deployment ━━━');
    await exec('sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:${JARVIS_PORT}/ 2>&1');
    await exec('curl -s http://localhost:${JARVIS_PORT}/ 2>&1 | head -5');
    await exec('pm2 list 2>&1');

    console.log('\n━━━ DONE! ━━━');
    console.log(`\n🎉 JARVIS should be accessible at: http://${VPS_HOST}`);

  } finally {
    conn.end();
  }
}

main().catch(console.error);
