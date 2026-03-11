import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getShippingPriceRulesAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getShippingPriceRulesAdmin',
    description: 'List all shipping price rules (admin view).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/shippingPriceRule');
  },
};

export const createShippingPriceRuleByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createShippingPriceRuleByAdmin',
    description: `Create a new shipping price rule. AFFECTED MODULES: ${AppAllowedModules.SHIPPING}`,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Rule name.' },
        priceCents: { type: 'number', description: 'Shipping price in cents.' },
        minWeightInGrams: { type: 'number', description: 'Minimum weight threshold in grams (optional).' },
        maxWeightInGrams: { type: 'number', description: 'Maximum weight threshold in grams (optional).' },
        countryCode: { type: 'string', description: 'Country code this rule applies to (optional).' },
      },
      required: ['name', 'priceCents'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    return ctx.serverClient.post('/api/admin/shippingPriceRule', args);
  },
};

export const getShippingPricePublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getShippingPricePublic',
    description: 'Calculate the shipping price for a given delivery address and parcel weight. Returns the applicable shipping cost in cents.',
    parameters: {
      type: 'object',
      properties: {
        addressLine1: { type: 'string', description: 'Street address line 1.' },
        addressLine2: { type: 'string', description: 'Street address line 2 (optional).' },
        city: { type: 'string', description: 'City.' },
        postalCode: { type: 'string', description: 'Postal / ZIP code.' },
        state: { type: 'string', description: 'State or region.' },
        countryCode: { type: 'string', description: 'ISO country code (e.g. MY).' },
        totalWeightGrams: { type: 'number', description: 'Total parcel weight in grams.' },
      },
      required: ['addressLine1', 'city', 'postalCode', 'state', 'countryCode', 'totalWeightGrams'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/shipping-price', args);
  },
};

export const updateShippingPriceRuleByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateShippingPriceRuleByAdmin',
    description: `Update a shipping price rule by ID. AFFECTED MODULES: ${AppAllowedModules.SHIPPING}`,
    parameters: {
      type: 'object',
      properties: {
        shippingPriceRuleId: { type: 'string', description: 'Shipping price rule ID to update.' },
        name: { type: 'string', description: 'Updated rule name (optional).' },
        priceCents: { type: 'number', description: 'Updated price in cents (optional).' },
        minWeightInGrams: { type: 'number', description: 'Updated min weight (optional).' },
        maxWeightInGrams: { type: 'number', description: 'Updated max weight (optional).' },
        isActive: { type: 'boolean', description: 'Enable or disable the rule.' },
      },
      required: ['shippingPriceRuleId'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const { shippingPriceRuleId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/shippingPriceRule/${shippingPriceRuleId}`, body);
  },
};
