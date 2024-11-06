import path from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { visit, parse as parseGraphQL } from "graphql";
import { parse as parseYaml } from "yaml";
import { DataSource } from "mongodb-rag-ingest/sources";
import { MongoClient, Page } from "mongodb-rag-core";
import { loadEnvVars } from "./loadEnvVars";

// Load project environment variables
const dotenvPath = path.join(__dirname, "..", "..", "..", ".env"); // .env at project root
const { MONGODB_CONNECTION_URI, MONGODB_DATABASE_NAME } =
  loadEnvVars(dotenvPath);

interface ManifestOperation {
  id: string;
  name: string;
  type: string;
  body: string;
}

const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));

export async function persistedQueryDataSource(): Promise<DataSource> {
  return {
    name: "persisted-queries",
    async fetchPages(): Promise<Page[]> {
      const pages: Page[] = [];
      const graphDir = path.join(rootDir, "graph");
      const manifestPath = path.join(graphDir, "operation-manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const routerYamlPath = path.join(graphDir, "router.yaml");
      const routerYaml = readFileSync(routerYamlPath, "utf-8");
      const {
        supergraph: { listen: routerListenHost = "127.0.0.1:4000" },
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
          id: operation.name,
          requiredVariables: Array.from(requiredVariablesSet),
          routerListenHost,
        };

        const pseudoPageURL = `/persisted-queries/${operation.name}/?id=${operation.name}`;

        pages.push({
          url: pseudoPageURL,
          title: `${operation.name}`,
          body: operation.body,
          format: "graphql",
          sourceName: `persisted-queries/`,
          metadata,
        });
      });

      //If no operations, we want to reset the embedded content and db
      //We drop conversations so we're not storing a lot of data
      if (pages.length == 0) {
        console.log("No operations found, resetting embeddings");
        const client = new MongoClient(MONGODB_CONNECTION_URI);
        await client.connect();
        await client
          .db(MONGODB_DATABASE_NAME)
          .collection("embedded_content")
          .deleteMany({});
        await client
          .db(MONGODB_DATABASE_NAME)
          .collection("pages")
          .deleteMany({});
          await client
          .db(MONGODB_DATABASE_NAME)
          .collection("conversations")
          .deleteMany({});
        await client.close();
      }
      
      return pages;
    },
  };
}
