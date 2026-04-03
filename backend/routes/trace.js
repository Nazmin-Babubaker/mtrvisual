import {exec} from 'child_process'
import {promisfy} from 'util'

const execAsunc = promisfy(exec)

export async function runMtr(hostname){

  const cmd  = `mtr --report --report-cycles 5 --no-dns --json ${hostname}`

  const { stdout } = await execAsync(cmd, { timeout: 30000 })
  const parsed = JSON.parse(stdout)
  const hubs   = parsed?.report?.hubs ?? []


  return hubs.map(hub => ({
    hop:    hub.count,
    ip:     hub.host === '???' ? null : hub.host,   
    loss:   hub['Loss%'] ?? 0,
    avgRtt: hub['Avg']   ?? 0,
    
  }))


}