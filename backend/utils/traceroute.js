import { exec } from "child_process";

export function runTraceroute(domain) {
  return new Promise((resolve, reject) => {
    exec(`traceroute ${domain}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}