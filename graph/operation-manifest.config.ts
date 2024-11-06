// persisted-query-manifest.config.ts
import path from "node:path";
import { PersistedQueryManifestConfig } from "@apollo/generate-persisted-query-manifest";

const config: PersistedQueryManifestConfig = {
  documents: ["operations/**/*.{graphql,gql,js,jsx,ts,tsx}"],
  output: "operation-manifest.json",
  createOperationId(query, { operationName, type, createDefaultId }) {
    if(!operationName) throw new Error("You must give each operation a name")

    return operationName;
  },
};

export default config;