import path from "node:path";
import { readdirSync, statSync, readFileSync } from "node:fs";

import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

const rootDir = path.dirname(__dirname);
const graphsDir = path.join(rootDir, "graphs");

const graphDirNames = process.argv.slice(2);
if (!graphDirNames.length) {
  graphDirNames.push(...readdirSync(graphsDir));
}

graphDirNames.forEach(graphDirName => {
  const graphDir = path.join(graphsDir, graphDirName);
  if (statSync(graphDir).isDirectory()) {
    publish(graphDir);
  }
});

function publish(graphDir: string) {
  const envPath = path.join(graphDir, ".env");
  const envText = readFileSync(envPath, "utf-8");
  const {
    APOLLO_KEY,
    APOLLO_GRAPH_REF,
  } = dotenv.parse(envText);

  console.log("Publishing persisted queries for", path.relative(rootDir, graphDir));

  spawnSync(
    `APOLLO_KEY=${APOLLO_KEY} rover`,
    [
      "persisted-queries",
      "publish",
      APOLLO_GRAPH_REF,
      "--manifest", `operation-manifest.json`,
      "--profile", path.basename(graphDir),
    ],
    {
      shell: true,
      stdio: "inherit",
      cwd: graphDir,
    }
  );
}
