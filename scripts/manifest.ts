// This script generates operation-manifest.json and prepends any initial #
// comments from operations/*.graphql files to operation-manifest.json.

import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { parse as parseGraphQL } from "graphql";

const rootDir = path.dirname(__dirname);
const graphsDir = path.join(rootDir, "graphs");

const graphDirNames = process.argv.slice(2);
if (!graphDirNames.length) {
  graphDirNames.push(...readdirSync(graphsDir));
}

graphDirNames.forEach(graphDirName => {
  const graphDir = path.join(graphsDir, graphDirName);
  if (statSync(graphDir).isDirectory()) {
    generate(graphDir);
  }
});

function generate(graphDir: string) {
  const manifestPath = path.join(graphDir, "operation-manifest.json");

  console.log("Generating operation-manifest.json for", path.relative(rootDir, graphDir));

  spawnSync(
    "npx",
    [
      "generate-persisted-query-manifest",
      "--config", "pq-config.json",
    ],
    {
      stdio: "inherit",
      cwd: graphDir,
    },
  );

  const originalManifestString = readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(originalManifestString);

  const operationsDir = path.join(graphDir, "operations");
  const operationsByName = new Map<string, {
    name: string;
    body: string;
  }>();

  for (const op of manifest.operations) {
    operationsByName.set(op.name, op);
  }

  for (const opFile of readdirSync(operationsDir)) {
    if (!opFile.includes('.graphql')) {
      return
    }
    
    const opPath = path.join(operationsDir, opFile);
    const opSource = readFileSync(opPath, "utf-8");
    const ast = parseGraphQL(opSource);

    const firstDef = ast.definitions[0];
    if (firstDef.kind === "OperationDefinition") {
      const opName = firstDef.name?.value;
      if (opName) {
        const op = operationsByName.get(opName);
        if (!op) continue;

        const comments: string[] = [];
        opSource.split("\n").every(line => {
          if (line.trimStart().startsWith("#")) {
            comments.push(line);
            return true;
          }
          return false;
        });

        op.body = comments.join("\n") + "\n" + op.body;
      }
    }
  }

  writeFileSync(
    manifestPath,
    JSON.stringify(manifest, null, 2),
  );
}