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
    // Check network/DNS
    console.log('\n━━━ Network Diagnostics ━━━');
    await exec('cat /home/ubuntu/.z-ai-config 2>/dev/null');
    await exec('curl -s https://httpbin.org/ip 2>&1 | head -5');
    await exec('curl -s -o /dev/null -w "HTTP %{http_code} Time: %{time_total}s\\n" https://www.google.com 2>&1');
    
    // Test ZAI SDK directly
    console.log('\n━━━ Test ZAI SDK ━━━');
    const testScript = `
const ZAI = require('/home/ubuntu/jarvis/node_modules/z-ai-web-dev-sdk').default;
async function test() {
  try {
    const zai = await ZAI.create();
    console.log('ZAI created successfully');
    const result = await zai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      thinking: { type: 'disabled' },
    });
    console.log('Chat response:', result.choices[0]?.message?.content);
  } catch (err) {
    console.error('ZAI Error:', err.message);
  }
}
test();
`;
    await uploadBuffer(Buffer.from(testScript), '/home/ubuntu/jarvis/test-zai.js');
    await exec('cd /home/ubuntu/jarvis && node test-zai.js 2>&1', 30000);
    
    // Check weather API more carefully
    console.log('\n━━━ Weather API Debug ━━━');
    await exec('curl -s -w "\\nHTTP Code: %{http_code}\\nTime: %{time_total}s\\n" "http://localhost:3005/api/jarvis/weather?action=current&city=Sao+Paulo" 2>&1', 60000);

    // Rebuild and restart with env fix if needed
    console.log('\n━━━ PM2 Restart ━━━');
    await exec('pm2 restart jarvis 2>&1');
    await exec('sleep 3 && pm2 list 2>&1');

  } finally {
    conn.end();
  }
}

main().catch(console.error);
