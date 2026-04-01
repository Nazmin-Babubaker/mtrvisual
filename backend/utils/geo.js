import fetch from "node-fetch";

// Check if IP is private
function isPrivateIP(ip) {
  return (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  );
}

// Classify network type
function classify(ip, geoData) {
  if (!ip) return "unknown";

  if (isPrivateIP(ip)) return "local";

  const org = geoData.org || geoData.isp || "";

  if (
    org.includes("Google") ||
    org.includes("Amazon") ||
    org.includes("Microsoft") ||
    org.includes("Cloudflare")
  ) {
    return "company";
  }

  return "isp";
}

// Main function
export async function enrichHop(hop) {
  const { ip } = hop;

  // Handle missing IP
  if (!ip) {
    return {
      ...hop,
      type: "unknown",
      lat: null,
      lon: null
    };
  }

  // Handle local IP
  if (isPrivateIP(ip)) {
    return {
      ...hop,
      type: "local",
      lat: null,
      lon: null
    };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();

    const type = classify(ip, data);

    return {
      ...hop,
      type,
      lat: data.lat,
      lon: data.lon,
      city: data.city,
      country: data.country,
      isp: data.isp,
      org: data.org
    };
  } catch (err) {
    return {
      ...hop,
      type: "unknown",
      lat: null,
      lon: null
    };
  }
}