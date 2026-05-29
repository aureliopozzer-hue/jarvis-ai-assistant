import { Client } from 'ssh2';
import * as fs from 'fs';

const VPS_HOST = '98.81.197.175';
const VPS_USER = 'ubuntu';
const KEY_PATH = '/home/z/my-project/upload/beautyflow-key.pem';
const privateKey = fs.readFileSync(KEY_PATH, 'utf8');

let conn: Client;

function exec(cmd: string, timeout = 15000): Promise<{ stdout: string; stderr: string; code: number }> {
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
    // Test DNS resolution on VPS
    console.log('\n━━━ DNS Test ━━━');
    await exec('nslookup internal-api.z.ai 2>/dev/null || dig internal-api.z.ai +short 2>/dev/null || echo "DNS lookup failed"', 10000);
    
    // Test direct API connection
    console.log('\n━━━ Direct API Test ━━━');
    await exec('curl -s --connect-timeout 10 -o /dev/null -w "HTTP %{http_code} Time: %{time_total}s\\n" https://internal-api.z.ai/v1/chat/completions 2>&1', 20000);
    
    // The internal API might not be accessible from VPS. 
    // Let's check if there's a public API endpoint
    console.log('\n━━━ Check Public API ━━━');
    await exec('curl -s --connect-timeout 10 -o /dev/null -w "HTTP %{http_code} Time: %{time_total}s\\n" https://api.z.ai 2>&1', 20000);

    // Try updating the config to use a potentially public endpoint
    // The ZAI SDK config is loaded from .z-ai-config file
    // Let's try changing baseUrl to use a potential public endpoint
    
    // First, read the current config
    console.log('\n━━━ Current Config ━━━');
    const currentConfig = await exec('cat /home/ubuntu/.z-ai-config');
    console.log(currentConfig.stdout);

    // The Z.AI platform likely has a public API gateway
    // Let's check what the SDK actually uses for functions.invoke
    // The internal-api.z.ai might have a public equivalent
    
    // For now, let's create a workaround: use the ZAI SDK with a proxy
    // or create an API route that proxies through our sandbox
    
    console.log('\n━━━ Status Summary ━━━');
    await exec('pm2 list 2>&1');
    await exec('curl -s -o /dev/null -w "JARVIS: HTTP %{http_code}\\n" http://localhost:3005/ 2>&1');
    await exec('curl -s -o /dev/null -w "Nginx: HTTP %{http_code}\\n" http://localhost/ 2>&1');
    
    console.log('\n━━━ Key Finding ━━━');
    console.log('The ZAI SDK uses "internal-api.z.ai" which is only accessible from the Z.AI sandbox.');
    console.log('On the external VPS, this endpoint times out.');
    console.log('Solution options:');
    console.log('1. Use a public API endpoint (if available)');
    console.log('2. Create a proxy API route on the sandbox that forwards requests');
    console.log('3. Use alternative APIs (OpenAI, etc.) on the VPS');

  } finally {
    conn.end();
  }
}

main().catch(console.error);
