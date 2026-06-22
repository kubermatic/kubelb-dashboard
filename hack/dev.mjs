import { createServer } from "node:net";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

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

const envFile = new URL("../.env", import.meta.url).pathname;
const envFlag = existsSync(envFile) ? `--env-file=${envFile}` : "";
const apiCmd = envFlag
  ? `node ${envFlag} ./api/node_modules/tsx/dist/cli.mjs watch api/src/server.ts`
  : "pnpm run dev:api";

execSync(`pnpm exec concurrently -n fe,api -c cyan,magenta "pnpm run dev:frontend" "${apiCmd}"`, {
  stdio: "inherit",
  env: { ...process.env, API_PORT: String(apiPort), PORT: String(apiPort) },
});
