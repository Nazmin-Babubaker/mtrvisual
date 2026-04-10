import { spawn } from 'child_process';

export function runMtr(hostname) {
  return new Promise((resolve, reject) => {
    const args = ['--report', '--report-cycles', '5', '--no-dns', '--json', hostname];
    const mtr = spawn('mtr', args, { timeout: 30000 });

    let stdout = '';
    let stderr = '';

    mtr.stdout.on('data', (data) => { stdout += data; });
    mtr.stderr.on('data', (data) => { stderr += data; });

    mtr.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr || 'MTR failed'));
      
      try {
        const parsed = JSON.parse(stdout);
        const hubs = parsed?.report?.hubs ?? [];
        resolve(hubs.map(hub => ({
          hop: hub.count,
          ip: hub.host === '???' ? null : hub.host,
          loss: hub['Loss%'] ?? 0,
          avgRtt: hub['Avg'] ?? 0,
        })));
      } catch (e) {
        reject(new Error('Failed to parse MTR output'));
      }
    });
  });
}