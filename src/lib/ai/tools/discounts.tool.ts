import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getDiscountsAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getDiscountsAdmin',
    description: 'List all discount rules (admin view).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/discounts');
  },
};

export const createDiscountByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createDiscountByAdmin',
    description: `Create a new discount rule. AFFECTED MODULES: ${AppAllowedModules.DISCOUNT}`,
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Discount code.' },
        type: { type: 'string', description: 'Discount type (e.g. PERCENTAGE, FIXED_AMOUNT).' },
        value: { type: 'number', description: 'Discount value.' },
        productId: { type: 'string', description: 'Optional product ID to restrict to.' },
        categoryId: { type: 'string', description: 'Optional category ID to restrict to.' },
        collectionId: { type: 'string', description: 'Optional collection ID to restrict to.' },
        maxUsageCount: { type: 'number', description: 'Maximum number of uses (optional).' },
        expiresAt: { type: 'string', description: 'Expiry date ISO string (optional).' },
      },
      required: ['code', 'type', 'value'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    return ctx.serverClient.post('/api/admin/discounts', args);
  },
};

export const getDiscountsPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getDiscountsPublic',
    description: 'List currently active discount rules visible to shoppers (not expired, already started).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/discounts');
  },
};

export const updateDiscountByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateDiscountByAdmin',
    description: `Update a discount rule by ID. AFFECTED MODULES: ${AppAllowedModules.DISCOUNT}`,
    parameters: {
      type: 'object',
      properties: {
        discountId: { type: 'string', description: 'Discount ID to update.' },
        code: { type: 'string', description: 'Updated discount code (optional).' },
        type: { type: 'string', description: 'Updated type (optional).' },
        value: { type: 'number', description: 'Updated value (optional).' },
        isActive: { type: 'boolean', description: 'Enable or disable the discount.' },
        maxUsageCount: { type: 'number', description: 'Updated max usage count (optional).' },
        expiresAt: { type: 'string', description: 'Updated expiry date ISO string (optional).' },
      },
      required: ['discountId'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const { discountId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/discounts/${discountId}`, body);
  },
};
