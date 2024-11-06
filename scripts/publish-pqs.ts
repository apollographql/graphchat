import path from "node:path";
import { readdirSync, statSync, readFileSync } from "node:fs";

import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

const rootDir = path.dirname(__dirname);
const graphDir = path.join(rootDir, "graph");

publish();

function publish() {
  const envPath = path.join(graphDir, ".env");
  const envText = readFileSync(envPath, "utf-8");
  const { APOLLO_GRAPH_REF, APOLLO_KEY } = dotenv.parse(envText);

  console.log(
    "Publishing persisted queries for",
    path.relative(rootDir, graphDir)
  );

  spawnSync(
    "rover",
    [
      "persisted-queries",
      "publish",
      APOLLO_GRAPH_REF,
      "--manifest",
      "operation-manifest.json",
    ],
    {
      stdio: "inherit",
      cwd: graphDir,
      env: {
        "APOLLO_KEY": APOLLO_KEY
      }
    }
  );
}
