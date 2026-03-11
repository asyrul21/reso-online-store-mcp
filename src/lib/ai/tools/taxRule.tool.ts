import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getTaxRulesAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getTaxRulesAdmin',
    description: 'List all tax rules (admin view).',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/taxRule');
  },
};

export const createTaxRuleByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createTaxRuleByAdmin',
    description: `Create a new tax rule. AFFECTED MODULES: ${AppAllowedModules.TAX}`,
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tax rule name.' },
        ratePercentage: { type: 'number', description: 'Tax rate as a percentage (e.g. 6 for 6%).' },
        countryCode: { type: 'string', description: 'Country code this rule applies to (optional).' },
      },
      required: ['name', 'ratePercentage'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    return ctx.serverClient.post('/api/admin/taxRule', args);
  },
};

export const getTaxAmountPublic: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getTaxAmountPublic',
    description: 'Retrieve the currently active tax rule (rate percentage and details) visible to shoppers.',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/tax');
  },
};

export const updateTaxRuleByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateTaxRuleByAdmin',
    description: `Update a tax rule by ID. AFFECTED MODULES: ${AppAllowedModules.TAX}`,
    parameters: {
      type: 'object',
      properties: {
        taxRuleId: { type: 'string', description: 'Tax rule ID to update.' },
        name: { type: 'string', description: 'Updated rule name (optional).' },
        ratePercentage: { type: 'number', description: 'Updated rate percentage (optional).' },
        isActive: { type: 'boolean', description: 'Enable or disable the rule.' },
      },
      required: ['taxRuleId'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const { taxRuleId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/taxRule/${taxRuleId}`, body);
  },
};
