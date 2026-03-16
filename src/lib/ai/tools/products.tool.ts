import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getProductsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductsAdmin',
    description:
      'Search and list products for administrators. Supports optional keyword, categoryId, and collectionId filters.',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Search by product name or description.' },
        categoryId: { type: 'string', description: 'Filter by category ID.' },
        collectionId: { type: 'string', description: 'Filter by collection ID.' },
      },
    },
  },
  fn: async (
    args: { keyword?: string; categoryId?: string; collectionId?: string },
    ctx: ToolContext,
  ) => {
    return ctx.serverClient.get('/api/admin/product', args);
  },
};

export const getProductByIdAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductByIdAdmin',
    description: 'Fetch a product by ID (admin view). Includes options, variants, and reviews.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to retrieve.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/admin/product/${args.productId}`);
  },
};

export const createProductByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createProductByAdmin',
    description: `Create a new product. Requires name and pricing. Images are not handled here. AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product display name.' },
        listPriceCents: { type: 'number', description: 'List price in cents (required).' },
        costPriceCents: { type: 'number', description: 'Cost price in cents (required).' },
        description: { type: 'string', description: 'Optional long description.' },
        brand: { type: 'string', description: 'Optional brand label.' },
        categoryId: { type: 'string', description: 'Optional category ID.' },
        collectionId: { type: 'string', description: 'Optional collection ID.' },
      },
      required: ['name', 'listPriceCents', 'costPriceCents'],
    },
  },
  fn: async (
    args: {
      name: string;
      listPriceCents: number;
      costPriceCents: number;
      description?: string | null;
      brand?: string | null;
      categoryId?: string | null;
      collectionId?: string | null;
    },
    ctx: ToolContext,
  ) => {
    return ctx.serverClient.post('/api/admin/product', args);
  },
};

export const updateProductByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateProductByAdmin',
    description: `Update an existing product by ID. Provide any fields to change. Images are not handled here. AFFECTED MODULES: ${AppAllowedModules.PRODUCT}`,
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to update.' },
        name: { type: 'string', description: 'New product name (if any, NOT nullable).' },
        description: { type: 'string', description: 'New description (if any, nullable).' },
        brand: { type: 'string', description: 'New brand label (if any).' },
        listPriceCents: { type: 'number', description: 'Updated list price in cents.' },
        costPriceCents: { type: 'number', description: 'Updated cost price in cents.' },
        categoryId: { type: 'string', description: 'New category ID (nullable).' },
        collectionId: { type: 'string', description: 'New collection ID (nullable).' },
        isHidden: { type: 'boolean', description: 'Set true to hide from storefront.' },
      },
      required: ['productId'],
    },
  },
  fn: async (
    args: {
      productId: string;
      name?: string;
      description?: string | null;
      brand?: string | null;
      listPriceCents?: number;
      costPriceCents?: number;
      categoryId?: string | null;
      collectionId?: string | null;
      isHidden?: boolean;
    },
    ctx: ToolContext,
  ) => {
    const { productId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/product/${productId}`, body);
  },
};

export const getProductsPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductsPublic',
    description:
      'Search and list products visible to shoppers. Supports optional keyword, categoryId, and collectionId filters. Hidden and deleted products are excluded.',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search by product name or description.',
        },
        categoryId: { type: 'string', description: 'Filter by category ID.' },
        collectionId: { type: 'string', description: 'Filter by collection ID.' },
      },
    },
  },
  fn: async (
    args: { keyword?: string; categoryId?: string; collectionId?: string },
    ctx: ToolContext,
  ) => {
    return ctx.serverClient.get('/api/product', args);
  },
};

export const getProductByIdPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductByIdPublic',
    description:
      'Fetch a single product by ID for shoppers. Only returns if the product is not hidden or deleted.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to retrieve.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/product/${args.productId}`);
  },
};

export const getProductBuyPagePath: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getProductBuyPagePath',
    description:
      'Get the buy page path for a product. Whenever user shows interests in a product, use this tool to get the Navigate URL',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to retrieve.' },
      },
      required: ['productId'],
    },
  },
  fn: async (args: { productId: string }, ctx: ToolContext) => {
    return `/products/${args.productId}/buy`;
  },
};
