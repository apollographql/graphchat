import type { Tool, CallToolResponse } from "mongodb-chatbot-server";

export const persistedQueryTool: Tool = {
  definition: {
    name: "persistedQuery",
    description: "Fetch data for a given persisted query from the GraphQL API",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the persisted query to fetch",
        },
        routerListenHost: {
          type: "string",
          description: "The host and port of the router to use when fetching the query",
        },
        variables: {
          type: "object",
          description: "The variables to use when fetching the query",
        },
      },
      required: ["id", "routerListenHost"],
    },
  },

  async call({ functionArgs: args }: {
    functionArgs: {
      id: string;
      routerListenHost: string;
      variables: Record<string, any>;
    };
  }): Promise<CallToolResponse> {
    console.log(`Fetching persisted query with id ${args.id} and variables ${
      JSON.stringify(args.variables, null, 2)
    } from ${args.routerListenHost}`);

    const body: {
      extensions: Record<string, any>;
      variables?: Record<string, any>;
    } = {
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: args.id,
        },
      },
    };
    if (args.variables) {
      body.variables = args.variables;
    }

    return await fetch(`http://${args.routerListenHost}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(
      response => response.json()
    ).then(
      result => {
        console.log(`Got persisted query result: ${JSON.stringify(result, null, 2)}`);
        return {
          toolCallMessage: {
            role: "function",
            name: "persistedQuery",
            content: JSON.stringify(result, null, 2),
          },
        };
      },
      error => {
        console.error(`Error fetching persisted query: ${error.message}`);
        return {
          toolCallMessage: {
            role: "function",
            name: "persistedQuery",
            content: `Error fetching persisted query: ${error.message}`,
          },
        };
      },
    );
  }
};
