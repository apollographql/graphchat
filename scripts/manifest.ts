// This script generates operation-manifest.json and prepends any initial #
// comments from operations/*.graphql files to operation-manifest.json.

import path from "node:path";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { parse as parseGraphQL } from "graphql";

const rootDir = path.dirname(__dirname);
const manifestPath = path.join(rootDir, "operation-manifest.json");

spawnSync(
  "npx",
  [
    "generate-persisted-query-manifest",
    "--config", "pq-config.json",
  ],
  {
    stdio: "inherit",
    cwd: rootDir,
  },
);

const originalManifestString = readFileSync(manifestPath, "utf-8");
const manifest = JSON.parse(originalManifestString);

const operationsDir = path.join(rootDir, "operations");
const operationsByName = new Map<string, {
  name: string;
  body: string;
}>();

for (const op of manifest.operations) {
  operationsByName.set(op.name, op);
}

for (const opFile of readdirSync(operationsDir)) {
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
