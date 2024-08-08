import type { Tool } from "mongodb-chatbot-server";

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
  }) {
    // For now, just log the call and return a placeholder response
    console.log(`Fetching persisted query with id ${id} and variables ${
      JSON.stringify(variables, null, 2)
    }`);
    return {
      toolCallMessage: {
        role: "function",
        name: "persistedQuery",
        content: "Show the function invocation with id and variables, and explain that the actual fetching still needs to be hooked up",
      },
    };
  }
};
