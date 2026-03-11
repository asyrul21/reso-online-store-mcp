import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getProductOptionValuesAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductOptionValuesAdmin',
    description: 'List option values for a given product option (admin view). Excludes deleted values.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Option ID whose values will be listed.' },
      },
      required: ['productId', 'optionId'],
    },
  },
  fn: async (args: { productId: string; optionId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(
      `/api/admin/product/${args.productId}/options/${args.optionId}/values`,
    );
  },
};

export const getProductOptionValueByIdAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductOptionValueByIdAdmin',
    description: 'Fetch a single option value by ID (admin view).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Owning option ID.' },
        optionValueId: { type: 'string', description: 'Option value ID to retrieve.' },
      },
      required: ['productId', 'optionId', 'optionValueId'],
    },
  },
  fn: async (
    args: { productId: string; optionId: string; optionValueId: string },
    ctx: ToolContext,
  ) => {
    return ctx.serverClient.get(
      `/api/admin/product/${args.productId}/options/${args.optionId}/values/${args.optionValueId}`,
    );
  },
};

export const createOptionValueByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createOptionValueByAdmin',
    description: `Create a new option value under a specific option (e.g. "Red", "XL"). AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Owning option ID.' },
        value: { type: 'string', description: 'Display value (e.g. "Red", "XL").' },
        description: { type: 'string', description: 'Optional description.' },
      },
      required: ['productId', 'optionId', 'value'],
    },
  },
  fn: async (
    args: { productId: string; optionId: string; value: string; description?: string | null },
    ctx: ToolContext,
  ) => {
    const { productId, optionId, ...body } = args;
    return ctx.serverClient.post(
      `/api/admin/product/${productId}/options/${optionId}/values`,
      body,
    );
  },
};

export const updateOptionValueByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateOptionValueByAdmin',
    description: `Update an option value by ID. AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        optionId: { type: 'string', description: 'Owning option ID.' },
        optionValueId: { type: 'string', description: 'Option value ID to update.' },
        value: { type: 'string', description: 'Updated value label (if any, NOT nullable).' },
        description: { type: 'string', description: 'Updated description (if any, nullable).' },
        isHidden: { type: 'boolean', description: 'Set true to hide from shoppers.' },
      },
      required: ['productId', 'optionId', 'optionValueId'],
    },
  },
  fn: async (
    args: {
      productId: string;
      optionId: string;
      optionValueId: string;
      value?: string;
      description?: string | null;
      isHidden?: boolean;
    },
    ctx: ToolContext,
  ) => {
    const { productId, optionId, optionValueId, ...body } = args;
    return ctx.serverClient.put(
      `/api/admin/product/${productId}/options/${optionId}/values/${optionValueId}`,
      body,
    );
  },
};

