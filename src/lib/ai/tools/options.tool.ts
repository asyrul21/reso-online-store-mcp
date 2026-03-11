import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getProductOptionsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductOptionsAdmin',
    description: 'List product options for a product (admin view). Excludes deleted options.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID whose options will be listed.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/admin/product/${args.productId}/options`);
  },
};

export const getProductOptionByIdAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductOptionByIdAdmin',
    description: 'Fetch a single product option by ID (admin view). Includes its values.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Option ID to retrieve.' },
      },
      required: ['productId', 'optionId'],
    },
  },
  fn: async (args: { productId: string; optionId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(
      `/api/admin/product/${args.productId}/options/${args.optionId}`,
    );
  },
};

export const createProductOptionByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createProductOptionByAdmin',
    description: `Create a new product option (e.g. Size, Color). AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to attach the option to.' },
        name: { type: 'string', description: 'Option name (e.g. Size, Color).' },
        description: { type: 'string', description: 'Optional description.' },
      },
      required: ['productId', 'name'],
    },
  },
  fn: async (
    args: { productId: string; name: string; description?: string | null },
    ctx: ToolContext,
  ) => {
    const { productId, ...body } = args;
    return ctx.serverClient.post(`/api/admin/product/${productId}/options`, body);
  },
};

export const updateProductOptionByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateProductOptionByAdmin',
    description: `Update an option by ID. AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Option ID to update.' },
        name: { type: 'string', description: 'New option name (if any, NOT nullable).' },
        description: { type: 'string', description: 'New description (if any, nullable).' },
        isHidden: { type: 'boolean', description: 'Set true to hide from shoppers.' },
      },
      required: ['productId', 'optionId'],
    },
  },
  fn: async (
    args: {
      productId: string;
      optionId: string;
      name?: string;
      description?: string | null;
      isHidden?: boolean;
    },
    ctx: ToolContext,
  ) => {
    const { productId, optionId, ...body } = args;
    return ctx.serverClient.put(
      `/api/admin/product/${productId}/options/${optionId}`,
      body,
    );
  },
};

export const getProductOptionsPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductOptionsPublic',
    description:
      'List options for a product visible to shoppers (not hidden or deleted). Includes visible option values.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID whose options will be listed.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/product/${args.productId}/options`);
  },
};
