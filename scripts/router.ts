import path from "node:path";
import { statSync, readFileSync, readdirSync, unlinkSync, chmodSync } from "node:fs";
import process from "node:process";
import { spawn } from "node:child_process";
import dotenv from "dotenv";

const rootDir = path.dirname(__dirname);
const scriptsDir = path.join(rootDir, "scripts");
const graphsDir = path.join(rootDir, "graphs");

const graphDirNames = process.argv.slice(2);
if (!graphDirNames.length) {
  graphDirNames.push(...readdirSync(graphsDir));
}

ensureRouterDownloaded().then(routerPath => {
  const pidPromises: Promise<number>[] = [];

  graphDirNames.forEach(graphDirName => {
    const graphDir = path.join(graphsDir, graphDirName);
    if (statSync(graphDir).isDirectory()) {
      pidPromises.push(runRouter(graphDir));
    }
  });

  process.on("SIGINT", () => {
    Promise.all(pidPromises).then(pids => {
      pids.forEach(pid => {
        try {
          process.kill(pid);
        } catch (e) {
          console.error(e);
        }
      });
      process.exit(0);
    });
  });

  function runRouter(graphDir: string) {
    const envPath = path.join(graphDir, ".env");
    const envText = readFileSync(envPath, "utf-8");
    const env = dotenv.parse(envText);
    const relativeGraphDir = path.relative(rootDir, graphDir);

    console.log("Running router for ", relativeGraphDir);

    return new Promise<number>((resolve, reject) => {
      const process = spawn(routerPath, [
        "--config", "router.yaml",
        "--apollo-uplink-poll-interval", "10s"
      ], {
        stdio: "inherit",
        cwd: graphDir,
        env,
      }).on("error", reject);

      if (process.pid) {
        resolve(process.pid);
      } else {
        reject(new Error("Failed to start router for " + relativeGraphDir));
      }
    });
  }
}, console.error);

function statOrNull(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

async function ensureRouterDownloaded() {
  const routerPath = path.join(scriptsDir, "router");
  const routerStat = statOrNull(routerPath);

  if (!routerStat?.isFile()) {
    if (routerStat) {
      unlinkSync(routerPath);
    }

    const script = await fetch(
      "https://router.apollo.dev/download/nix/latest"
    ).then(res => res.text());

    await new Promise<void>((resolve, reject) => {
      const process = spawn(
        "sh",
        [],
        {
          stdio: ["pipe", "inherit", "inherit"],
          cwd: scriptsDir,
        },
      );
      process.stdin.write(script);
      process.stdin.end();
      process.on("error", reject);
      process.on("exit", () => {
        resolve();
        chmodSync(routerPath, 0o755);
      });
    });
  }

  return routerPath;
}
