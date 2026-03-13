import { createServer } from "node:net";
import { execSync } from "node:child_process";

function findFreePort(start = 3001) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(start, "0.0.0.0", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(findFreePort(start + 1));
      } else {
        reject(err);
      }
    });
  });
}

const apiPort = await findFreePort();
console.log(`API port: ${apiPort}`);

execSync(
  `npx concurrently -n fe,api -c cyan,magenta "npm:dev:frontend" "npm:dev:api"`,
  {
    stdio: "inherit",
    env: { ...process.env, API_PORT: String(apiPort), PORT: String(apiPort) },
  },
);
