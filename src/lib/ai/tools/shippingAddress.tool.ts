import { AiAgentTool, ToolContext } from '../types';

export const getUserAddresses: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getUserAddresses',
    description:
      'List all saved shipping addresses for a user. Accessible by the address owner or an admin.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID whose addresses to fetch.' },
      },
      required: ['userId'],
    },
  },
  fn: async (args: { userId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/user/${args.userId}/address`);
  },
};

export const createShippingAddress: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'createShippingAddress',
    description:
      'Create a new shipping address for a user. The caller must be the owner of the userId. Address fields are validated and geocoded by the server.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID to create the address for (must match the authenticated user).' },
        name: { type: 'string', description: 'Label for the address (e.g. "Home", recipient name).' },
        line1: { type: 'string', description: 'Street address line 1.' },
        line2: { type: 'string', description: 'Street address line 2 (optional).' },
        city: { type: 'string', description: 'City.' },
        province: { type: 'string', description: 'Province (optional).' },
        postalCode: { type: 'string', description: 'Postal / ZIP code.' },
        state: { type: 'string', description: 'State or region (optional).' },
        countryCode: { type: 'string', description: 'ISO country code (defaults to MY).' },
      },
      required: ['userId', 'name', 'line1', 'city', 'postalCode'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const { userId, ...body } = args;
    return ctx.serverClient.post(`/api/user/${userId}/address`, body);
  },
};

export const updateShippingAddress: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateShippingAddress',
    description:
      'Update an existing shipping address. The caller must be the owner of the address. Pass isDeleted: true to soft-delete the address.',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'User ID who owns the address.' },
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
      required: ['userId', 'addressId'],
    },
  },
  fn: async (args: Record<string, any>, ctx: ToolContext) => {
    const { userId, addressId, ...body } = args;
    return ctx.serverClient.put(`/api/user/${userId}/address/${addressId}`, body);
  },
};
