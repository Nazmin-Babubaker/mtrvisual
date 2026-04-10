
import express  from 'express'
import cors     from 'cors'
import dotenv   from 'dotenv'
import { runMtr }         from './utils/mtr.js'
import { geolocateHops }  from './utils/geo.js'
import dns from 'dns/promises';
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())


function isValidHostname(h) {
  return /^(?=.{1,253}$)(?!-)([A-Za-z0-9-]{1,63}\.)+[A-Za-z]{2,}$/.test(h)
}


function extractHostname(input) {
  try {
    if (!input.startsWith('http')) input = 'https://' + input
    return new URL(input).hostname
  } catch {
    return input  
  }
}

app.post('/trace', async (req, res) => {
  let { url } = req.body

  if (!url) return res.status(400).json({ error: 'URL is required' })

  const hostname = extractHostname(url.trim())
  if (hostname.length > 100) throw new Error("Too long")

  if (!isValidHostname(hostname))
    return res.status(400).json({ error: 'Invalid hostname' })

  try {

    console.log(`Running mtr for: ${hostname}`)
    const rawHops = await runMtr(hostname)


    const hops = await geolocateHops(rawHops)

    
    res.json({
      hostname,
      hops,
      resolvedCount: hops.filter(h => h.ip).length,
      geoCount: hops.filter(h => h.geo?.lat).length,
    })

  } catch (err) {
    console.error(err)

    if (err.message?.includes('command not found'))
      return res.status(500).json({ error: 'mtr is not installed. Run: sudo apt install mtr  or  brew install mtr' })

    if (err.message?.includes('timed out'))
      return res.status(408).json({ error: 'mtr timed out — host may be unreachable' })

    res.status(500).json({ error: err.message })
  }
})

app.listen(process.env.PORT, () => {
  console.log(`NetProbe running on http://localhost:${process.env.PORT}`)
})