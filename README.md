# Apollo GraphChat

GraphChat is a working example of connecting a chatbot to your APIs using GraphQL queries. It was originally forked from the [MongoDB Chatbot Framework](https://github.com/mongodb/chatbot) because it allowed us to get quickly started and focus on the API access for the chatbot.  

# Documentation

To learn how to use this framework, refer to the Apollo Tutorial course with complete instructions to re-create. 

If you want to get started quickly with this project and play around with it yourself, continue to the quickstart.

# Quickstart

## Setup GraphOS
To try the chatbot dev kit, we’ll create a new contract variant that we can associate a hand-crafted persisted query list with. You may already have a persisted query list you want to use

With Script  
1. Create a service API key in GraphOS for the  graph you want to see this with
2. Run setup script with GRAPHOS_API_KEY, the script will then:
  a. Create a `chatbot` variant on that graph
  b. Copy the subgraphs (schema and URL) from a variant in the following order: prod/production/main/current
  c. Create a persisted query list associated with the `chatbot` variant

Manually
1. Navigate to the graph you want to try 
2. Create a new variant with your desired name
3. Copy over your subgraphs from whatever is your main or production variant. 
  a. You can do this in the Subgraphs tab with the “Add Subgraph” button
  b. You will need to paste in the URL and schema for each subgraph you add

## Setup API

Depends on which use case we're using

## Setup for your graph

1. Generate PQs
  a. Most chatbots are integrated into the website, so start with the websites functionality
  b. Example - Generate manifest from `shopify-store-website` repository which is a folder of operations - this is the bot functionality
    i. Your PQ list might contain `mutations`, if you want to start with just query operations for read-only functionality, run this script to remove all of the `type:mutation` form the manifest before you publish it
    ii. Publish to GraphOS variant
  c. If you want to just use an existing PQ list, navigate to the PQ list in GraphOS and download the JSON file
2. Embed PQ manifest (JSON file) into a vector db for the chatbot to perform vector searches	
  a. We’re using Mongo Atlas because it’s a simple one click, but you could use something like PGVector with Postgres
  b. Along with the embeddings, we extract the  required variables from each PQ to be stored with the embeddings
3. Run a router instance pointing at your `chatbot` PQ list with safelisting configuration on
4. Run the Mongo-chatbot-based template and set the environment variables to your stuff:
  a. ROUTER_URL <- where the chatbot should send the PQ requests
  b. CONNECTION_STRING <- the connection string to Mongo Atlas
    i. If using Postgres, you’ll need to modify the code to use something like Langchain instead of the mongo provided packages
  c. OPENAI_API_KEY <- we’re using OpenAI for the LLM and embeddings so we don’t have to host a model, but you can modify the code to use something like Langchain with Ollama or Hugging Face.
5. Navigate to localhost:3000
6. Ask questions!
