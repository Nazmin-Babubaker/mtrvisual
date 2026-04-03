const cache = new Map()

export async function geolocateIP(ip) {
  if (!ip) return null                    
  if (cache.has(ip)) return cache.get(ip) 

  try {
    const token = process.env.IPINFO_TOKEN
    const url   = `https://ipinfo.io/${ip}/json${token ? `?token=${token}` : ''}`
    const res   = await fetch(url)
    const data  = await res.json()

    const [lat, lng] = (data.loc ?? '').split(',').map(Number)

     const result = {
      lat:  isNaN(lat) ? null : lat,
      lng:  isNaN(lng) ? null : lng,
      city: data.city    ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      org:  data.org     ?? null,   
    }

   cache.set(ip, result)
    return result
  } catch {
    return null   
  }
}

export async function geolocateHops(hops) {
  const results = await Promise.all(hops.map(hop => geolocateIP(hop.ip)))

  return hops.map((hop, i) => ({
    ...hop,
    geo: results[i]   
  }))
}