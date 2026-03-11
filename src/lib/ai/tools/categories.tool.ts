import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getCategoriesAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getCategoriesAdmin',
    description: 'Get all categories (admin view).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/category');
  },
};

export const createCategoryByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createCategoryByAdmin',
    description: `Create a new category. AFFECTED MODULES: ${AppAllowedModules.CATEGORY}`,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Category name.' },
        description: { type: 'string', description: 'Optional category description.' },
      },
      required: ['name'],
    },
  },
  fn: async (args: { name: string; description?: string }, ctx: ToolContext) => {
    return ctx.serverClient.post('/api/admin/category', args);
  },
};

export const updateCategoryByIdByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateCategoryByIdByAdmin',
    description: `Update a category by ID. AFFECTED MODULES: ${AppAllowedModules.CATEGORY}`,
    parameters: {
      type: 'object',
      properties: {
        categoryId: { type: 'string', description: 'Category ID to update.' },
        name: { type: 'string', description: 'New category name (if any, NOT nullable).' },
        description: { type: 'string', description: 'New description (if any, nullable).' },
      },
      required: ['categoryId'],
    },
  },
  fn: async (
    args: { categoryId: string; name?: string; description?: string | null },
    ctx: ToolContext,
  ) => {
    const { categoryId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/category/${categoryId}`, body);
  },
};

export const getCategoriesPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getCategoriesPublic',
    description: 'Get all public categories visible to shoppers.',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/category');
  },
};
