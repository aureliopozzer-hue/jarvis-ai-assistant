import { Client } from 'ssh2';
import * as fs from 'fs';

const privateKey = fs.readFileSync('/home/z/my-project/upload/beautyflow-key.pem', 'utf8');
const VPS_HOST = '98.81.197.175';

const users = ['ec2-user', 'ubuntu', 'root', 'admin'];

async function tryConnect(user: string): Promise<boolean> {
  return new Promise((resolve) => {
    const conn = new Client();
    const timeout = setTimeout(() => {
      conn.end();
      resolve(false);
    }, 10000);

    conn.on('ready', () => {
      clearTimeout(timeout);
      console.log(`✅ SUCCESS with user: ${user}`);
      conn.exec('whoami && hostname', (err, stream) => {
        if (err) { console.error(err); resolve(false); return; }
        let out = '';
        stream.on('data', (d: Buffer) => { out += d.toString(); process.stdout.write(d.toString()); });
        stream.on('close', () => {
          conn.end();
          resolve(true);
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`❌ Failed with user ${user}: ${err.message.substring(0, 80)}`);
      resolve(false);
    });

    conn.connect({
      host: VPS_HOST,
      port: 22,
      username: user,
      privateKey: privateKey,
    });
  });
}

async function main() {
  for (const user of users) {
    const ok = await tryConnect(user);
    if (ok) {
      console.log(`\n🎉 Working user: ${user}`);
      return;
    }
  }
  console.log('\n❌ None of the users worked. The key might not match this VPS.');
}

main();
