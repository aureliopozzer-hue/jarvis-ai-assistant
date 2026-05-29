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
    // Test different public API URLs
    console.log('\n━━━ Testing Public API Endpoints ━━━');
    await exec('curl -s --connect-timeout 5 -o /dev/null -w "api.z.ai: HTTP %{http_code} Time: %{time_total}s\\n" https://api.z.ai 2>&1', 10000);
    await exec('curl -s --connect-timeout 5 -o /dev/null -w "api.z.ai/v1: HTTP %{http_code} Time: %{time_total}s\\n" https://api.z.ai/v1 2>&1', 10000);
    await exec('curl -sL --connect-timeout 5 -o /dev/null -w "api.z.ai/v1 (follow redirect): HTTP %{http_code} Time: %{time_total}s\\n" https://api.z.ai/v1 2>&1', 10000);

    // Try the actual chat completions endpoint with the public URL
    console.log('\n━━━ Test Chat API via Public URL ━━━');
    await exec(`curl -s --connect-timeout 10 -X POST "https://api.z.ai/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer Z.ai" \
      -H "X-Chat-Id: chat-c11b19a9-e075-4dbe-8c07-82c67d84ebb5" \
      -H "X-Z-AI-From: Z" \
      -d '{"messages":[{"role":"user","content":"Say hello"}]}' 2>&1 | head -10`, 15000);
    
    // Try with the redirect location from 301
    await exec(`curl -sL --connect-timeout 10 -X POST "https://api.z.ai/v1/chat/completions" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer Z.ai" \
      -H "X-Chat-Id: chat-c11b19a9-e075-4dbe-8c07-82c67d84ebb5" \
      -H "X-Z-AI-From: Z" \
      -d '{"messages":[{"role":"user","content":"Say hello"}]}' 2>&1 | head -10`, 15000);

    // Update .z-ai-config to use public URL
    console.log('\n━━━ Updating Config to Public URL ━━━');
    const publicConfig = JSON.stringify({
      baseUrl: "https://api.z.ai/v1",
      apiKey: "Z.ai",
      chatId: "chat-c11b19a9-e075-4dbe-8c07-82c67d84ebb5",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNzkzNmJlYTYtNDc2Ni00YTA4LTg1NzItNzhmZTNiN2JiNTFhIiwiY2hhdF9pZCI6ImNoYXQtYzExYjE5YTktZTA3NS00ZGJlLThjMDctODJjNjdkODRlYmI1IiwicGxhdGZvcm0iOiJ6YWkifQ.UEYKGX8JOxoKql0t6MU6w70kvZgefV8rxN49j7Qn4Pg",
      userId: "7936bea6-4766-4a08-8572-78fe3b7bb51a"
    }, null, 2);
    
    // Update both config files
    await uploadBuffer(Buffer.from(publicConfig), '/home/ubuntu/.z-ai-config');
    await uploadBuffer(Buffer.from(publicConfig), '/home/ubuntu/jarvis/.z-ai-config');
    await exec('sudo cp /home/ubuntu/.z-ai-config /etc/.z-ai-config 2>/dev/null || echo "No /etc/ access"');
    
    console.log('Config updated to use https://api.z.ai/v1');

    // Test with the ZAI SDK using the new config
    console.log('\n━━━ Test ZAI SDK with Public URL ━━━');
    await exec(`cd /home/ubuntu/jarvis && node -e "
const ZAI = require('z-ai-web-dev-sdk').default;
async function test() {
  try {
    const zai = await ZAI.create();
    console.log('ZAI created with baseUrl:', zai.config.baseUrl);
    const result = await zai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      thinking: { type: 'disabled' },
    });
    console.log('SUCCESS:', result.choices[0]?.message?.content);
  } catch (err) {
    console.error('Error:', err.message?.substring(0, 200));
  }
}
test();
" 2>&1`, 30000);

    // Restart JARVIS
    console.log('\n━━━ Restarting JARVIS ━━━');
    await exec('pm2 restart jarvis 2>&1');
    await exec('sleep 5 && pm2 list 2>&1');

    // Test weather API
    console.log('\n━━━ Test Weather API ━━━');
    await exec('curl -s -w "\\nHTTP %{http_code}\\n" "http://localhost:3005/api/jarvis/weather?action=current&city=Sao+Paulo" 2>&1', 60000);

    // Test system API
    console.log('\n━━━ Test System API ━━━');
    await exec('curl -s http://localhost:3005/api/jarvis/system 2>&1 | head -3');

  } finally {
    conn.end();
  }
}

main().catch(console.error);
