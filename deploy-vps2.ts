import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const JARVIS_PORT = 3005;
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');
const BUN = '/home/ubuntu/.bun/bin/bun';
const NPM = '/usr/bin/npm';

let conn: Client;

function exec(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 ${cmd.substring(0, 150)}${cmd.length > 150 ? '...' : ''}`);
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

function uploadFile(localPath: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const rs = fs.createReadStream(localPath);
      const ws = sftp.createWriteStream(remotePath);
      ws.on('close', resolve);
      ws.on('error', reject);
      rs.on('error', reject);
      rs.pipe(ws);
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
    // ━━━ Step 1: Install PM2 globally ━━━
    console.log('\n━━━ Step 1: Install PM2 ━━━');
    await exec(`${NPM} install -g pm2 2>&1 | tail -3`);
    await exec('/usr/lib/node_modules/pm2/bin/pm2 --version 2>/dev/null || which pm2');

    // ━━━ Step 2: Install deps with full bun path ━━━
    console.log('\n━━━ Step 2: Install Dependencies ━━━');
    await exec(`cd /home/ubuntu/jarvis && ${BUN} install 2>&1 | tail -5`);

    // ━━━ Step 3: Generate Prisma client ━━━
    console.log('\n━━━ Step 3: Generate Prisma ━━━');
    await exec(`cd /home/ubuntu/jarvis && ${BUN} x prisma generate 2>&1 | tail -5`);

    // ━━━ Step 4: Push DB schema ━━━
    console.log('\n━━━ Step 4: Push DB Schema ━━━');
    await exec(`cd /home/ubuntu/jarvis && ${BUN} x prisma db push 2>&1 | tail -5`);

    // ━━━ Step 5: Build ━━━
    console.log('\n━━━ Step 5: Build for Production ━━━');
    await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db NODE_ENV=production ${BUN} run build 2>&1 | tail -30`);

    // ━━━ Step 6: Check build output ━━━
    console.log('\n━━━ Step 6: Check Build Output ━━━');
    await exec('ls -la /home/ubuntu/jarvis/.next/ 2>/dev/null | head -10');
    await exec('ls -la /home/ubuntu/jarvis/.next/standalone/ 2>/dev/null | head -10');

    // ━━━ Step 7: Copy static files for standalone ━━━
    console.log('\n━━━ Step 7: Copy Static Files ━━━');
    await exec('cp -r /home/ubuntu/jarvis/.next/static /home/ubuntu/jarvis/.next/standalone/.next/ 2>/dev/null || echo "No standalone build"');
    await exec('cp -r /home/ubuntu/jarvis/public /home/ubuntu/jarvis/.next/standalone/ 2>/dev/null || echo "No public dir"');

    // ━━━ Step 8: Seed demo data ━━━
    console.log('\n━━━ Step 8: Seed Demo Data ━━━');
    const seedScript = fs.readFileSync('/home/z/my-project/src/scripts/seed-demo-data.ts', 'utf8');
    await uploadBuffer(Buffer.from(seedScript), '/home/ubuntu/jarvis/seed.ts');
    await exec(`cd /home/ubuntu/jarvis && DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db ${BUN} run seed.ts 2>&1 | tail -10`);

    // ━━━ Step 9: Start with PM2 ━━━
    console.log('\n━━━ Step 9: Start JARVIS with PM2 ━━━');
    
    // Kill any existing jarvis process
    await exec('/usr/lib/node_modules/pm2/bin/pm2 delete jarvis 2>/dev/null || true');
    
    // Check if standalone exists and use it, otherwise use next start
    const standaloneCheck = await exec('test -f /home/ubuntu/jarvis/.next/standalone/server.js && echo "HAS_STANDALONE" || echo "NO_STANDALONE"');
    
    if (standaloneCheck.stdout.includes('HAS_STANDALONE')) {
      await exec(`/usr/lib/node_modules/pm2/bin/pm2 start /home/ubuntu/jarvis/.next/standalone/server.js --name jarvis --node-args="--max-old-space-size=512" --env PORT=${JARVIS_PORT} --env HOSTNAME=0.0.0.0 --env DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db 2>&1`);
    } else {
      // Use next start instead
      const startScript = `#!/bin/bash
export DATABASE_URL=file:/home/ubuntu/jarvis/db/production.db
export PORT=${JARVIS_PORT}
export HOSTNAME=0.0.0.0
cd /home/ubuntu/jarvis
${BUN} run start
`;
      await uploadBuffer(Buffer.from(startScript), '/home/ubuntu/jarvis/start.sh');
      await exec('chmod +x /home/ubuntu/jarvis/start.sh');
      await exec(`/usr/lib/node_modules/pm2/bin/pm2 start /home/ubuntu/jarvis/start.sh --name jarvis 2>&1`);
    }
    
    await exec('sleep 5 && /usr/lib/node_modules/pm2/bin/pm2 list 2>&1');

    // ━━━ Step 10: Save PM2 config ━━━
    console.log('\n━━━ Step 10: Save PM2 & Set Startup ━━━');
    await exec('/usr/lib/node_modules/pm2/bin/pm2 save 2>&1');
    await exec('/usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | tail -5');

    // ━━━ Step 11: Test ━━━
    console.log('\n━━━ Step 11: Test Deployment ━━━');
    await exec(`curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:${JARVIS_PORT}/ 2>&1`);
    await exec(`curl -s http://localhost:${JARVIS_PORT}/api/jarvis/system 2>&1 | head -3`);

    // ━━━ Step 12: Verify Nginx ━━━
    console.log('\n━━━ Step 12: Verify Nginx Proxy ━━━');
    await exec('sudo nginx -t 2>&1');
    await exec('curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost/ 2>&1');

    console.log('\n━━━ DEPLOY COMPLETE! ━━━');
    console.log(`\n🎉 JARVIS URL: http://${VPS_HOST}`);

  } finally {
    conn.end();
  }
}

main().catch(console.error);
