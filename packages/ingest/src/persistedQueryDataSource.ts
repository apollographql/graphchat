import path from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { visit, parse as parseGraphQL } from "graphql";
import { parse as parseYaml } from "yaml";
import { DataSource } from "mongodb-rag-ingest/sources";
import { Page } from "mongodb-rag-core";

interface ManifestOperation {
  id: string;
  name: string;
  type: string;
  body: string;
}

const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));

export async function persistedQueryDataSource(): Promise<DataSource> {
  const graphsDir = path.join(rootDir, "graphs");

  return {
    name: "persisted-queries",
    async fetchPages(): Promise<Page[]> {
      const pages: Page[] = [];

      for (const graphDirName of readdirSync(graphsDir)) {
        const graphDir = path.join(graphsDir, graphDirName);
        const manifestPath = path.join(graphDir, "operation-manifest.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        const routerYamlPath = path.join(graphDir, "router.yaml");
        const routerYaml = readFileSync(routerYamlPath, "utf-8");
        const {
          supergraph: {
            listen: routerListenHost = "127.0.0.1:4000",
          },
        } = parseYaml(routerYaml);

        manifest.operations.forEach((operation: ManifestOperation) => {
          const operationAST = parseGraphQL(operation.body);
          const requiredVariablesSet = new Set<string>();

          visit(operationAST, {
            VariableDefinition(node) {
              if (node.type.kind === "NonNullType") {
                const varName = node.variable.name.value;
                requiredVariablesSet.add(varName);
              }
            },
          });

          const metadata = {
            id: operation.id,
            requiredVariables: Array.from(requiredVariablesSet),
            routerListenHost,
          };

          const pseudoPageURL = `/persisted-queries/${
            graphDirName
          }/${operation.name}/?id=${metadata.id}`;

          pages.push({
            url: pseudoPageURL,
            title: `${graphDirName}/${operation.name}`,
            body: operation.body,
            format: "graphql",
            sourceName: `persisted-queries/${graphDirName}`,
            metadata,
          });
        });
      }

      return pages;
    },
  };
}
