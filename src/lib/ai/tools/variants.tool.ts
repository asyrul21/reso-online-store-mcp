import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getProductVariantsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductVariantsAdmin',
    description:
      'List all variants for a product (including hidden) that are not deleted. Use to audit inventory and option coverage.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID whose variants will be listed.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/admin/product/${args.productId}/variants`);
  },
};

export const getProductVariantByIdAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductVariantByIdAdmin',
    description: 'Fetch a single variant by ID (admin view). Includes assigned option values.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        variantId: { type: 'string', description: 'Variant ID to retrieve.' },
      },
      required: ['productId', 'variantId'],
    },
  },
  fn: async (args: { productId: string; variantId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(
      `/api/admin/product/${args.productId}/variants/${args.variantId}`,
    );
  },
};

export const verifyProductVariantsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'verifyProductVariantsAdmin',
    description:
      'Verify whether all product variants are correctly configured (all option combinations are covered).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to verify variants for.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(
      `/api/admin/product/${args.productId}/variants/verify`,
    );
  },
};

export const createProductVariantByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createProductVariantByAdmin',
    description: `Create a product variant. Requires productId, countInStock, weightInGrams, and optionValues (optionId + valueId pairs). Images are not handled.
When creating variants, for EACH optionValue, you MUST make sure:
1. The option exists and is not deleted.
2. The value exists and is not deleted.
3. The option value combination does not already exist.
AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to attach the new variant to.' },
        countInStock: { type: 'number', description: 'Current stock count (required).' },
        weightInGrams: { type: 'number', description: 'Weight in grams (required).' },
        sku: { type: 'string', description: 'Optional SKU.' },
        optionValues: {
          type: 'array',
          description: 'Required option/value pairs that define the variant combination.',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string', description: 'Product option ID.' },
              valueId: { type: 'string', description: 'Option value ID.' },
            },
            required: ['optionId', 'valueId'],
          },
        },
      },
      required: ['productId', 'countInStock', 'weightInGrams', 'optionValues'],
    },
  },
  fn: async (
    args: {
      productId: string;
      countInStock: number;
      weightInGrams: number;
      sku?: string | null;
      optionValues: { optionId: string; valueId: string }[];
    },
    ctx: ToolContext,
  ) => {
    const { productId, ...body } = args;
    return ctx.serverClient.post(`/api/admin/product/${productId}/variants`, body);
  },
};

export const updateProductVariantByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateProductVariantByAdmin',
    description: `Update a variant by ID. Provide any fields that should change. Option values will be replaced with the provided list when supplied.
AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        variantId: { type: 'string', description: 'Variant ID to update.' },
        countInStock: { type: 'number', description: 'Updated stock count.' },
        weightInGrams: { type: 'number', description: 'Updated weight in grams.' },
        sku: { type: 'string', description: 'Updated SKU.' },
        isHidden: { type: 'boolean', description: 'Set true to hide the variant.' },
        optionValues: {
          type: 'array',
          description: 'Optional replacement list of option/value pairs.',
          items: {
            type: 'object',
            properties: {
              optionId: { type: 'string' },
              valueId: { type: 'string' },
            },
            required: ['optionId', 'valueId'],
          },
        },
      },
      required: ['productId', 'variantId'],
    },
  },
  fn: async (
    args: {
      productId: string;
      variantId: string;
      countInStock?: number;
      weightInGrams?: number;
      sku?: string | null;
      isHidden?: boolean;
      optionValues?: { optionId: string; valueId: string }[];
    },
    ctx: ToolContext,
  ) => {
    const { productId, variantId, ...body } = args;
    return ctx.serverClient.put(
      `/api/admin/product/${productId}/variants/${variantId}`,
      body,
    );
  },
};

export const getProductVariantsPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductVariantsPublic',
    description: 'List variants for a product visible to shoppers (not hidden, not deleted).',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID whose variants will be listed.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/product/${args.productId}/variants`);
  },
};

export const getProductVariantByIdPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductVariantByIdPublic',
    description:
      `Fetch a single variant by ID for shoppers. Only returns if not hidden or deleted. 
      ALWAYS USE THIS TOOL:
      1. before showcasing products to users.
      2. Before adding the product variant to the cart
      3. ONLY show and allow users to add to cart products and variants that are in stock.'`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Owning product ID.' },
        variantId: { type: 'string', description: 'Variant ID to retrieve.' },
      },
      required: ['productId', 'variantId'],
    },
  },
  fn: async (args: { productId: string; variantId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(
      `/api/product/${args.productId}/variants/${args.variantId}`,
    );
  },
};
