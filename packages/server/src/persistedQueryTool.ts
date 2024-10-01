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
    await log(
      `Fetching persisted query with id ${
        args.id
      } and variables ${JSON.stringify(args.variables, null, 2)} from ${
        args.routerListenHost
      }`
    );

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

    return await fetch('https://router-chatbot-production.up.railway.app/',{//`http://${args.routerListenHost}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then((response) => response.json())
      .then(
        (result) => {
          let data = result.data;
          removeTypenamme(data);
          collapseEdgesAndNodes(data);
          collapseEmptyArrays(data);
          getCollapsed(data);

          if (data?.products) {
            data?.products.forEach((p: any) => {
              if (p.images.hero)
                p.images.hero = "https://keynote-strapi-production.up.railway.app" + p.images.hero;
              if(p.images.thumbnail)
                p.images.thumbnail = "https://keynote-strapi-production.up.railway.app" + p.images.thumbnail;
            });
          } else if (data?.product) {
              if (data?.product.images.hero)
                data.product.images.hero = "https://keynote-strapi-production.up.railway.app" + data.product.images.hero;
              if(result.data?.product.images.thumbnail)
                data.product.images.thumbnail = "https://keynote-strapi-production.up.railway.app" + data.productimages.thumbnail;
          }

          data = JSON.stringify(data, null, 2)

          log(`Got persisted query result: ${data}`);

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

function collapseEmptyArrays(obj: any) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const prop = obj[key];
    if (prop instanceof Array) {
      if (prop.length === 0) {
        delete obj[key];
      } else if (prop.length >= 1) {
        prop.forEach((item: any) => collapseEmptyArrays(item));
      }
    } else if (typeof prop === "object") collapseEmptyArrays(prop);
  }
}

function collapseEdgesAndNodes(obj: any): any {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = collapseEdgesAndNodes(JSON.parse(JSON.stringify(obj[i])));
    }

    return obj;
  } else if (typeof obj === "object") {
    const keys = Object.keys(obj);

    if (
      keys.length === 1 &&
      (keys[0] === "edges" || keys[0] === "node" || keys[0] === "nodes")
    ) {
      console.log(obj[keys[0]]);
      return collapseEdgesAndNodes(obj[keys[0]]);
    } else {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (typeof obj[key] === "object")
          obj[key] = collapseEdgesAndNodes(obj[key]);
      }
    }

    return obj;
  }
}

function removeTypenamme(obj: any) {
  for (const prop in obj) {
    if (prop === "__typename") delete obj[prop];
    else if (typeof obj[prop] === "object") removeTypenamme(obj[prop]);
  }
}
let collapsed = 0;
function getCollapsed(obj: any) {
  for (const prop in obj) {
    const items = Object.keys(obj[prop]);
    if (items.length === 1) {
      collapsed++;
      getCollapsed(obj[prop]);
    }
  }
}
