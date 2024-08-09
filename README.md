# Apollo GraphChat: multi-source persisted-query-aware AI chatbot

The Apollo GraphChat project is a chatbot that understands GraphQL schemas and
queries, and in particular knows about a given set of [persisted
queries](https://www.apollographql.com/docs/kotlin/advanced/persisted-queries/),
which are pre-approved operations that can be executed against an Apollo
Router-based gateway.

As a demonstration, this project includes relevant configuration for a
Shopify-esque API, but you can add additional graphs in the [`graphs/`](graphs/)
directory, and the chatbot will be able to answer questions about all of them at
once, potentially combining data from multiple sources.

GraphChat builds on the excellent [MongoDB chatbot
framework](https://github.com/mongodb/chatbot), using [tool
calling](https://mongodb.github.io/chatbot/server/tools/) to execute persisted
queries against the various GraphQL APIs. As a useful remnant of those
beginnings, the chatbot also has knowledge of the chatbot framework running
behind the scenes, and can answer questions about extending or modifying the
behavior of that framework.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v14 or later)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- [OpenAI API key](https://platform.openai.com/api-keys)

## Installing the project

```bash
git clone https://github.com/apollographql/graphchat.git
cd graphchat
npm install
```

## Setting up a MongoDB Atlas vector store

Instructions for setting up MongoDB Atlas can be found in their
[documentation](https://mongodb.github.io/chatbot/quick-start).

## Setting up GraphOS

To try the chatbot dev kit, we’ll create a new contract variant that we can
associate a hand-crafted persisted query list with. You may already have a
persisted query list you want to use

### With script:

1. Create a service API key in GraphOS for the  graph you want to see this with
2. Run setup script with `GRAPHOS_API_KEY`, the script will then:
  a. Create a `graphchat` variant on that graph
  b. Copy the subgraphs (schema and URL) from a variant in the following order: prod/production/main/current
  c. Create a persisted query list associated with the `graphchat` variant

### Manually:

1. Navigate to the graph you want to try
2. Create a new variant with your desired name
3. Copy over your subgraphs from whatever is your main or production variant.
  a. You can do this in the Subgraphs tab with the “Add Subgraph” button
  b. You will need to paste in the URL and schema for each subgraph you add

## Setting up `.env` files

Before running this project, you must create appropriate `.env` files in the
root `graphchat/` directory as well as each of the `graphchat/graphs/*`
directories. For guidance, see the corresponding `.env.example` files in those
locations.

## Ingesting data into MongoDB

```bash
# (Re)generate all the graphs/*/operation-manifest.json files
npm run pq:manifest

# (Re)generate just graphs/shopify/operation-manifest.json
npm run pq:manifest shopify

# Ingest all the graphs/*/operation-manifest.json files into MongoDB Atlas
npm run pq:ingest
```

## (Re)publishing persisted queries to GraphOS

```bash
# Publish all the graphs/*/operation-manifest.json files to GraphOS
npm run pq:publish

# Publish just graphs/shopify/operation-manifest.json to GraphOS
npm run pq:publish shopify
```

## Running the project

Once you have performed the above steps, you can run the router(s) with the
following command:

```bash
npm run pq:router
```

Finally, you can start the GraphChat server and UI with the following command:

```bash
npm run dev
```

## Deploying to production

TODO
