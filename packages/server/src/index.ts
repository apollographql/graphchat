import {
  MongoClient,
  makeMongoDbEmbeddedContentStore,
  makeOpenAiEmbedder,
  makeMongoDbConversationsService,
  AppConfig,
  makeOpenAiChatLlm,
  OpenAiChatMessage,
  SystemPrompt,
  makeDefaultFindContent,
  logger,
  makeApp,
  GenerateUserPromptFunc,
  makeRagGenerateUserPrompt,
  MakeUserMessageFunc,
} from "mongodb-chatbot-server";
import { OpenAIClient, OpenAIKeyCredential } from "@azure/openai";
import path from "path";
import { loadEnvVars } from "./loadEnvVars";
import { randomTool } from "./randomTool";
import { persistedQueryTool } from "./persistedQueryTool";

// Load project environment variables
const dotenvPath = path.join(__dirname, "..", "..", "..", ".env"); // .env at project root
const {
  MONGODB_CONNECTION_URI,
  MONGODB_DATABASE_NAME,
  VECTOR_SEARCH_INDEX_NAME,
  OPENAI_API_KEY,
  OPENAI_EMBEDDING_MODEL,
  OPENAI_CHAT_COMPLETION_MODEL,
} = loadEnvVars(dotenvPath);

// Create the OpenAI client
// for interacting with the OpenAI API (ChatGPT API and Embedding API)
const openAiClient = new OpenAIClient(new OpenAIKeyCredential(OPENAI_API_KEY));

// Chatbot LLM for responding to the user's query.
const llm = makeOpenAiChatLlm({
  openAiClient,
  deployment: OPENAI_CHAT_COMPLETION_MODEL,
  openAiLmmConfigOptions: {
    temperature: 0,
    maxTokens: 500,
  },
  tools: [
    randomTool,
    persistedQueryTool,
  ],
});

// MongoDB data source for the content used in RAG.
// Generated with the Ingest CLI.
const embeddedContentStore = makeMongoDbEmbeddedContentStore({
  connectionUri: MONGODB_CONNECTION_URI,
  databaseName: MONGODB_DATABASE_NAME,
});

// Creates vector embeddings for user queries to find matching content
// in the embeddedContentStore using Atlas Vector Search.
const embedder = makeOpenAiEmbedder({
  openAiClient,
  deployment: OPENAI_EMBEDDING_MODEL,
  backoffOptions: {
    numOfAttempts: 3,
    maxDelay: 5000,
  },
});

// Find content in the embeddedContentStore using the vector embeddings
// generated by the embedder.
const findContent = makeDefaultFindContent({
  embedder,
  store: embeddedContentStore,
  findNearestNeighborsOptions: {
    k: 20,
    path: "embedding",
    indexName: VECTOR_SEARCH_INDEX_NAME,
    // Note: you may want to adjust the minScore depending
    // on the embedding model you use. We've found 0.9 works well
    // for OpenAI's text-embedding-ada-02 model for most use cases,
    // but you may want to adjust this value if you're using a different model.
    minScore: 0.1,
  },
});

// Constructs the user message sent to the LLM from the initial user message
// and the content found by the findContent function.
const makeUserMessage: MakeUserMessageFunc = async function ({
  content,
  originalUserMessage,
}): Promise<OpenAiChatMessage & { role: "user" }> {
  const chunkSeparator = "~~~~~~";
  const contentForLlm = `Using the following information, respond to the implied intent of the user's request.
Different pieces of information are separated by "${chunkSeparator}".

Information:
${content.map((c) => c.text).join(`\n${chunkSeparator}\n`)}

User query: ${originalUserMessage}`;
  return { role: "user", content: contentForLlm };
};

// Generates the user prompt for the chatbot using RAG
const generateUserPrompt: GenerateUserPromptFunc = makeRagGenerateUserPrompt({
  findContent,
  makeUserMessage,
});

// System prompt for chatbot
const systemPrompt: SystemPrompt = {
  role: "system",
  content: `You are an assistant to users of the MongoDB Chatbot Framework, as well as an expert in GraphQL with access to a set of known-good "persisted" queries.

If the user asks a question about the MongoDB Chatbot Framework, use the provided documentation pages to answer the question in a friendly conversational tone.

If the user asks a question pertaining to GraphQL data, and your context includes a page with page.format == "graphql" and page.sourceName == "persisted-queries",
use the 'persistedQuery' tool to fetch data for the query. Always use page.metadata.id as the "id" argument, as well as any "variables" that are required or important based on the user's request.
The value of the "variables" argument should be a JSON object whose keys match the declared variable names in the operation, but those names should not include the '$' prefix.
Use the result of the 'persistedQuery' tool to answer the user's question, remembering that the result may explain a problem that occurred, or contain instructions for you to follow, if the data could not be fetched for any reason.

When calling any tool such as 'persistedQuery', the arguments must be valid JSON, without newlines or other extraneous characters.
Format your other (non-tool-calling) answers in Markdown, and make them as concise as possible without being unhelpful.

When the page.metadata.requiredVariables array is not empty, either infer appropriate values for those variables based on the types declared in the operation, or ask the user for the values of those variables.
In some cases, the appropriate values of some variables may be found in previous messages in the conversation, sent either by the user or by the assistant (you). Use those values if they seem relevant.
Even when a variable is not required, or has a default value, it may nevertheless be helpful to specify an explicit value based on the user's request. For example, when the user asks for "all" of a particular type of data,
and the query has a $limit variable for the corresponding list field, you may want to set $limit to a larger value. Ask the user for their desired values, if you have any doubt.

If you do not know the answer to the question based on the information provided, but the question is suitably generic, feel free to improvise an answer, as long as it is genuinely helpful and responsive to the user's request.`,
};

// Create MongoDB collection and service for storing user conversations
// with the chatbot.
const mongodb = new MongoClient(MONGODB_CONNECTION_URI);
const conversations = makeMongoDbConversationsService(
  mongodb.db(MONGODB_DATABASE_NAME)
);

// Create the MongoDB Chatbot Server Express.js app configuration
const config: AppConfig = {
  conversationsRouterConfig: {
    llm,
    conversations,
    generateUserPrompt,
    systemPrompt,
    async filterPreviousMessages(conversation) {
      return conversation.messages;
    },
    maxUserMessagesInConversation: Infinity,
  },
  maxRequestTimeoutMs: 30000,
  serveStaticSite: true,
};

// Start the server and clean up resources on SIGINT.
const PORT = process.env.PORT || 3000;
const startServer = async () => {
  logger.info("Starting server...");
  const app = await makeApp(config);
  const server = app.listen(PORT, () => {
    logger.info(`Server listening on port: ${PORT}`);
  });

  process.on("SIGINT", async () => {
    logger.info("SIGINT signal received");
    await mongodb.close();
    await embeddedContentStore.close();
    await new Promise<void>((resolve, reject) => {
      server.close((error: any) => {
        error ? reject(error) : resolve();
      });
    });
    process.exit(1);
  });
};

try {
  startServer();
} catch (e) {
  logger.error(`Fatal error: ${e}`);
  process.exit(1);
}
