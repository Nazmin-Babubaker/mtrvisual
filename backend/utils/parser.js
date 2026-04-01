export function parseTraceroute(output) {
  const lines = output.split("\n");

  const hops = [];

  for (let line of lines) {
    line = line.trim();

    // Skip header line
    if (!line || !line.match(/^\d+/)) continue;

    // Extract hop number
    const hopMatch = line.match(/^(\d+)/);
    const hopNumber = hopMatch ? parseInt(hopMatch[1]) : null;

    // Extract IP address (if exists)
    const ipMatch = line.match(/\d+\.\d+\.\d+\.\d+/);
    const ip = ipMatch ? ipMatch[0] : null;

    // Extract times (ms values)
    const timeMatches = [...line.matchAll(/(\d+\.\d+)ms/g)];
    const times = timeMatches.map(match => parseFloat(match[1]));

    hops.push({
      hop: hopNumber,
      ip: ip,
      times: times
    });
  }

  return hops;
}