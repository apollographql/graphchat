import path from "node:path";
import fs from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import dotenv from "dotenv";

const rootDir = path.dirname(__dirname);
const scriptsDir = path.join(rootDir, "scripts");

dotenv.config({
  path: path.join(rootDir, ".env"),
});

const {
  SHOPIFY_ACCESS_TOKEN,
  APOLLO_GRAPH_REF = "Shopify-hbkyeeh@chatbot",
  APOLLO_KEY,
} = process.env;

function statOrNull(path: string) {
  try {
    return fs.statSync(path);
  } catch {
    return null;
  }
}

async function ensureRouterDownloaded() {
  const routerPath = path.join(scriptsDir, "router");
  const routerStat = statOrNull(routerPath);

  if (!routerStat?.isFile()) {
    if (routerStat) {
      fs.unlinkSync(routerPath);
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
        fs.chmodSync(routerPath, 0o755);
      });
    });
  }

  return routerPath;
}

ensureRouterDownloaded().then(routerPath => spawn(
  routerPath,
  [
    "--config", "router.yaml",
    "--dev",
  ],
  {
    stdio: "inherit",
    cwd: scriptsDir,
    env: {
      SHOPIFY_ACCESS_TOKEN,
      APOLLO_GRAPH_REF,
      APOLLO_KEY,
    },
  },
), console.error);
