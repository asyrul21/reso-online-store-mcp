import { AiAgentTool, ToolContext } from '../types';

export const getCountryCodes: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getCountryCodes',
    description: 'Retrieve the list of country codes supported by this online store.',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/currency/country-codes');
  },
};

export const getClientCurrency: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getClientCurrency',
    description:
      'Retrieve the resolved currency for the current request, derived from the client-country-code header. Useful for displaying correct currency context to the shopper.',
    parameters: null,
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/currency');
  },
};
