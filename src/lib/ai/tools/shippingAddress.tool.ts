import { AiAgentTool, ToolContext } from '../types';

export const getUserAddresses: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getUserAddresses',
    description:
      'List all saved shipping addresses for the logged-in user. The user ID is resolved automatically from the session.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  fn: async (_args: Record<string, never>, ctx: ToolContext) => {
    const userId = ctx.userId;
    if (!userId) {
      return { error: 'Unable to resolve user identity. Please try again.' };
    }
    return ctx.serverClient.get(`/api/user/${userId}/address`);
  },
};

export const createShippingAddress: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createShippingAddress',
    description:
      'Create a new shipping address for the logged-in user. The user ID is resolved automatically from the session. Address fields are validated and geocoded by the server.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Label for the address (e.g. "Home", recipient name).' },
        line1: { type: 'string', description: 'Street address line 1.' },
        line2: { type: 'string', description: 'Street address line 2 (optional).' },
        city: { type: 'string', description: 'City.' },
        province: { type: 'string', description: 'Province (optional).' },
        postalCode: { type: 'string', description: 'Postal / ZIP code.' },
        state: { type: 'string', description: 'State or region (optional).' },
        countryCode: { type: 'string', description: 'ISO country code (defaults to MY).' },
      },
      required: ['name', 'line1', 'city', 'postalCode'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const userId = ctx.userId;
    if (!userId) {
      return { error: 'Unable to resolve user identity. Please try again.' };
    }
    return ctx.serverClient.post(`/api/user/${userId}/address`, args);
  },
};

export const updateShippingAddress: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateShippingAddress',
    description:
      'Update an existing shipping address for the logged-in user. The user ID is resolved automatically from the session. Pass isDeleted: true to soft-delete the address.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'Address ID to update.' },
        name: { type: 'string', description: 'Updated label (optional).' },
        line1: { type: 'string', description: 'Updated street address line 1 (optional).' },
        line2: { type: 'string', description: 'Updated street address line 2 (optional, nullable).' },
        city: { type: 'string', description: 'Updated city (optional).' },
        province: { type: 'string', description: 'Updated province (optional, nullable).' },
        postalCode: { type: 'string', description: 'Updated postal code (optional).' },
        state: { type: 'string', description: 'Updated state (optional, nullable).' },
        countryCode: { type: 'string', description: 'Updated country code (optional).' },
        isDeleted: { type: 'boolean', description: 'Set true to soft-delete the address.' },
      },
      required: ['addressId'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const userId = ctx.userId;
    if (!userId) {
      return { error: 'Unable to resolve user identity. Please try again.' };
    }
    const { addressId, ...body } = args;
    return ctx.serverClient.put(`/api/user/${userId}/address/${addressId}`, body);
  },
};
