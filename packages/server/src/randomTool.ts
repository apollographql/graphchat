import type { Tool } from 'mongodb-chatbot-server';

export const randomTool: Tool = {
  definition: {
    name: 'random',
    description: 'Generate a random number in some range',
    parameters: {
      type: 'object',
      properties: {
        min: {
          type: 'number',
          description: 'The minimum value of the random number',
        },
        max: {
          type: 'number',
          description: 'The maximum value of the random number',
        },
      },
      required: ['min', 'max'],
    },
  },
  async call({ functionArgs: { min, max } }: { functionArgs: { min: number; max: number } }) {
    const result = Math.random() * (max - min) + min;
    console.log(`Generated random number: ${result}`);
    return {
      toolCallMessage: {
        role: 'function',
        name: 'random',
        content: String(result),
      },
    };
  },
};
