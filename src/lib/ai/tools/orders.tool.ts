import { AiAgentTool, ToolContext } from '../types';
import { AppAllowedModules } from '../appAllowedModules';

export const getOrdersAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getOrdersAdmin',
    description: 'List all orders (admin view). Supports pagination and optional filters by status or user.',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (default 1).' },
        perPage: { type: 'number', description: 'Results per page (default 10).' },
        status: {
          type: 'string',
          description: 'Optional order status filter.',
          enum: ['PLACED', 'PROCESSING', 'SHIPPED', 'COMPLETED'],
        },
        userId: { type: 'string', description: 'Optional filter to list orders for a specific user ID.' },
      },
    },
  },
  fn: async (args: { page?: number; perPage?: number; status?: string; userId?: string }, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/admin/orders', args as any);
  },
};

export const getOrdersByUser: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getOrdersByUser',
    description: 'List orders for the currently authenticated user. Supports pagination and optional status filter.',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (default 1).' },
        perPage: { type: 'number', description: 'Results per page (default 10).' },
        status: {
          type: 'string',
          description: 'Optional order status filter.',
          enum: ['PLACED', 'PROCESSING', 'SHIPPED', 'COMPLETED'],
        },
      },
    },
  },
  fn: async (args: { page?: number; perPage?: number; status?: string }, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/order', args as any);
  },
};

export const getOrderById: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'getOrderById',
    description: 'Fetch full details of a single order by ID. Accessible by the order owner or an admin.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to retrieve.' },
      },
      required: ['orderId'],
    },
  },
  fn: async (args: { orderId: string }, ctx: ToolContext) => {
    return ctx.serverClient.get(`/api/order/${args.orderId}`);
  },
};

export const updateOrderByAdmin: AiAgentTool = {
  meta: {
    type: 'function',
    strict: false,
    name: 'updateOrderByAdmin',
    description: `Update an order by ID (admin). Can update status, remarks, and tracking URL. AFFECTED MODULES: ${AppAllowedModules.ORDER}`,
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'Order ID to update.' },
        status: {
          type: 'string',
          description: 'New order status (optional).',
          enum: ['PLACED', 'PROCESSING', 'SHIPPED', 'COMPLETED'],
        },
        remarks: { type: 'string', description: 'Admin remarks (optional).' },
        trackingUrl: { type: 'string', description: 'Shipment tracking URL (optional).' },
      },
      required: ['orderId'],
    },
  },
  fn: async (
    args: { orderId: string; status?: string; remarks?: string; trackingUrl?: string },
    ctx: ToolContext,
  ) => {
    const { orderId, ...body } = args;
    return ctx.serverClient.put(`/api/admin/orders/${orderId}`, body);
  },
};
