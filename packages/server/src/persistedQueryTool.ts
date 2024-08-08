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
        variables: {
          type: "object",
          description: "The variables to use when fetching the query",
        },
      },
      required: ["id"],
    },
  },

  async call({ functionArgs: { id, variables } }: {
    functionArgs: {
      id: string;
      variables: Record<string, any>;
    };
  }): Promise<CallToolResponse> {
    console.log(`Fetching persisted query with id ${id} and variables ${
      JSON.stringify(variables, null, 2)
    }`);

    const body: {
      extensions: Record<string, any>;
      variables?: Record<string, any>;
    } = {
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: id,
        },
      },
    };
    if (variables) {
      body.variables = variables;
    }

    return await fetch("http://127.0.0.1:4000", {
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
