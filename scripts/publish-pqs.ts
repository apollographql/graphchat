import path from "node:path";
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

const rootDir = path.dirname(__dirname);

dotenv.config({
  path: path.join(rootDir, ".env"),
});

const {
  APOLLO_GRAPH_REF = "Shopify-hbkyeeh@graphchat",
} = process.env;

spawnSync(
  "rover",
  [
    "persisted-queries",
    "publish",
    APOLLO_GRAPH_REF,
    "--manifest", "operation-manifest.json",
    "--profile", "shopify",
  ],
  {
    stdio: "inherit",
    cwd: rootDir,
  }
);
