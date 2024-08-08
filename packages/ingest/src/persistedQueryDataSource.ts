import fs from "fs";
import path from "path";
import { visit, parse as parseGraphQL } from "graphql";
import { DataSource } from "mongodb-rag-ingest/sources";
import { Page } from "mongodb-rag-core";

interface ManifestOperation {
  id: string;
  name: string;
  type: string;
  body: string;
}

export async function persistedQueryDataSource(): Promise<DataSource> {
  const manifestPath = path.join(__dirname, "..", "..", "..", "operation-manifest.json");
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf-8"));
  const metadataByOperationName = new Map<string, {
    id: string;
    requiredVariables: string[];
  }>();

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

    metadataByOperationName.set(operation.name, {
      id: operation.id,
      requiredVariables: Array.from(requiredVariablesSet),
    });
  });

  return {
    name: "persisted-queries",
    async fetchPages(): Promise<Page[]> {
      return manifest.operations.map((operation: ManifestOperation) => {
        const metadata = metadataByOperationName.get(operation.name);
        const pseudoPageURL = `/persisted-queries/${operation.name}${
          metadata ? `?id=${metadata.id}` : ""
        }`;

        return {
          url: pseudoPageURL,
          title: operation.name,
          body: operation.body,
          format: "graphql",
          sourceName: "persisted-queries",
          metadata,
        };
      });
    },
  };
}
