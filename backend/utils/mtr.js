import { exec }      from 'child_process'

export async function runMtr(hostname, onProcess) {
  const cmd = `mtr --report --report-cycles 7 --no-dns --json ${hostname}`

  const child = exec(cmd)
  if (onProcess) onProcess(child)   

  const stdout = await new Promise((resolve, reject) => {
    let out = ''
    child.stdout.on('data', d => out += d)
    child.on('close', (code, signal) => {
      if (signal === 'SIGTERM') {
        reject(new Error('mtr killed by SIGTERM'))
        return
      }
      if (out) resolve(out)
      else reject(new Error(`mtr exited with code ${code}`))
    })
    child.on('error', reject)
    setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('mtr timed out'))
    }, 30000)
  })

  const parsed = JSON.parse(stdout)
  const hubs   = parsed?.report?.hubs ?? []

  return hubs.map(hub => ({
    hop:    hub.count,
    ip:     hub.host === '???' ? null : hub.host,
    loss:   hub['Loss%'] ?? 0,
    avgRtt: hub['Avg']   ?? 0,
  }))
}