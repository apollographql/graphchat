import type { Tool, CallToolResponse } from "mongodb-chatbot-server";

const formatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const delay = 5;
async function log(message: string) {
  const date = formatter.format(new Date());
  const formattedMessage = `${date}: ${message}`;
  for (var i = 0; i < formattedMessage.length; i++) {
    process.stdout.write(formattedMessage[i]);
    await sleep(delay);
  }
  console.log("");
}

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
          description:
            "The host and port of the router to use when fetching the query",
        },
        variables: {
          type: "object",
          description: "The variables to use when fetching the query",
        },
      },
      required: ["id", "routerListenHost"],
    },
  },

  async call({
    functionArgs: args,
  }: {
    functionArgs: {
      id: string;
      routerListenHost: string;
      variables: Record<string, any>;
    };
  }): Promise<CallToolResponse> {
    const url = `http://${args.routerListenHost}`;
    await log(`Executing operation ${args.id}`);

    if (args.variables)
      await log(`with variables: ${JSON.stringify(args.variables, null, 2)}`);

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

    return await fetch(
      url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then(
        (result) => {
          if (!result.data) console.log(JSON.stringify(result));
          let data = result.data;
          removeTypename(data);

          data = JSON.stringify(data, null, 2);

          log(`Results: ${data}`);

          return {
            toolCallMessage: {
              role: "function",
              name: "persistedQuery",
              content: JSON.stringify(result, null, 2),
            },
          };
        },
        (error) => {
          console.error(`Error fetching persisted query: ${error.message}`);
          return {
            toolCallMessage: {
              role: "function",
              name: "persistedQuery",
              content: `Error fetching persisted query: ${error.message}`,
            },
          };
        }
      );
  },
};

function removeTypename(obj: any) {
  for (const prop in obj) {
    if (prop === "__typename") delete obj[prop];
    else if (typeof obj[prop] === "object") removeTypename(obj[prop]);
  }
}