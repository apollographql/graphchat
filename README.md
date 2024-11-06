# Apollo GraphChat: AI chatbot

The Apollo GraphChat project is an extension of the [Mongo chatbot framework](https://github.com/mongodb/chatbot) that understands GraphQL schemas and queries. It does this by including a practical application of RAG, Retreival-Augmented-Generation around a given set of GraphQL operations that have been pre-authorized to grant access to a portion of your APIs. Using this project also gives you the ability to build a graph representation of your APIs in minutes.

If you would like to just run the demo as is without changing anything, follow the setup instructions below and run the project.

Read our [guide](https://www.apollographql.com/guides/chatbots) on getting started with providing AI drive experience with real-time access to APIs.

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v14 or later)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- [OpenAI API key](https://platform.openai.com/api-keys)

### Installing the project

```bash
git clone https://github.com/apollographql/graphchat.git
cd graphchat
npm install
```

### Setting up OpenAI

This project currently only allows using OpenAI, but we hope to expand that sooner. You'll need to create a `.env` file at the root of this project and add an API key from OpenAI:

```
# OpenAI config
OPENAI_API_KEY="sk-proj-0Nfoirwjhfoiuurewhjfoirewjgf98743hf893u7r3l"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_CHAT_COMPLETION_MODEL="gpt-4o"
```

### Setting up a MongoDB Atlas vector store

Instructions for setting up MongoDB Atlas can be found in their
[documentation](https://mongodb.github.io/chatbot/quick-start). In summary, you'll need to:

1. Create a free Mongo account
2. Create a project with a Database on a free-tier cluster
3. Create a Vector Atlas Seach Index using ther JSON editor. Select your database

```
{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    }
  ]
}
```

4. Click "Connect" and add the connection information to your `.env` file

```
# MongoDB config
MONGODB_CONNECTION_URI="mongodb+srv://{project}:oirwjehffjoijfrwoijfrw.mongodb.net/?retryWrites=true&w=majority&appName=Shopify"
MONGODB_DATABASE_NAME="keynote"
VECTOR_SEARCH_INDEX_NAME="vector_index"
```

### Setting up GraphOS

To try the chatbot dev kit, we’ll create a new graph in GraphOS that we can
associate a hand-crafted persisted query list with. 

1. Navigate to [GraphOS](https://studio.apollographql.com) the graph you want to try
2. Create a new variant with your desired name
3. Copy over your subgraphs from whatever is your main or production variant.
   * You can do this in the Subgraphs tab with the “Add Subgraph” button
   * You will need to paste in the URL and schema for each subgraph you add

### Setting up `.env` files

Before running this project, you must create appropriate `.env` files in the
root `graphchat/` directory as well as each of the `graphchat/graph/*`
directories. For guidance, see the corresponding `.env.example` files in those locations.

## Starting the project with default demo

Run the following commands:

```
# Build operation manifest from /graph/operations folder
npm run pq:manifest 
# Publish manifest for graph router to use
npm run pq:publish
# Vectorize /graph/operations folder and push to Mongo Atlas
npm run pq:ingest
# Start your graph router locally
npm run pq:router
# Run the chatbot framework in dev mode, starts the UI client
npm run dev
```

## Using the project

### Ingesting data into MongoDB

```bash
# (Re)generate all the graph/operation-manifest.json files
npm run pq:manifest

# Ingest all the graph/operation-manifest.json files into MongoDB Atlas
npm run pq:ingest
```

### (Re)publishing persisted queries to GraphOS

```bash
# Publish all the graph/operation-manifest.json files to GraphOS
npm run pq:publish
```

### Running the project

Once you have performed the above steps, you can run the router with the
following command:

```bash
npm run pq:router
```

Finally, you can start the GraphChat server and UI with the following command:

```bash
npm run dev
```

### Next Steps

You'll probably want to add your own graph or APIs to the project. You can do this by adding new subgraphs to the `graph/supergraph.yaml` file and the `pq:router` command will hot-reload any schemas you point to there.

# Licensing

## Overview
GraphChat is an open-source project developed by Apollo Graph, Inc. that includes original code and modifications to the MongoDB Chatbot Framework.


## License Details

The entire project (including all original work by Apollo Graph, Inc. and code derived from the MongoDB Chatbot Framework) is licensed under the Apache License, Version 2.0. This license applies to all files in this repository. You can read the full text of the Apache License, Version 2.0 [here](https://github.com/apollographql/graphchat/blob/main/LICENSE).

Acknowledgment of Original Work. This project includes code derived from the MongoDB Chatbot Framework, originally developed by MongoDB, Inc. The original MongoDB Chatbot Framework is also licensed under the Apache License, Version 2.0, and the starter code relevant to this project can be found [here](https://github.com/mongodb/chatbot/tree/main/examples/quick-start).

## Notice

Please note that this project includes a NOTICE file, as required by the Apache License, Version 2.0. The NOTICE file acknowledges the original work by MongoDB, Inc. and details the contributions by Apollo Graph, Inc.

## Disclaimer 

Unless required by applicable law or agreed to in writing, software distributed under this project is provided on an “AS IS” basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the Apache License, Version 2.0 for more details.
