import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getCollectionsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getCollectionsAdmin',
    description: 'List all collections (admin view, including hidden).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/collection');
  },
};

export const createCollectionByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createCollectionByAdmin',
    description: `Create a new collection. AFFECTED MODULES: ${AppAllowedModules.COLLECTION}`,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Collection name.' },
        description: { type: 'string', description: 'Optional description.' },
      },
      required: ['name'],
    },
  },
  fn: async (args: { name: string; description?: string | null }, ctx: ToolContext) => {
    return ctx.serverClient.post('/api/admin/collection', args);
  },
};

export const updateCollectionByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateCollectionByAdmin',
    description: `Update a collection by ID. AFFECTED MODULES: ${AppAllowedModules.COLLECTION}`,
    parameters: {
      type: 'object',
      properties: {
        collectionId: { type: 'string', description: 'Collection ID to update.' },
        name: { type: 'string', description: 'New name (if any, NOT nullable).' },
        description: { type: 'string', description: 'New description (if any, nullable).' },
        isHidden: { type: 'boolean', description: 'Set true to hide from storefront.' },
      },
      required: ['collectionId'],
    },
  },
  fn: async (
    args: { collectionId: string; name?: string; description?: string | null; isHidden?: boolean },
    ctx: ToolContext,
  ) => {
    const { collectionId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/collection/${collectionId}`, body);
  },
};

export const getCollectionsPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getCollectionsPublic',
    description: 'List collections visible to shoppers (not hidden, not deleted).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/collection');
  },
};
