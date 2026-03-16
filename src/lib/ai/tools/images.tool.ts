import { AiAgentTool, ToolContext } from "../types";
import config from "../../../config";
const { ENV_API_SERVER_URL } = config;

export const getImageUrlFromKey: AiAgentTool = {
    meta: {
      type: 'function',
      strict: false,
      name: 'getImageUrlFromKey',
      description: 'Retrieve the Image src path for a product or a collection. If a model has an image key, use this tool to get the image src path.',
      parameters: {
        type: 'object',
        properties: {
          imageKey: { type: 'string', description: 'The S3 key of the saved image.' }
        },
        required: ['imageKey'],
      },
    },
    fn: async (args: { imageKey: string }, ctx: ToolContext) => {
        return `${ENV_API_SERVER_URL}/api/images/${args.imageKey}`;
    },
  };