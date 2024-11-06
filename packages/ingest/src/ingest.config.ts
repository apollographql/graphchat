import {
  makeIngestMetaStore,
  Config,
  IngestMetaStore,
} from "mongodb-rag-ingest";
import {
  makeOpenAiEmbedder,
  makeMongoDbEmbeddedContentStore,
  makeMongoDbPageStore,
} from "mongodb-rag-core";
import { standardChunkFrontMatterUpdater } from "mongodb-rag-ingest/embed";
import path from "path";
import { loadEnvVars } from "./loadEnvVars";
import { persistedQueryDataSource } from "./persistedQueryDataSource";
import { MongoClient } from "mongodb";
import { log } from "console";

// Load project environment variables
const dotenvPath = path.join(__dirname, "..", "..", "..", ".env"); // .env at project root
const {
  MONGODB_CONNECTION_URI,
  MONGODB_DATABASE_NAME,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
} = loadEnvVars(dotenvPath);

export default {
  embedder: async () => {
    // Use dynamic import because `@azure/openai` is a ESM package
    // and this file is a CommonJS module.
    const { OpenAIClient, OpenAIKeyCredential } = await import("@azure/openai");
    return makeOpenAiEmbedder({
      openAiClient: new OpenAIClient(new OpenAIKeyCredential(OPENAI_API_KEY)),
      deployment: OPENAI_EMBEDDING_MODEL,
      backoffOptions: {
        numOfAttempts: 25,
        startingDelay: 10,
      },
    });
  },
  embeddedContentStore: async () =>
    makeMongoDbEmbeddedContentStore({
      connectionUri: MONGODB_CONNECTION_URI,
      databaseName: MONGODB_DATABASE_NAME,
    }),
  pageStore: () =>
    makeMongoDbPageStore({
      connectionUri: MONGODB_CONNECTION_URI,
      databaseName: MONGODB_DATABASE_NAME,
    }),
  ingestMetaStore: () => ({
    entryId:"1",
    loadLastSuccessfulRunDate: ()=>{
      return new Promise((resolve) => {
        resolve(new Date());
    });
    },
    updateLastSuccessfulRunDate:()=>new Promise((r)=>r()),
    close: ()=>new Promise((r)=>r())
  }),
  // () => ({
  //   entryId:"",
  //   loadLastSuccessfulRunDate: ()=>{
  //     return new Promise(()=>{}).then(()=>Date.())
  //   }
  // })
  // makeIngestMetaStore({
  //   connectionUri: MONGODB_CONNECTION_URI,
  //   databaseName: MONGODB_DATABASE_NAME,
  //   entryId: "all",
  // }),
  chunkOptions: () => ({
    transform: standardChunkFrontMatterUpdater,
  }),
  // Add data sources here
  dataSources: async () => [await persistedQueryDataSource()],
} satisfies Config;
